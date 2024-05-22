/*global platypus */
import {AnimatedSprite, TextureSource, Container, Point, Rectangle, Sprite, Texture} from 'pixi.js';
import {arrayCache, greenSlice} from './utils/array.js';
import Data from './Data.js';

const
    MAX_KEY_LENGTH_PER_IMAGE = 128,
    animationCache = {},
    textureSourceCache = {},
    doNothing = function () {},
    emptyFrame = Texture.EMPTY,
    regex = /[\[\]{},-]/g,
    getTextureSources = function (images) {
        const
            assetCache = platypus.assetCache,
            bts = arrayCache.setUp();
        
        for (let i = 0; i < images.length; i++) {
            const
                path = images[i];

            if (typeof path === 'string') {
                if (!textureSourceCache[path]) {
                    const
                        asset = assetCache.get(path);

                    if (!asset) {
                        platypus.debug.warn(`PIXIAnimation: "${path}" is not a loaded asset.`);
                        break;
                    }
                    textureSourceCache[path] = asset.source;
                }
                bts.push(textureSourceCache[path]);
            } else {
                bts.push(new TextureSource(path));
            }
        }
        
        return bts;
    },
    getTexturesCacheId = function (spriteSheet) {
        if (spriteSheet.id) {
            return spriteSheet.id;
        }
        
        for (let i = 0; i < spriteSheet.images.length; i++) {
            if (typeof spriteSheet.images[i] !== 'string') {
                return '';
            }
        }
        
        spriteSheet.id = JSON.stringify(spriteSheet).replace(regex, '');

        return spriteSheet.id;
    },
    getDefaultAnimation = function (length, textures) {
        const
            frames = arrayCache.setUp();
        
        for (let i = 0; i < length; i++) {
            frames.push(textures[i] ?? emptyFrame);
        }
        return Data.setUp(
            "id", "default",
            "frames", frames,
            "next", "default",
            "speed", 1
        );
    },
    standardizeAnimations = function (def, textures) {
        const
            anims = Data.setUp(),
            keys = Object.keys(def),
            {length} = keys;

        for (let i = 0; i < length; i++) {
            const
                key = keys[i],
                animation = def[key],
                frames = greenSlice(animation.frames);
            let j = frames.length;

            while (j--) {
                frames[j] = textures[frames[j]] || emptyFrame;
            }

            anims[key] = Data.setUp(
                'id', key,
                'frames', frames,
                'next', animation.next,
                'speed', animation.speed
            );
        }

        if (!anims.default) {
            // Set up a default animation that plays through all frames
            anims.default = getDefaultAnimation(textures.length, textures);
        }
        
        return anims;
    },
    getAnimations = function (spriteSheet = {}) {
        const
            {frames, images} = spriteSheet,
            bases = getTextureSources(images),
            textures = frames.map((frame) => new Texture(bases[frame[4]], new Rectangle(frame[0], frame[1], frame[2], frame[3]), null, null, 0, new Point((frame[5] || 0) / frame[2], (frame[6] || 0) / frame[3]))), // Set up texture for each frame
            anims = standardizeAnimations(spriteSheet.animations, textures); // Set up animations

        // Set up a default animation that plays through all frames
        if (!anims.default) {
            anims.default = getDefaultAnimation(textures.length, textures);
        }
        
        arrayCache.recycle(bases);
        
        return Data.setUp(
            "textures", textures,
            "animations", anims
        );
    },
    cacheAnimations = function (spriteSheet, cacheId) {
        const
            {frames, images} = spriteSheet,
            bases = getTextureSources(images),
            textures = frames.map((frame) => new Texture(bases[frame[4]], new Rectangle(frame[0], frame[1], frame[2], frame[3]), null, null, 0, new Point((frame[5] || 0) / frame[2], (frame[6] || 0) / frame[3]))), // Set up texture for each frame
            anims = standardizeAnimations(spriteSheet.animations, textures); // Set up animations

        arrayCache.recycle(bases);
        
        return Data.setUp(
            "textures", textures,
            "animations", anims,
            "viable", 1,
            "cacheId", cacheId
        );
    },
    /**
     * This class plays animation sequences of frames and mimics the syntax required for creating CreateJS Sprites, allowing CreateJS Sprite Sheet definitions to be used with PixiJS.
     *
     * @memberof platypus
     * @class PIXIAnimation
     * @param {Object} spriteSheet JSON sprite sheet definition.
     * @param {string} animation The name of the animation to start playing.
     */
    PIXIAnimation = class extends Container {
        constructor (spriteSheet, animation) {
            const
                FR = 60,
                cacheId = getTexturesCacheId(spriteSheet),
                speed = (spriteSheet.framerate || FR) / FR;
            let cache = (cacheId ? animationCache[cacheId] : null);

            super();

            if (!cacheId) {
                cache = getAnimations(spriteSheet);
            } else if (!cache) {
                cache = animationCache[cacheId] = cacheAnimations(spriteSheet, cacheId);
                this.cacheId = cacheId;
            } else {
                cache.viable += 1;
                this.cacheId = cacheId;
            }

            /**
            * @private
            */
            this._animations = {};
            {
                const
                    _animations = this._animations,
                    {animations} = cache,
                    keys = Object.keys(animations),
                    {length} = keys;

                for (let i = 0; i < length; i++) {
                    const
                        key = keys[i],
                        animation = animations[key];

                    if (animation.frames.length === 1) {
                        _animations[key] = new Sprite(animation.frames[0]);
                    } else {
                        const anim = _animations[key] = new AnimatedSprite(animation.frames);

                        anim.animationSpeed = speed * animation.speed;
                        anim.onComplete = anim.onLoop = () => {
                            if (this.onComplete) {
                                this.onComplete(key);
                            }
                            if (animation.next) {
                                this.gotoAndPlay(animation.next);
                            }
                        };
                        anim.updateAnchor = true;
                    }
                }
            }
                
            this._animation = null;
        
            /**
            * The speed that the PIXIAnimation will play at. Higher is faster, lower is slower
            *
            * @member {number}
            * @default 1
            */
            this.animationSpeed = speed;

            /**
             * The currently playing animation name.
             *
             * @property currentAnimation
             * @default ""
             * @type String
             */
            this.currentAnimation = null;
        
            /**
            * Indicates if the PIXIAnimation is currently playing
            *
            * @member {boolean}
            * @readonly
            */
            this.playing = false;
            
            this._visible = true;
            
            this._updating = false;

            /*
            * Updates the object transform for rendering
            * @private
            */
            this.update = doNothing;

            // Set up initial playthrough.
            this.gotoAndPlay(animation);
        }

        get visible () {
            return this._visible;
        }

        set visible (value) {
            this._visible = value;
        }
    
        /**
        * The PIXIAnimations paused state. If paused, the animation doesn't update.
        *
        * @property paused
        * @memberof platypus.PIXIAnimation.prototype
        */
        get paused () {
            return !this.playing;
        }
        set paused (value) {
            if ((value && this.playing) || (!value && !this.playing)) {
                this.playing = !value;
            }
        }

        /**
        * Stops the PIXIAnimation
        *
        * @method platypus.PIXIAnimation#stop
        */
        stop () {
            this.paused = true;
        };
                
        /**
        * Plays the PIXIAnimation
        *
        * @method platypus.PIXIAnimation#play
        */
        play () {
            this.paused = false;
        };
        
        /**
        * Stops the PIXIAnimation and goes to a specific frame
        *
        * @method platypus.PIXIAnimation#gotoAndStop
        * @param animation {number} frame index to stop at
        */
        gotoAndStop (animation) {
            this.stop();
            if (this._animation && this._animation.stop) {
                this._animation.stop();
            }
        
            this._animation = this._animations[animation];
            if (!this._animation) {
                this._animation = this._animations.default;
            }
            this.removeChildren();
            this.addChild(this._animation);
        };

        /**
        * Goes to a specific frame and begins playing the PIXIAnimation
        *
        * @method platypus.PIXIAnimation#gotoAndPlay
        * @param animation {string} The animation to begin playing.
        * @param [loop = true] {Boolean} Whether this animation should loop.
        * @param [restart = true] {Boolean} Whether to restart the animation if it's currently playing.
        */
        gotoAndPlay (animation, loop = true, restart = true) {
            if ((this.currentAnimation !== animation) || restart) {
                if (this._animation && this._animation.stop) {
                    this._animation.stop();
                }
                this._animation = this._animations[animation];
                this.currentAnimation = animation;
                if (!this._animation) {
                    this._animation = this._animations.default;
                    this.currentAnimation = 'default';
                }
                this.removeChildren();
                this.addChild(this._animation);
            }

            this._animation.loop = loop;
            
            if (this._animation.play) {
                this._animation.play();
            }
            this.play();
        };

        /**
        * Returns whether a particular animation is available.
        *
        * @method platypus.PIXIAnimation#has
        * @param animation {string} The animation to check.
        */
        has (animation) {
            return !!this._animations[animation];
        };

        /**
         * Stops the PIXIAnimation and destroys it
         *
         * @method platypus.PIXIAnimation#destroy
         */
        destroy () {
            this.stop();
            if (this._animation?.stop) {
                this._animation.stop();
            }
            super.destroy();
            if (this.cacheId) {
                const
                    cachedAnimation = animationCache[this.cacheId];

                cachedAnimation.viable -= 1;
                if (cachedAnimation.viable <= 0) {
                    arrayCache.recycle(cachedAnimation.textures);
                    
                    const
                        animations = cachedAnimation.animations,
                        keys = Object.keys(animations),
                        {length} = keys;
            
                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];
        
                        arrayCache.recycle(animations[key].frames);
                    }
                    delete animationCache[this.cacheId];
                }
            }
        };

        static get EmptySpriteSheet () {
            return {
                framerate: 60,
                frames: [],
                images: [],
                animations: {},
                recycleSpriteSheet: function () {
                    // We don't recycle this sprite sheet.
                }
            };
        }
        
        /**
         * This method formats a provided value into a valid PIXIAnimation Sprite Sheet. This includes accepting the EaselJS spec, strings mapping to Platypus sprite sheets, or arrays of either.
         *
         * @method platypus.PIXIAnimation.formatSpriteSheet
         * @param spriteSheet {String|Array|Object} The value to cast to a valid Sprite Sheet.
         * @return {Object}
         */
        static formatSpriteSheet (spriteSheet) {
            const
                imageParts = /([\w-\.]+)\.(\w+)$/,
                addAnimations = function (source = {}, destination, speedRatio, firstFrameIndex, id) {
                    const
                        keys = Object.keys(source),
                        {length} = keys;
            
                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];
            
                        if (destination[key]) {
                            arrayCache.recycle(destination[key].frames);
                            destination[key].recycle();
                            platypus.debug.log('PIXIAnimation "' + id + '": Overwriting duplicate animation for "' + key + '".');
                        }
                        destination[key] = formatAnimation(key, source[key], speedRatio, firstFrameIndex);
                    }
                },
                addFrameObject = function (source, destination, firstImageIndex, bases) {
                    const
                        {width, height, regX = 0, regY = 0} = source;
                    
                    for (let i = 0; i < bases.length; i++) {
                        // Subtract the size of a frame so that margin slivers aren't returned as frames.
                        const
                            base = bases[i],
                            w = base.realWidth - width,
                            h = base.realHeight - height;
                        
                        for (let y = 0; y <= h; y += height) {
                            for (let x = 0; x <= w; x += width) {
                                destination.push([x, y, width, height, i + firstImageIndex, regX, regY]);
                            }
                        }
                    }
                },
                addFrameArray = function (source, destination, firstImageIndex) {
                    for (let i = 0; i < source.length; i++) {
                        const
                            frame = source[i];

                        destination.push(arrayCache.setUp(
                            frame[0],
                            frame[1],
                            frame[2],
                            frame[3],
                            frame[4] + firstImageIndex,
                            frame[5],
                            frame[6]
                        ));
                    }
                },
                createId = (images) => images.map((image) => (image.src ?? image).substring(0, MAX_KEY_LENGTH_PER_IMAGE)).join(','),
                format = function (source, destination) {
                    const
                        {
                            animations: sAnims,
                            id: sID,
                            images: sImages,
                            framerate: sFR = 60,
                            frames: sFrames
                        } = source,
                        {
                            animations: dAnims,
                            id: dID,
                            images: dImages,
                            framerate: dFR = 60,
                            frames: dFrames
                        } = destination,
                        images = sImages.map((image) => formatImages(image)),
                        firstImageIndex = dImages.length,
                        firstFrameIndex = dFrames.length;
                    
                    // Set up id
                    if (dID) {
                        destination.id = `${dID};${sID ?? createId(sImages)}`;
                    } else {
                        destination.id = sID ?? createId(sImages);
                    }
                    
                    // Set up images array
                    dImages.push(...images);

                    // Set up frames array
                    if (Array.isArray(sFrames)) {
                        addFrameArray(sFrames, dFrames, firstImageIndex);
                    } else {
                        const
                            bases = getTextureSources(images);

                        addFrameObject(sFrames, dFrames, firstImageIndex, bases);
                        arrayCache.recycle(bases);
                    }
                    
                    // Set up animations object
                    addAnimations(sAnims, dAnims, sFR / dFR, firstFrameIndex, destination.id);
                    
                    arrayCache.recycle(images);
                    
                    return destination;
                },
                formatAnimation = function (key, animation, speedRatio, firstFrameIndex) {
                    const
                        frames = arrayCache.setUp();
                    
                    if (typeof animation === 'number') {
                        frames.push(animation + firstFrameIndex);
                        return Data.setUp(
                            "frames", frames,
                            "next", key,
                            "speed", speedRatio
                        );
                    } else if (Array.isArray(animation)) {
                        const
                            first = animation[0] ?? 0,
                            last = (animation[1] ?? first) + 1 + firstFrameIndex,
                            offsetFirst = first + firstFrameIndex;

                        for (let i = offsetFirst; i < last; i++) {
                            frames.push(i);
                        }
                        return Data.setUp(
                            "frames", frames,
                            "next", animation[2] || key,
                            "speed", (animation[3] || 1) * speedRatio
                        );
                    } else {
                        for (let i = 0; i < animation.frames.length; i++) {
                            frames.push(animation.frames[i] + firstFrameIndex);
                        }
                        return Data.setUp(
                            "frames", frames,
                            "next", animation.next || key,
                            "speed", (animation.speed || 1) * speedRatio
                        );
                    }
                },
                formatImages = function (name) {
                    if (typeof name === 'string') {
                        const
                            match = name.match(imageParts);

                        if (match) {
                            return match[1];
                        }
                    }

                    return name;
                },
                recycle = function () {
                    const
                        animations = this.animations,
                        keys = Object.keys(animations),
                        {length} = keys;
            
                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];
            
                        arrayCache.recycle(animations[key].frames);
                        animations[key].recycle();
                    }
                    
                    arrayCache.recycle(this.frames, 2);
                    this.frames = null;
                    arrayCache.recycle(this.images);
                    this.images = null;
                    this.recycle();
                },
                merge = function (spriteSheets, destination) {
                    let i = spriteSheets.length;
                    
                    while (i--) {
                        let ss = spriteSheets[i];

                        if (typeof ss === 'string') {
                            ss = platypus.game.settings.spriteSheets[ss];
                        }
                        if (ss) {
                            format(ss, destination);
                        }
                    }
                    
                    return destination;
                };
            let response = PIXIAnimation.EmptySpriteSheet,
                ss = spriteSheet;
                
            if (typeof ss === 'string') {
                ss = platypus.game.settings.spriteSheets[spriteSheet];
            }
            
            if (ss) {
                response = Data.setUp(
                    "animations", Data.setUp(),
                    "framerate", 60,
                    "frames", arrayCache.setUp(),
                    "id", '',
                    "images", arrayCache.setUp(),
                    "recycleSpriteSheet", recycle
                );
                    
                if (Array.isArray(ss)) {
                    return merge(ss, response);
                } else if (ss) {
                    return format(ss, response);
                }
            }

            return response;
        }
    };

export default PIXIAnimation;
