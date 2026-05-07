/* global platypus */
import {Container, Graphics, Rectangle, RenderTexture, Sprite} from 'pixi.js';
import {arrayCache, greenSlice, greenSplice, union} from '../utils/array.js';
import AABB from '../AABB.js';
import PIXIAnimation from '../PIXIAnimation.js';
import RenderContainer from './RenderContainer.js';
import createComponentClass from '../factory.js';
import recycle from 'recycle';

const
    EDGE_BLEED = 1,
    EDGES_BLEED = EDGE_BLEED * 2,
    doNothing = function () {
        return null;
    },
    tempCache = AABB.setUp(),
    sort = function (a, b) {
        return a.z - b.z;
    },
    getPowerOfTwo = function (amount) {
        let x = 1;

        while (x < amount) {
            x *= 2;
        }

        return x;
    },
    transformCheck = function (v, tile) {
        if (0x80000000 & v) {
            tile.scale.x = -1;
        }
        if (0x40000000 & v) {
            tile.scale.y = -1;
        }
        if (0x20000000 & v) {
            const x = tile.scale.x;
            tile.scale.x = tile.scale.y;
            tile.scale.y = -x;
            tile.rotation = Math.PI / 2;
        }
    },
    createTeardown = (component, map) => {
        const
            tds = Object.keys(map).map((key) => {
                const
                    handler = component.addEventListener(key, map[key]);

                return () => component.removeEventListener(key, handler);
            });

        return () => {
            tds.forEach((td) => td());
        };
    },
    Template = function (tileSpriteSheet, id, uninitializedTiles) {
        this.id = id;
        this.instances = arrayCache.setUp();
        this.index = 0;

        // jit sprite
        this.tileSpriteSheet = tileSpriteSheet;
        this.getNext = this.initializeAndGetNext;
        this.uninitializedTiles = uninitializedTiles;
        uninitializedTiles.push(this);
    },
    nullTemplate = {
        getNext: doNothing,
        destroy: doNothing
    },
    prototype = Template.prototype;

prototype.initializeAndGetNext = function () {
    this.initialize();

    this.index += 1;
    return this.instances[0];
};

prototype.initialize = function () {
    const
        index = +(this.id.substring(4)),
        anim = 'tile' + (0x0fffffff & index),
        tile = new Sprite((this.tileSpriteSheet._animations[anim] || this.tileSpriteSheet._animations.default).texture);
        
    transformCheck(index, tile);
    tile.template = this; // backwards reference for clearing index later.
    this.instances.push(tile);
    greenSplice(this.uninitializedTiles, this.uninitializedTiles.indexOf(this));

    delete this.getNext;
};

prototype.getNext = function () {
    let instance = this.instances[this.index];

    if (!instance) {
        const
            template = this.instances[0];

        instance = this.instances[this.index] = new Sprite(template.texture);

        // Copy properties
        instance.scale    = template.scale;
        instance.rotation = template.rotation;
        instance.anchor   = template.anchor || template._animation.anchor;
    }

    this.index += 1;

    return instance;
};

prototype.clear = function () {
    this.index = 0;
};

prototype.destroy = function () {
    for (let i = 0; i < this.instances.length; i++) {
        this.instances[i].destroy();
    }
    
    arrayCache.recycle(this.instances);
    this.recycle();
};

recycle.add(Template, 'Template', Template, null, true);

export default createComponentClass(/** @lends platypus.components.RenderTiles.prototype */{

    id: 'RenderTiles',

    properties: {
        /**
         * The amount of space in pixels around the edge of the camera that we include in the buffered image. If not set, largest buffer allowed by maximumBuffer is used.
         *
         * @property buffer
         * @type number
         * @default 0
         */
        buffer: 0,

        /**
         * Determines whether to cache the entire map across one or more texture caches. By default this is `false`; however, if the entire map fits on one or two texture caches, this is set to `true` since it is more efficient than dynamic buffering.
         *
         * @property cacheAll
         * @type Boolean
         * @default false
         */
        cacheAll: false,

        /**
         * Whether to cache entities on this layer if the entity's render component requests caching.
         *
         * @property entityCache
         * @type boolean
         * @default false
         */
        entityCache: false,

        /**
         * This is a two dimensional array of the spritesheet indexes that describe the map that you're rendering.
         *
         * @property imageMap
         * @type Array
         * @default []
         */
        imageMap: [],

        /**
         * The amount of space that is buffered. Defaults to 2048 x 2048 or a smaller area that encloses the tile layer.
         *
         * @property maximumBuffer
         * @type number
         * @default 2048
         */
        maximumBuffer: 2048,

        /**
         * The acceptable buffer between camera viewport and cached tiles. This is needed when the camera contents are skewed or rotated to prevent cropping before refresh need is detected.
         *
         * @property refreshBuffer
         * @type number
         * @default 0
         */
        refreshBuffer: 0,

        /**
         * The x-scale the tilemap is being displayed at.
         *
         * @property scaleX
         * @type number
         * @default 1
         */
        scaleX: 1,

        /**
         * The y-scale the tilemap is being displayed at.
         *
         * @property scaleY
         * @type number
         * @default 1
         */
        scaleY: 1,

        /**
         * A sprite sheet describing all the tile images.
         *
         * Accepts an array of sprite sheet data since 0.8.4
         *
         * @property spriteSheet
         * @type Object|Array|String
         * @default null
         */
        spriteSheet: null,

        /**
         * Whether to cache the tile map to a large texture.
         *
         * @property tileCache
         * @type boolean
         * @default true
         */
        tileCache: true,

        /**
         * This is the height in pixels of individual tiles.
         *
         * @property tileHeight
         * @type number
         * @default 10
         */
        tileHeight: 10,

        /**
         * This is the width in pixels of individual tiles.
         *
         * @property tileWidth
         * @type number
         * @default 10
         */
        tileWidth: 10,
        
        /**
         * The map's top offset.
         *
         * @property top
         * @type Number
         * @default 0
         */
        top: 0,
        
        /**
         * The map's left offset.
         *
         * @property left
         * @type Number
         * @default 0
         */
        left: 0
    },

    /**
     * This component handles rendering tile map backgrounds.
     *
     * When rendering the background, this component figures out what tiles are being displayed and caches them so they are rendered as one image rather than individually.
     *
     * As the camera moves, the cache is updated by blitting the relevant part of the old cached image into a new cache and then rendering tiles that have shifted into the camera's view into the cache.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#add-tiles
     * @listens platypus.Entity#cache-sprite
     * @listens platypus.Entity#camera-loaded
     * @listens platypus.Entity#camera-update
     * @listens platypus.Entity#change-tile
     * @listens platypus.Entity#handle-render
     * @listens platypus.Entity#peer-entity-added
     */
    initialize: function (definition) {
        const
            imgMap = this.imageMap,
            handleRender = this.addEventListener('handle-render', function () {
                 // Pre-render any tiles left to be prerendered to reduce lag on camera movement
                if (this.uninitializedTiles.length) {
                    this.uninitializedTiles[0].initialize();
                } else {
                    this.removeEventListener('handle-render', handleRender);
                    this.owner.parent.triggerEvent('child-entity-updated', this.owner);
                }
            });

        this.doMap            = null; //list of display objects that should overlay tile map.
        this.cachedDisplayObjects = null;
        this.populate         = this.populateTiles;

        this.tiles            = {};

        this.renderer         = platypus.game.renderer;
        this.tilesSprite      = null;
        this.cacheTexture     = null;
        this.mapContainer      = null;
        this.laxCam = AABB.setUp();

        // temp values
        this.worldWidth    = this.tileWidth;
        this.worldHeight   = this.tileHeight;

        this.cache = AABB.setUp();
        this.cachePixels = AABB.setUp();

        this.uninitializedTiles = arrayCache.setUp();

        // Set up containers
        this.spriteSheet = PIXIAnimation.formatSpriteSheet(this.spriteSheet);
        this.tileSpriteSheet = new PIXIAnimation(this.spriteSheet);
        this.tileContainer = new Container();
        this.mapContainer = new Container();
        this.mapContainer.addChild(this.tileContainer);
        
        this.updateCache = false;

        // Prepare map tiles
        this.imageMap = arrayCache.setUp(this.createMap(imgMap));

        this.tilesWidth  = this.imageMap[0].length;
        this.tilesHeight = this.imageMap[0][0].length;
        this.layerWidth  = this.tilesWidth  * this.tileWidth;
        this.layerHeight = this.tilesHeight * this.tileHeight;

        this.edgeBleed = EDGE_BLEED;
        this.edgesBleed = EDGES_BLEED;

        // Set up buffer cache size
        this.cacheWidth  = Math.min(getPowerOfTwo(this.layerWidth  + this.edgesBleed), this.maximumBuffer);
        this.cacheHeight = Math.min(getPowerOfTwo(this.layerHeight + this.edgesBleed), this.maximumBuffer);

        if (!this.owner.container) {
            this.owner.addComponent(new RenderContainer(this.owner, definition));
        }

        this.container = this.owner.container;

        if (!this.tileCache) {
            this.teardown = this.setupNoCache();
        } else if ((this.layerWidth <= this.cacheWidth) && (this.layerHeight <= this.cacheHeight)) { // We never need to recache.
            this.teardown = this.setupSingleCache();
        } else if (this.cacheAll || ((this.layerWidth <= this.cacheWidth * 2) && (this.layerHeight <= this.cacheHeight)) || ((this.layerWidth <= this.cacheWidth) && (this.layerHeight <= this.cacheHeight * 2))) { // We cache everything across several textures creating a cache grid.
            this.teardown = this.setupFullCache();
        } else {
            this.teardown = this.setupPanningCache();
        }
    },

    events: {
        "cache-sprite": function (entity) {
            this.cacheSprite(entity);
        },

        "refresh-cache": function () {
            this.updateCache = true;
        },

        "peer-entity-added": function (entity) {
            this.cacheSprite(entity);
        },

        "peer-entity-removed": function (entity) {
            this.uncacheSprite(entity);
        },

        /**
         * This event adds a layer of tiles to render on top of the existing layer of rendered tiles.
         *
         * @event platypus.Entity#add-tiles
         * @param message.imageMap {Array} This is a 2D mapping of tile indexes to be rendered.
         */
        "add-tiles": function (definition) {
            const
                map = definition.imageMap;

            if (map) {
                this.imageMap.push(this.createMap(map));
                this.updateCache = true;
            }
        },

        /**
         * This event edits the tile index of a rendered tile.
         *
         * @event platypus.Entity#change-tile
         * @param tile {String} A string representing the name of the tile to switch to.
         * @param x {Number} The column of the tile to edit.
         * @param y {Number} The row of the tile to edit.
         * @param [z] {Number} If RenderTiles has multiple layers, this value specifies the layer, with `0` being the bottom-most layer.
         */
        "change-tile": function (tile, x, y, z) {
            const
                map = this.imageMap;

            if (map) {
                this.updateTile(tile, map[z || 0], x, y);
                // Only flag a re-render if the changed tile is within the currently
                // cached region. Changes outside the cache will be drawn correctly
                // the next time the camera pans to include them.
                if (!this.cache.empty &&
                    x >= this.cache.left && x <= this.cache.right &&
                    y >= this.cache.top  && y <= this.cache.bottom) {
                    this.updateCache = true;
                }
            }
        },

        "camera-loaded": function (camera) {
            this.worldWidth  = camera.world.width;
            this.worldHeight = camera.world.height;

            if (this.buffer && !this.cacheAll) { // do this here to set the correct mask before the first caching.
                this.updateBufferRegion(camera.viewport);
            }
        },

        /**
         * Forces an immediate full re-render centered on the current camera
         * position. Call this after bulk tile changes to ensure the display
         * is up to date without requiring a camera pan.
         *
         * For the panning cache, we invalidate cachePixels and re-run the full
         * camera-update recache logic using the last known camera, which correctly
         * handles texture swapping, tile population, and sprite positioning.
         */
        "force-render": function () {
            if (this.cacheAll) {
                // Single/full cache — re-render entire layer.
                this.populateTiles(this.cache, null);
                this.renderCache(this.cache, this.cacheTexture, this.mapContainer, this.mapContainerWrapper);
            } else if (this.cacheTexture) {
                // Panning cache — invalidate cachePixels so the recache branch
                // runs, then execute the full camera-update recache inline.
                const
                    {viewport: vp} = this.owner.parent.worldCamera,
                    {cache, cachePixels} = this,
                    tempC = tempCache,
                    ctw   = this.cacheTilesWidth  - 1,
                    cth   = this.cacheTilesHeight - 1,
                    ctw2  = ctw / 2,
                    cth2  = cth / 2;

                this.convertCamera(vp);

                // Force the recache branch to run regardless of camera position.
                cachePixels.empty = true;

                tempC.setAll(
                    Math.round((this.laxCam.x - this.left) / this.tileWidth  - ctw2) + ctw2,
                    Math.round((this.laxCam.y - this.top)  / this.tileHeight - cth2) + cth2,
                    ctw, cth
                );
                if (tempC.left < 0) {
                    tempC.moveX(tempC.halfWidth);
                } else if (tempC.right > this.tilesWidth - 1) {
                    tempC.moveX(this.tilesWidth - 1 - tempC.halfWidth);
                }
                if (tempC.top < 0) {
                    tempC.moveY(tempC.halfHeight);
                } else if (tempC.bottom > this.tilesHeight - 1) {
                    tempC.moveY(this.tilesHeight - 1 - tempC.halfHeight);
                }

                this.tilesSpriteCache.texture = this.cacheTexture;
                this.cacheTexture = this.cacheTexture.alternate;
                this.tilesSprite.texture = this.cacheTexture;

                this.populateTiles(tempC, cache);
                this.renderCache(tempC, this.cacheTexture, this.mapContainer, this.mapContainerWrapper, this.tilesSpriteCache);
                cache.set(tempC);

                cachePixels.setAll(
                    (cache.x + 0.5) * this.tileWidth  + this.left,
                    (cache.y + 0.5) * this.tileHeight + this.top,
                    (cache.width  + 1) * this.tileWidth,
                    (cache.height + 1) * this.tileHeight
                );

                this.tilesSprite.x = vp.left - this.laxCam.left + cache.left * this.tileWidth  + this.left;
                this.tilesSprite.y = vp.top  - this.laxCam.top  + cache.top  * this.tileHeight + this.top;
            }
        }
    },

    methods: {
        setupSingleCache () {
            const
                {container, mapContainer, owner} = this,
                {z} = owner,
                cacheTexture = RenderTexture.create({
                    width: this.cacheWidth,
                    height: this.cacheHeight
                }),
                sprite = new Sprite(cacheTexture);

            this.mapContainerWrapper = new Container();
            this.mapContainerWrapper.addChild(mapContainer);

            this.cacheAll = true;
            this.edgeBleed = 0;
            this.edgesBleed = 0;
            this.updateRegion(0);

            this.render = this.renderCache;
            this.cacheTexture = cacheTexture;

            this.tilesSprite = sprite;
            sprite.scale.x = this.scaleX;
            sprite.scale.y = this.scaleY;
            sprite.z = z;

            this.cache.setBounds(0, 0, this.tilesWidth - 1, this.tilesHeight - 1);
            this.populateTiles(this.cache, null);
            this.renderCache(this.cache, cacheTexture, this.mapContainer, this.mapContainerWrapper);
            container.addChild(sprite);

            return createTeardown(this, {
                'camera-update': function (camera) {
                    const
                        {laxCam, left, top} = this,
                        {viewport: vp} = camera;

                    this.convertCamera(vp);

                    this.tilesSprite.x = vp.left - laxCam.left + this.cache.left * this.tileWidth + left;
                    this.tilesSprite.y = vp.top  - laxCam.top  + this.cache.top  * this.tileHeight + top;
                },
                'handle-render': function () {
                    if (this.updateCache) {
                        this.updateCache = false;
                        this.populateTiles(this.cache, null);
                        this.renderCache(this.cache, this.cacheTexture, this.mapContainer, this.mapContainerWrapper);
                    }
                }
            });
        },

        setupFullCache () {
            const
                extrusionMargin = 2,
                {container, mapContainer, owner} = this,
                {z} = owner;
                
            this.mapContainerWrapper = new Container();
            this.mapContainerWrapper.addChild(mapContainer);

            this.cacheAll = true;

            // Make sure there's room for the one-pixel extrusion around edges of caches
            this.cacheWidth = Math.min(getPowerOfTwo(this.layerWidth + extrusionMargin), this.maximumBuffer);
            this.cacheHeight = Math.min(getPowerOfTwo(this.layerHeight + extrusionMargin), this.maximumBuffer);
            this.updateRegion(extrusionMargin);

            this.tileContainer.x = -1; // due to extrusion.
            this.tileContainer.y = -1;
            this.render = this.renderCacheWithExtrusion;
            this.cacheGrid = this.createGrid(container);

            this.updateCache = true;

            return createTeardown(this, {
                'camera-update': function (camera) {
                    const
                        {cacheClipHeight, cacheClipWidth, cacheGrid, cachePixels, laxCam, left, top} = this,
                        {viewport: vp} = camera;
                        
                    this.convertCamera(vp);

                    for (let x = 0; x < cacheGrid.length; x++) {
                        for (let y = 0; y < cacheGrid[x].length; y++) {
                            cachePixels.setAll((x + 0.5) * cacheClipWidth + left, (y + 0.5) * cacheClipHeight + top, cacheClipWidth, cacheClipHeight);

                            const
                                sprite = cacheGrid[x][y],
                                inFrame = cachePixels.intersects(laxCam);

                            if (sprite.visible && !inFrame) {
                                sprite.visible = false;
                            } else if (!sprite.visible && inFrame) {
                                sprite.visible = true;
                            }
                            
                            if (sprite.visible && inFrame) {
                                sprite.x = vp.left - laxCam.left + x * cacheClipWidth + left;
                                sprite.y = vp.top  - laxCam.top  + y * cacheClipHeight + top;
                            }
                        }
                    }
                },
                'handle-render': function () {
                    if (this.updateCache) {
                        const
                            {cache, cacheGrid, cacheTilesHeight, cacheTilesWidth, tilesHeight, tilesWidth} = this,
                            tsh = tilesHeight - 1,
                            tsw = tilesWidth - 1;

                        this.updateCache = false;

                        for (let x = 0; x < cacheGrid.length; x++) {
                            for (let y = 0; y < cacheGrid[x].length; y++) {
                                cache.setBounds(x * cacheTilesWidth, y * cacheTilesHeight, Math.min((x + 1) * cacheTilesWidth, tsw), Math.min((y + 1) * cacheTilesHeight, tsh));

                                this.populateTiles(cache, null);
                                this.renderCacheWithExtrusion(cache, cacheGrid[x][y].texture, this.mapContainer, this.mapContainerWrapper);
                            }
                        }
                    }
                }
            });
        },

        setupPanningCache () {
            const
                {container, mapContainer, owner} = this,
                {z} = owner;
                
            this.mapContainerWrapper = new Container();
            this.mapContainerWrapper.addChild(mapContainer);

            this.updateRegion(0);
            this.render = this.renderCache;
            this.cacheAll = false;

            this.cacheTexture = RenderTexture.create({
                width: this.cacheWidth,
                height: this.cacheHeight
            });

            this.tilesSprite = new Sprite(this.cacheTexture);
            this.tilesSprite.scale.x = this.scaleX;
            this.tilesSprite.scale.y = this.scaleY;
            this.tilesSprite.z = z;

            // Set up copy buffer and circular pointers
            this.cacheTexture.alternate = RenderTexture.create({
                width: this.cacheWidth,
                height: this.cacheHeight
            });
            this.tilesSpriteCache = new Sprite(this.cacheTexture.alternate);

            this.cacheTexture.alternate.alternate = this.cacheTexture;
            container.addChild(this.tilesSprite);
            
            return createTeardown(this, {
                'camera-update': function (camera) {
                    const
                        {buffer, cache, cachePixels, laxCam, refreshBuffer} = this,
                        {viewport: vp} = camera,
                        resized = (buffer && ((vp.width !== laxCam.width) || (vp.height !== laxCam.height))),
                        tempC   = tempCache;

                    this.convertCamera(vp);

                    if ((cachePixels.empty || !cachePixels.contains(laxCam)) && (this.imageMap.length > 0)) {
                        if (resized) {
                            this.updateBufferRegion(laxCam);
                        }

                        const
                            ctw     = this.cacheTilesWidth - 1,
                            cth     = this.cacheTilesHeight - 1,
                            ctw2    = ctw / 2,
                            cth2    = cth / 2;

                        //only attempt to draw children that are relevant
                        tempC.setAll(Math.round((laxCam.x - this.left) / this.tileWidth - ctw2) + ctw2, Math.round((laxCam.y - this.top) / this.tileHeight - cth2) + cth2, ctw, cth);
                        if (tempC.left < 0) {
                            tempC.moveX(tempC.halfWidth);
                        } else if (tempC.right > this.tilesWidth - 1) {
                            tempC.moveX(this.tilesWidth - 1 - tempC.halfWidth);
                        }
                        if (tempC.top < 0) {
                            tempC.moveY(tempC.halfHeight);
                        } else if (tempC.bottom > this.tilesHeight - 1) {
                            tempC.moveY(this.tilesHeight - 1 - tempC.halfHeight);
                        }
                        
                        this.tilesSpriteCache.texture = this.cacheTexture;
                        this.cacheTexture = this.cacheTexture.alternate;
                        this.tilesSprite.texture = this.cacheTexture;

                        this.populateTiles(tempC, cache);
                        this.renderCache(tempC, this.cacheTexture, this.mapContainer, this.mapContainerWrapper, this.tilesSpriteCache, cache);
                        cache.set(tempC);

                        // Store pixel bounding box for checking later.
                        cachePixels.setAll((cache.x + 0.5) * this.tileWidth + this.left, (cache.y + 0.5) * this.tileHeight + this.top, (cache.width + 1) * this.tileWidth, (cache.height + 1) * this.tileHeight);
                    }

                    this.tilesSprite.x = vp.left - laxCam.left + cache.left * this.tileWidth + this.left;
                    this.tilesSprite.y = vp.top  - laxCam.top  + cache.top  * this.tileHeight + this.top;
                },
                'handle-render': function () {
                    if (this.updateCache && !this.cache.empty) {
                        this.updateCache = false;
                        this.populateTiles(this.cache, null);
                        this.renderCacheClear(this.cache, this.cacheTexture, this.mapContainer, this.mapContainerWrapper);
                        this.tilesSpriteCache.texture = this.cacheTexture;
                        this.cachePixels.setAll(
                            (this.cache.x + 0.5) * this.tileWidth  + this.left,
                            (this.cache.y + 0.5) * this.tileHeight + this.top,
                            (this.cache.width  + 1) * this.tileWidth,
                            (this.cache.height + 1) * this.tileHeight
                        );
                    }
                }
            });
        },

        setupNoCache () {
            const
                {container, left, mapContainer, owner, scaleX, scaleY, top} = this,
                {z} = owner;

            this.updateRegion(0);

            mapContainer.scale.x = scaleX;
            mapContainer.scale.y = scaleY;
            mapContainer.x = left;
            mapContainer.y = top;
            mapContainer.z = z;
            container.addChild(mapContainer);

            this.buffer = 0; // prevents buffer logic from running if tiles aren't being cached.
            this.cacheAll = false; // so tiles are updated as camera moves.

            return createTeardown(this, {
                'camera-update': function (camera) {
                    const
                        {buffer, cache, cachePixels, laxCam} = this,
                        {viewport: vp} = camera,
                        resized = (buffer && ((vp.width !== laxCam.width) || (vp.height !== laxCam.height))),
                        tempC   = tempCache;

                    this.convertCamera(vp);

                    if ((cachePixels.empty || !cachePixels.contains(laxCam)) && (this.imageMap.length > 0)) {
                        if (resized) {
                            this.updateBufferRegion(laxCam);
                        }

                        const
                            ctw     = this.cacheTilesWidth - 1,
                            cth     = this.cacheTilesHeight - 1,
                            ctw2    = ctw / 2,
                            cth2    = cth / 2;

                        //only attempt to draw children that are relevant
                        tempC.setAll(Math.round((laxCam.x - this.left) / this.tileWidth - ctw2) + ctw2, Math.round((laxCam.y - this.top) / this.tileHeight - cth2) + cth2, ctw, cth);
                        if (tempC.left < 0) {
                            tempC.moveX(tempC.halfWidth);
                        } else if (tempC.right > this.tilesWidth - 1) {
                            tempC.moveX(this.tilesWidth - 1 - tempC.halfWidth);
                        }
                        if (tempC.top < 0) {
                            tempC.moveY(tempC.halfHeight);
                        } else if (tempC.bottom > this.tilesHeight - 1) {
                            tempC.moveY(this.tilesHeight - 1 - tempC.halfHeight);
                        }
                        
                        this.populateTiles(tempC, null);
                        cache.set(tempC);

                        // Store pixel bounding box for checking later.
                        cachePixels.setAll((cache.x + 0.5) * this.tileWidth + this.left, (cache.y + 0.5) * this.tileHeight + this.top, (cache.width + 1) * this.tileWidth, (cache.height + 1) * this.tileHeight);
                    }
                },
                'handle-render': function () {
                    if (this.updateCache) {
                        this.updateCache = false;
                        // Invalidate cachePixels so camera-update immediately re-runs
                        // populateTiles on the next tick rather than skipping because
                        // the old region still appears valid.
                        this.cachePixels.empty = true;
                    }
                }
            });
        },

        cacheSprite: function (entity) {
            const
                object = entity.cacheRender;

            // Determine whether to merge this image with the background.
            if (this.entityCache && object) {
                const
                    {x: boundsX, y: boundsY, width, height} = object.getBounds(object.transformMatrix),
                    offsetX = boundsX - this.left,
                    offsetY = boundsY - this.top,
                    top    = Math.max(0, Math.floor(offsetY / this.tileHeight)),
                    bottom = Math.min(this.tilesHeight, Math.ceil((offsetY + height) / this.tileHeight)),
                    left   = Math.max(0, Math.floor(offsetX / this.tileWidth)),
                    right  = Math.min(this.tilesWidth, Math.ceil((offsetX + width) / this.tileWidth));

                if (!this.doMap) {
                    this.doMap = arrayCache.setUp();
                    this.cachedDisplayObjects = arrayCache.setUp();
                    this.populate = this.populateTilesAndEntities;
                }
                this.cachedDisplayObjects.push(object);

                // Find tiles that should include this display object
                for (let x = left; x < right; x++) {
                    if (!this.doMap[x]) {
                        this.doMap[x] = arrayCache.setUp();
                    }
                    for (let y = top; y < bottom; y++) {
                        if (!this.doMap[x][y]) {
                            this.doMap[x][y] = arrayCache.setUp();
                        }
                        this.doMap[x][y].push(object);
                    }
                }

                // Prevent subsequent draws
                entity.removeFromParentContainer();

                this.updateCache = true; //TODO: This currently causes a blanket cache update - may be worthwhile to only recache if this entity's location is currently in a cache (either cacheGrid or the current viewable area).
            }
        },

        uncacheSprite: function (entity) {
            const
                object = entity.cacheRender;

            // Determine whether to merge this image with the background.
            if (this.entityCache && object) {
                const
                    {x: boundsX, y: boundsY, width, height} = object.getBounds(object.transformMatrix),
                    index = this.cachedDisplayObjects.indexOf(object),
                    offsetX = boundsX - this.left,
                    offsetY = boundsY - this.top,
                    top    = Math.max(0, Math.floor(offsetY / this.tileHeight)),
                    bottom = Math.min(this.tilesHeight, Math.ceil((offsetY + height) / this.tileHeight)),
                    left   = Math.max(0, Math.floor(offsetX / this.tileWidth)),
                    right  = Math.min(this.tilesWidth, Math.ceil((offsetX + width) / this.tileWidth));

                if (index >= 0) {
                    this.cachedDisplayObjects.splice(index, 1);
                }

                // Find tiles that should include this display object
                for (let x = left; x < right; x++) {
                    for (let y = top; y < bottom; y++) {
                        if (this.doMap?.[x]?.[y]) {
                            const
                                index = this.doMap[x][y].indexOf(object);
                            
                            if (index >= 0) {
                                this.doMap[x][y].splice(index, 1);
                            }
                        }
                    }
                }

                this.updateCache = true;
            }
        },

        /**
         * Computes a parallax-adjusted camera AABB (`laxCam`) for this layer.
         *
         * For layers smaller than the world, the layer must scroll slower so that
         * it still covers the full world space as the camera travels edge-to-edge.
         * The position is mapped proportionally: when the camera is at the start of
         * its world travel, laxCam is at the start of the layer's travel, and
         * likewise at the end.
         *
         * IMPORTANT: laxCam is resized to the *actual viewport dimensions* (not
         * viewport + refreshBuffer). Its purpose is solely to compute the parallax
         * offset for sprite positioning (vp.left - laxCam.left). Inflating it with
         * refreshBuffer caused sprite offsets to be wrong by `refreshBuffer` pixels
         * on every camera update, breaking parallax for differently-sized layers.
         */
        convertCamera: function (camera) {
            const
                worldWidth  = this.worldWidth  / this.scaleX,
                worldPosX   = worldWidth  - camera.width,
                worldHeight = this.worldHeight / this.scaleY,
                worldPosY   = worldHeight - camera.height,
                laxCam      = this.laxCam;

            if ((worldWidth === this.layerWidth) || !worldPosX) {
                laxCam.moveX(camera.x);
            } else {
                laxCam.moveX((camera.left - this.left) * (this.layerWidth - camera.width) / worldPosX + camera.halfWidth + this.left);
            }

            if ((worldHeight === this.layerHeight) || !worldPosY) {
                laxCam.moveY(camera.y);
            } else {
                laxCam.moveY((camera.top - this.top) * (this.layerHeight - camera.height) / worldPosY + camera.halfHeight + this.top);
            }

            // FIX: resize laxCam to the actual viewport size only — never camera + refreshBuffer.
            if (camera.width !== laxCam.width || camera.height !== laxCam.height) {
                laxCam.resize(camera.width, camera.height);
            }
        },

        createTile: function (imageName) {
            // "tile-1" is empty, so it remains a null reference.
            if (imageName === 'tile-1') {
                return nullTemplate;
            }

            return Template.setUp(this.tileSpriteSheet, imageName, this.uninitializedTiles);
        },

        createMap: function (mapDefinition) {
            if (typeof mapDefinition[0][0] !== 'string') { // This is not a map definition: it's an actual RenderTiles map.
                return mapDefinition;
            } else {
                const
                    map = arrayCache.setUp();
                
                for (let x = 0; x < mapDefinition.length; x++) {
                    map[x] = arrayCache.setUp();
                    for (let y = 0; y < mapDefinition[x].length; y++) {
                        this.updateTile(mapDefinition[x][y], map, x, y);
                    }
                }
                
                return map;
            }
        },

        updateTile: function (index, map, x, y) {
            const
                id = index.id ?? index,
                {tiles} = this,
                tile = tiles[id];
            
            if (!tile && (tile !== null)) { // Empty grid spaces are null, so we needn't create a new tile.
                map[x][y] = tiles[id] = this.createTile(id);
            } else {
                map[x][y] = tile;
            }
        },

        createGrid: function (container) {
            const
                {edgeBleed: extrusion, edgesBleed: outerMargin} = this,
                ch = this.cacheHeight,
                cw = this.cacheWidth,
                cth = this.cacheTilesHeight,
                ctw = this.cacheTilesWidth,
                sx = this.scaleX,
                sy = this.scaleY,
                th = this.tileHeight,
                tw = this.tileWidth,
                tsh = this.tilesHeight,
                tsw = this.tilesWidth,
                cg = arrayCache.setUp();
            let ct = null,
                z = this.owner.z;

            for (let x = 0; x < tsw; x += ctw) {
                const
                    col = arrayCache.setUp();
                cg.push(col);
                for (let y = 0; y < tsh; y += cth) {
                    // This prevents us from using too large of a cache for the right and bottom edges of the map.
                    const
                        width = Math.min(getPowerOfTwo((tsw - x) * tw + outerMargin), cw),
                        height = Math.min(getPowerOfTwo((tsh - y) * th + outerMargin), ch),
                        rt = RenderTexture.create({
                            width,
                            height
                        });

                    rt.frame = new Rectangle(extrusion, extrusion, (((width - outerMargin) / tw) >> 0) * tw + extrusion, (((height - outerMargin) / th) >> 0) * th + extrusion);
                    ct = new Sprite(rt);
                    ct.z = z;
                    ct.scale.x = sx;
                    ct.scale.y = sy;
                    col.push(ct);
                    container.addChild(ct);

                    z -= 0.000001; // so that tiles of large caches overlap consistently.
                }
            }
            
            return cg;
        },
        
        updateRegion: function (margin) {
            const
                {edgesBleed} = this,
                tw = this.tileWidth * this.scaleX,
                th = this.tileHeight * this.scaleY,
                ctw = Math.min(this.tilesWidth,  ((this.cacheWidth - edgesBleed)  / tw)  >> 0),
                cth = Math.min(this.tilesHeight, ((this.cacheHeight - edgesBleed) / th) >> 0);

            if (!ctw) {
                platypus.debug.warn('"' + this.owner.type + '" RenderTiles: The tiles are ' + tw + 'px wide which is larger than ' + (this.cacheWidth - edgesBleed) + 'px (maximum cache size of ' + this.cacheWidth + 'px minus a 2px edge bleed). Increase the maximum cache size or reduce tile size.');
            }
            if (!cth) {
                platypus.debug.warn('"' + this.owner.type + '" RenderTiles: The tiles are ' + th + 'px high which is larger than ' + (this.cacheHeight - edgesBleed) + 'px (maximum cache size of ' + this.cacheHeight + 'px minus a 2px edge bleed). Increase the maximum cache size or reduce tile size.');
            }

            this.cacheTilesWidth  = ctw;
            this.cacheTilesHeight = cth;
            this.cacheClipWidth   = ctw * tw;
            this.cacheClipHeight  = cth * th;

            if (this.tileCache) {
                this.mapContainer.mask = new Graphics().rect(0, 0, this.cacheClipWidth + margin, this.cacheClipHeight + margin).fill(0x000000);
            }
        },

        updateBufferRegion: function (viewport) {
            const
                tw = this.tileWidth * this.scaleX,
                th = this.tileHeight * this.scaleY;

            this.cacheTilesWidth  = Math.min(this.tilesWidth,  Math.ceil((viewport.width  + this.buffer * 2) / tw), (this.cacheWidth  / tw) >> 0);
            this.cacheTilesHeight = Math.min(this.tilesHeight, Math.ceil((viewport.height + this.buffer * 2) / th), (this.cacheHeight / th) >> 0);

            this.cacheClipWidth   = this.cacheTilesWidth  * tw;
            this.cacheClipHeight  = this.cacheTilesHeight * th;

            this.mapContainer.mask = new Graphics().rect(0, 0, this.cacheClipWidth, this.cacheClipHeight).fill(0x000000);
        },

        populateTiles: function (bounds, oldBounds) {
            const
                tiles = arrayCache.setUp();

            this.tileContainer.removeChildren();
            for (let x = bounds.left; x <= bounds.right; x++) {
                for (let y = bounds.top; y <= bounds.bottom; y++) {
                    if (!oldBounds || oldBounds.empty || (y > oldBounds.bottom) || (y < oldBounds.top) || (x > oldBounds.right) || (x < oldBounds.left)) {
                        for (let layer = 0; layer < this.imageMap.length; layer++) {
                            const
                                tile = this.imageMap[layer][x][y].getNext();

                            if (tile) {
                                if (tile.template) {
                                    tiles.push(tile.template);
                                }
                                tile.x = (x + 0.5) * this.tileWidth;
                                tile.y = (y + 0.5) * this.tileHeight;
                                this.tileContainer.addChild(tile);
                            }
                        }
                    }
                }
            }

            // Clear out tile instances
            for (let z = 0; z < tiles.length; z++) {
                tiles[z].clear();
            }
            arrayCache.recycle(tiles);
        },
        
        populateTilesAndEntities: function (bounds, oldBounds) {
            const
                ents    = arrayCache.setUp(),
                tiles   = arrayCache.setUp();

            this.tileContainer.removeChildren();
            for (let x = bounds.left; x <= bounds.right; x++) {
                for (let y = bounds.top; y <= bounds.bottom; y++) {
                    if (!oldBounds || oldBounds.empty || (y > oldBounds.bottom) || (y < oldBounds.top) || (x > oldBounds.right) || (x < oldBounds.left)) {
                        // draw tiles
                        for (let layer = 0; layer < this.imageMap.length; layer++) {
                            const
                                tile = this.imageMap[layer][x][y].getNext();

                            if (tile) {
                                if (tile.template) {
                                    tiles.push(tile.template);
                                }
                                tile.x = (x + 0.5) * this.tileWidth;
                                tile.y = (y + 0.5) * this.tileHeight;
                                this.tileContainer.addChild(tile);
                            }
                        }

                        // check for cached entities
                        if (this.doMap[x] && this.doMap[x][y]) {
                            const
                                oList = this.doMap[x][y];

                            for (let z = 0; z < oList.length; z++) {
                                if (!oList[z].drawn) {
                                    oList[z].drawn = true;
                                    ents.push(oList[z]);
                                }
                            }
                        }
                    }
                }
            }

            this.mapContainer.removeChildren();
            this.mapContainer.addChild(this.tileContainer);

            // Draw cached entities
            if (ents.length) {
                ents.sort(sort);
                for (let z = 0; z < ents.length; z++) {
                    const
                        ent = ents[z];

                    delete ent.drawn;
                    this.mapContainer.addChild(ent);
                    if (ent.mask) {
                        this.mapContainer.addChild(ent.mask);
                    }
                }
            }

            // Clear out tile instances
            for (let z = 0; z < tiles.length; z++) {
                tiles[z].clear();
            }
            
            arrayCache.recycle(tiles);
            arrayCache.recycle(ents);
        },
        
        renderCache: function (bounds, renderTexture, src, wrapper, oldCache, oldBounds) {
            const
                {renderer} = this;

            if (oldCache && oldBounds && !oldBounds.empty) {
                oldCache.x = oldBounds.left * this.tileWidth;
                oldCache.y = oldBounds.top * this.tileHeight;
                src.addChild(oldCache); // To copy last rendering over.
            }

            src.x = -bounds.left * this.tileWidth;
            src.y = -bounds.top * this.tileHeight;
            renderer.render({
                container: wrapper,
                target: renderTexture
            });
            renderTexture.requiresUpdate = true;
        },

        renderCacheClear: function (bounds, renderTexture, src, wrapper) {
            const
                {renderer} = this;

            src.x = -bounds.left * this.tileWidth;
            src.y = -bounds.top * this.tileHeight;
            renderer.render({
                container: wrapper,
                target: renderTexture,
                clear: true
            });
            renderTexture.requiresUpdate = true;
        },

        renderCacheWithExtrusion: function (bounds, renderTexture, src, wrapper) {
            const
                extrusion = 1,
                border = new Graphics(),
                {renderer} = this,
                rendering = {
                    container: wrapper,
                    target: renderTexture
                };

            // This mask makes only the extruded border drawn for the next 4 draws so that inner holes aren't extruded in addition to the outer rim.
            border.rect(0.5, 0.5, this.cacheClipWidth + 1, this.cacheClipHeight + 1);
            border.stroke({
                width: 1,
                color: 0x000000
            });

            // There is probably a better way to do this. Currently for the extrusion, everything is rendered once offset in the n, s, e, w directions and then once in the middle to create the effect.
            wrapper.mask = border;
            src.x = -bounds.left * this.tileWidth;
            src.y = -bounds.top * this.tileHeight + extrusion;
            renderer.render(rendering);
            src.x = -bounds.left * this.tileWidth + extrusion;
            src.y = -bounds.top * this.tileHeight;
            renderer.render(rendering);
            src.x = -bounds.left * this.tileWidth + extrusion * 2;
            src.y = -bounds.top * this.tileHeight + extrusion;
            renderer.render(rendering);
            src.x = -bounds.left * this.tileWidth + extrusion;
            src.y = -bounds.top * this.tileHeight + extrusion * 2;
            renderer.render(rendering);
            wrapper.mask = null;
            src.x = -bounds.left * this.tileWidth + extrusion;
            src.y = -bounds.top * this.tileHeight + extrusion;
            renderer.render(rendering);
            renderTexture.requiresUpdate = true;
        },
        
        toJSON: function () {
            const
                imageMap = this.imageMap[0],
                imgMap = [];
            let x = imageMap.length;
            
            while (x--) {
                let y = imageMap[x].length;

                imgMap[x] = [];
                while (y--) {
                    imgMap[x][y] = imageMap[x][y].id;
                }
            }

            return {
                type: 'RenderTiles',
                buffer: this.buffer,
                cacheAll: this.cacheAll,
                entityCache: this.entityCache,
                imageMap: imgMap,
                maximumBuffer: this.maximumBuffer,
                scaleX: this.scaleX,
                scaleY: this.scaleY,
                spriteSheet: this.spriteSheet,
                tileCache: this.tileCache,
                tileHeight: this.tileHeight,
                tileWidth: this.tileWidth,
                top: this.top,
                left: this.left
            };
        },

        destroy: function () {
            const
                grid = this.cacheGrid,
                map = this.doMap,
                img = this.imageMap,
                keys = Object.keys(this.tiles),
                {length} = keys;

            if (grid) {
                for (let x = 0; x < grid.length; x++) {
                    for (let y = 0; y < grid[x].length; y++) {
                        grid[x][y].texture.destroy(true);
                        this.container.removeChild(grid[x][y]);
                    }
                }
                arrayCache.recycle(grid, 2);
                delete this.cacheGrid;
            } else if (this.tilesSprite) {
                if (this.tilesSprite.texture.alternate) {
                    this.tilesSprite.texture.alternate.destroy(true);
                }
                this.tilesSprite.texture.destroy(true);
                this.container.removeChild(this.tilesSprite);
            } else {
                this.container.removeChild(this.mapContainer);
            }
            
            arrayCache.recycle(img, 2);
            
            for (let i = 0; i < length; i++) {
                this.tiles[keys[i]].destroy();
            }
            this.tiles = null;
            this.container = null;
            this.tilesSprite = null;
            this.spriteSheet.recycleSpriteSheet();
            
            if (map) {
                for (let x = 0; x < this.cachedDisplayObjects.length; x++) {
                    this.cachedDisplayObjects[x].destroy();
                }
                arrayCache.recycle(this.cachedDisplayObjects);

                for (let x = 0; x < map.length; x++) {
                    if (map[x]) {
                        for (let y = 0; y < map[x].length; y++) {
                            if (map[x][y]) {
                                arrayCache.recycle(map[x][y]);
                            }
                        }
                        arrayCache.recycle(map[x]);
                    }
                }
                arrayCache.recycle(map);
            }
            
            this.laxCam.recycle();
            this.cache.recycle();
            this.cachePixels.recycle();
            arrayCache.recycle(this.uninitializedTiles);

            this.teardown?.();
        }
    },

    publicMethods: {
        getMapDimensions: function () {
            return {
                tilesWidth: this.tilesWidth,
                tilesHeight: this.tilesHeight,
                layerWidth: this.layerWidth,
                layerHeight: this.layerHeight
            }
        },
        getTileAt: function (x, y, z) {
            return this.imageMap[z][x][y];
        },
        getRootTileIndex: function (tileId) {
            const nonTransformData = ~(0x80000000 + 0x40000000 + 0x20000000);
            let index = tileId;
            
            if (typeof tileId === 'string') {
                index = +tileId.slice(('tile').length);
            }

            return index & nonTransformData;
        },
        getTileVariants: function (tileId) {
            // FIX: each transform flag must use its own distinct bitmask constant.
            // Previously all three were 0x80000000 (X-flip), making variants 2-7
            // all duplicates of each other. Correct values:
            //   transformA = 0x80000000  (X-flip / horizontal mirror)
            //   transformB = 0x40000000  (Y-flip / vertical mirror)
            //   transformC = 0x20000000  (diagonal / rotate)
            const transformA = 0x80000000,
                transformB = 0x40000000,
                transformC = 0x20000000;
            let index = this.getRootTileIndex(tileId);

            return [
                index,
                index + transformA,
                index + transformB,
                index + transformC,
                index + transformA + transformB,
                index + transformA + transformC,
                index + transformB + transformC,
                index + transformA + transformB + transformC
            ];
        }
    },
    
    getAssetList: (function () {
        const
            getImages = function (ss, spriteSheets) {
                if (ss) {
                    if (typeof ss === 'string') {
                        return getImages(spriteSheets[ss], spriteSheets);
                    } else if (ss.images) {
                        return greenSlice(ss.images);
                    }
                }

                return arrayCache.setUp();
            };
        
        return function (component, props, defaultProps) {
            const
                spriteSheets = platypus.game.settings.spriteSheets,
                ss = component?.spriteSheet ?? props?.spriteSheet ?? defaultProps?.spriteSheet;
            
            if (ss) {
                if (typeof ss === 'string' && (ss !== 'import')) {
                    return getImages(ss, spriteSheets);
                } else if (Array.isArray(ss)) {
                    const
                        images = arrayCache.setUp();
                    let i = ss.length;

                    while (i--) {
                        const
                            arr = getImages(ss[i], spriteSheets);

                        union(images, arr);
                        arrayCache.recycle(arr);
                    }
                    return images;
                } else if (ss.images) {
                    return greenSlice(ss.images);
                }
            }
            
            return arrayCache.setUp();
        };
    }())
});