/*global platypus, window */
import AABB from '../AABB.js';
import {Container} from 'pixi.js';
import Data from '../Data.js';
import TweenJS from '@tweenjs/tween.js';
import Vector from '../Vector.js';
import createComponentClass from '../factory.js';
import EntityCamera from './EntityCamera.js';

const
    DPR = window.devicePixelRatio || 1,
    STATIC = 0,
    PAN = 1,
    FOLLOW = 2,
    validModes = ['static', 'mouse-pan', 'following'],
    deprecatedModes = {
        pan: PAN,
        locked: FOLLOW,
        forward: FOLLOW,
        bounding: FOLLOW,
        'anchor-bound': FOLLOW
    },
    getCameraMode = (mode = 'static') => {
        if (validModes.indexOf(mode) >= 0) {
            return mode;
        } else if (typeof deprecatedModes[mode] === 'number') {
            const
                alt = validModes[deprecatedModes[mode]];

            platypus.debug.warn(`"${mode} has been deprecated. Use "${alt}" instead.`);
            return alt;
        } else {
            platypus.debug.warn(`"${mode} is not a valid mode. Available modes include "${validModes.join('", "')}".`);
            return 'static';
        }
    },
    doNothing = function () {
        return false;
    },

    // These fix coords for touch events filling in for pointer events from the PIXI InteractiveManager
    getClientX = function (event) {
        if (!event.clientX) {
            if (event.touches && event.touches[0] && event.touches[0].clientX) {
                return event.touches[0].clientX;
            }
            return 0;
        }
        return event.clientX;
    },
    getClientY = function (event) {
        if (!event.clientY) {
            if (event.touches && event.touches[0] && event.touches[0].clientY) {
                return event.touches[0].clientY;
            }
            return 0;
        }
        return event.clientY;
    };

export default createComponentClass(/** @lends platypus.components.Camera.prototype */{
    id: 'HandlerCamera',
    properties: {
        /**
         * Number specifying width of viewport in world coordinates.
         *
         * @property width
         * @type number
         * @default 0
         **/
        "width": 0,
            
        /**
         * Number specifying height of viewport in world coordinates.
         *
         * @property height
         * @type number
         * @default 0
         **/
        "height": 0,
        
        /**
         * Specifies whether the camera should be draggable via the mouse by setting to 'pan'.
         *
         * @property mode
         * @type String
         * @default 'static'
         **/
        "mode": "static",
        
        /**
         * Whether camera overflows to cover the whole canvas or remains contained within its aspect ratio's boundary.
         *
         * @property overflow
         * @type boolean
         * @default true
         * @deprecated
         */
        "overflow": false,
        
        /**
         * Boolean value that determines whether the camera should stretch the world viewport when window is resized. Defaults to false which maintains the proper aspect ratio.
         *
         * @property stretch
         * @type boolean
         * @default: false
         * @deprecated
         */
        "stretch": false,
        
        /**
         * Sets how many units the followed entity can move before the camera will re-center. This should be lowered for small-value coordinate systems such as Box2D.
         *
         * @property threshold
         * @type number
         * @default 1
         **/
        "threshold": 1,
        
        /**
         * Whether, when following an entity, the camera should rotate to match the entity's orientation.
         *
         * @property rotate
         * @type boolean
         * @default false
         **/
        "rotate": false,

        /**
         * Number specifying the horizontal center of viewport in world coordinates.
         *
         * @property x
         * @type number
         * @default 0
         **/
        "x": 0,
            
        /**
         * Number specifying the vertical center of viewport in world coordinates.
         *
         * @property y
         * @type number
         * @default 0
         **/
        "y": 0
    },
    publicProperties: {
        /**
         * The entity's canvas element is used to determine the window size of the camera.
         *
         * @property canvas
         * @type Canvas
         * @default null
         */
        "canvas": null,
        
        /**
         * Sets how quickly the camera should pan to a new position in the horizontal direction.
         *
         * @property transitionX
         * @type number
         * @default 400
         **/
        "transitionX": 400,
        
        /**
         * Sets how quickly the camera should pan to a new position in the vertical direction.
         *
         * @property transitionY
         * @type number
         * @default 600
         **/
        "transitionY": 600,
            
        /**
         * Sets how quickly the camera should rotate to a new orientation.
         *
         * @property transitionAngle
         * @type number
         * @default: 600
         **/
        "transitionAngle": 600,

        /**
         * Provides access at the layer level to the camera's world viewport.
         *
         * ```javascript
         *     {
         *         viewport, //platypus.AABB
         *         orientation
         *     }
         * ```
         *
         * @property worldCamera
         * @type platypus.Data
         */
        worldCamera: null,

        /**
         * Sets the z-order of this layer relative to other loaded layers.
         *
         * @property z
         * @type Number
         * @default 0
         */
        "z": 0
    },

    /**
     * This component controls the game camera deciding where and how it should move. The camera also broadcasts messages when the window resizes or its orientation changes.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#child-entity-added
     * @listens platypus.Entity#child-entity-updated
     * @listens platypus.Entity#follow
     * @listens platypus.Entity#load
     * @listens platypus.Entity#pointerdown
     * @listens platypus.Entity#pressmove
     * @listens platypus.Entity#pressup
     * @listens platypus.Entity#relocate
     * @listens platypus.Entity#render-world
     * @listens platypus.Entity#resize-camera
     * @listens platypus.Entity#shake
     * @listens platypus.Entity#tick
     * @listens platypus.Entity#world-loaded
     * @fires platypus.Entity#camera-loaded
     * @fires platypus.Entity#camera-update
     * @fires platypus.Entity#render-update
     */
    initialize: function (definition) {
        const
            worldVP = AABB.setUp(this.x, this.y, this.width, this.height),
            worldCamera = Data.setUp(
                "viewport", worldVP,
                "orientation", definition.orientation || 0
            );

        //The dimensions of the camera in the window
        this.viewport = AABB.setUp(0, 0, 0, 0);
        
        //The dimensions of the camera in the game world
        this.worldCamera = worldCamera;

        //Message object defined here so it's reusable
        this.worldDimensions = AABB.setUp();
        this.message = Data.setUp(
            "viewport", AABB.setUp(),
            "scaleX", 0,
            "scaleY", 0,
            "orientation", 0,
            "stationary", false,
            "world", this.worldDimensions
        );
        this.cameraLoadedMessage = Data.setUp(
            "viewport", this.message.viewport,
            "world", this.worldDimensions
        );

        this.unbounded = true; // no bounds on camera movement

        //Whether the map has finished loading.
        this.worldIsLoaded = false;
        
        this.mode = getCameraMode(this.mode);
        
        //FOLLOW MODE
        this.cameras = [];
        
        this.xMagnitude = 0;
        this.yMagnitude = 0;
        this.xWaveLength = 0;
        this.yWaveLength = 0;
        this.xShakeTime = 0;
        this.yShakeTime = 0;
        this.shakeTime = 0;
        this.shakeIncrementor = 0;
        
        this.direction = true;
        this.stationary = false;
        
        this.viewportUpdate = false;
        
        if (this.owner.container) {
            this.parentContainer = this.owner.container;
        } else if (this.owner.stage) {
            this.canvas = this.canvas || platypus.game.canvas; //TODO: Probably need to find a better way to handle resizing - DDD 10/4/2015
            this.parentContainer = this.owner.stage;
            this.owner.width  = this.canvas.width;
            this.owner.height = this.canvas.height;
        } else {
            platypus.debug.warn('Camera: There appears to be no Container on this entity for the camera to display.');
        }
        this.container = new Container();
        this.container.zIndex = this.z;
        this.container.visible = false;
        this.parentContainer.addChild(this.container);
        this.movedCamera = false;
    },
    events: {
        "load": function () {
            this.resize();
        },
        
        "render-world": function (data) {
            this.world = data.world;
            this.container.addChild(this.world);
        },
        
        "child-entity-added": function (entity) {
            this.viewportUpdate = true;
            
            if (this.worldIsLoaded) {
                /**
                 * On receiving a "world-loaded" message, the camera broadcasts the world size to all children in the world.
                 *
                 * @event platypus.Entity#camera-loaded
                 * @param camera {Object}
                 * @param camera.world {platypus.AABB} The dimensions of the world.
                 * @param camera.viewport {platypus.AABB} The AABB describing the camera viewport in world units.
                 **/
                entity.triggerEvent('camera-loaded', this.cameraLoadedMessage);
            }

            if (typeof entity.cameraFocus === 'number') {
                this.addCamera(entity);
            }
        },

        "child-entity-updated": function (entity) {
            this.viewportUpdate = true;
            
            if (this.worldIsLoaded) {
                entity.triggerEvent('camera-update', this.message);
            }

            if (typeof entity.cameraFocus === 'number') {
                this.addCamera(entity);
            } else {
                this.removeCamera(entity);
            }
        },

        "child-entity-removed": function (entity) {
            this.viewportUpdate = true;
            
            this.removeCamera(entity);
        },

        "world-loaded": function (values) {
            const
                {message, owner} = this;
            
            message.viewport.set(this.worldCamera.viewport);
            this.worldDimensions.set(values.world);
            this.unbounded = !!values.level.infinite;
            
            this.worldIsLoaded = true;
            if (values.camera) {
                this.follow(values.camera);
            }
            if (owner.triggerEventOnChildren) {
                owner.triggerEventOnChildren('camera-loaded', this.cameraLoadedMessage);
            }
            this.updateMovementMethods();
        },
        
        "pointerdown": function (event) {
            if (this.state === 'mouse-pan') {
                const
                    {viewport} = this.worldCamera;

                if (!this.mouseVector) {
                    this.mouseVector = Vector.setUp();
                    this.mouseWorldOrigin = Vector.setUp();
                }
                this.mouse = this.mouseVector;
                this.mouse.x = getClientX(event.event);
                this.mouse.y = getClientY(event.event);
                this.mouseWorldOrigin.x = viewport.x;
                this.mouseWorldOrigin.y = viewport.y;
                event.pixiEvent.stopPropagation();
            }
        },
        
        "pressmove": function (event) {
            if (this.mouse) {
                if (this.move(this.mouseWorldOrigin.x + ((this.mouse.x - getClientX(event.event)) * DPR) / this.world.worldTransform.a, this.mouseWorldOrigin.y + ((this.mouse.y - getClientY(event.event)) * DPR) / this.world.worldTransform.d)) {
                    this.viewportUpdate = true;
                    this.movedCamera = true;
                    event.pixiEvent.stopPropagation();
                }
            }
        },

        "pressup": function (event) {
            if (this.mouse) {
                this.mouse = null;
                if (this.movedCamera) {
                    this.movedCamera = false;
                    event.pixiEvent.stopPropagation();
                }
            }
        },
        
        "tick": function ({delta}) {
            if ((this.mode === 'following') && this.lockedFollow(this.cameras, delta)) {
                this.viewportUpdate = true;
            }
            
            // Need to update owner's size information for changes to canvas size
            if (this.canvas) {
                this.owner.width  = this.canvas.width;
                this.owner.height = this.canvas.height;
            }
            
            // Check for owner resizing
            if ((this.owner.width !== this.lastWidth) || (this.owner.height !== this.lastHeight)) {
                this.resize();
                this.lastWidth = this.owner.width;
                this.lastHeight = this.owner.height;
            }

            if (this.shakeIncrementor < this.shakeTime) {
                const viewport = this.worldCamera.viewport;

                this.viewportUpdate = true;
                this.shakeIncrementor += delta;
                this.shakeIncrementor = Math.min(this.shakeIncrementor, this.shakeTime);
                
                if (this.shakeIncrementor < this.xShakeTime) {
                    viewport.moveX(viewport.x + Math.sin((this.shakeIncrementor / this.xWaveLength) * (Math.PI * 2)) * this.xMagnitude);
                }
                
                if (this.shakeIncrementor < this.yShakeTime) {
                    viewport.moveY(viewport.y + Math.sin((this.shakeIncrementor / this.yWaveLength) * (Math.PI * 2)) * this.yMagnitude);
                }
            }

            this.updateViewport();
            
            if (this.container.zIndex !== this.z) {
                this.container.zIndex = this.z;
            }
        },
        
        /**
        * The camera listens for this event to change its world viewport size.
        *
        * @event platypus.Entity#resize-camera
        * @param {Object} [dimensions] List of key/value pairs describing new viewport size
        * @param {number} dimensions.width Width of the camera viewport
        * @param {number} dimensions.height Height of the camera viewport
        * @param {number} dimensions.time Time in millseconds over which to tween the scale change.
        * @param {Boolean} [forceUpdate] Whether to update graphics.
        **/
        "resize-camera": function (dimensions = {}, forceUpdate = false) {
            const
                {width, height, time, ease} = dimensions,
                forcedUpdate = forceUpdate || dimensions.forceUpdate;

            if (time) {
                const
                    tween = new TweenJS.Tween(this);
                
                tween.to({width, height}, time);
                if (ease) {
                    tween.easing(ease);
                }
                tween.onUpdate(() => {
                    this.resize();
                }).start();
            } else {
                if (width && height) {
                    this.width = dimensions.width;
                    this.height = dimensions.height;
                }
                if (this.canvas) {
                    this.owner.width  = this.canvas.width;
                    this.owner.height = this.canvas.height;
                }
                this.resize();
            }
            if (forcedUpdate) {
                this.updateViewport();

                /**
                 * Sends a 'handle-render' message to all the children in the Container. This bypasses a render pause value and is useful for resizes happening outside the game loop.
                 *
                 * @event platypus.Entity#render-update
                 * @param tick {Object} An object containing tick data.
                 */
                this.owner.triggerEvent('render-update');
            }
        },

        /**
         * The camera listens for this event to change its position in the world.
         *
         * @event platypus.Entity#relocate
         * @param {Vector|Object} location List of key/value pairs describing new location
         * @param {Number} location.x New position along the x-axis.
         * @param {Number} location.y New position along the y-axis.
         * @param {Number} [location.time] The time to transition to the new location.
         * @param {Function} [location.ease] The ease function to use. Defaults to a linear transition.
         */
        "relocate": function (location) {
            if (location.time) {
                const
                    worldVP = this.worldCamera.viewport,
                    v = Vector.setUp(worldVP.x, worldVP.y),
                    tween = new TweenJS.Tween(v);
                
                tween.to({x: location.x, y: location.y}, location.time);
                if (location.ease) {
                    tween.easing(location.ease);
                }
                tween.onUpdate(() => this.viewportUpdate |= !this.owner.destroyed && this.move(v.x, v.y)).onStop(() => v.recycle()).start();
            } else if (this.move(location.x, location.y)) {
                this.viewportUpdate = true;
            }
        },
        
        "follow": function (def) {
            this.follow(def);
        },
        
        /**
         * On receiving this message, the camera will shake around its target location.
         *
         * @event platypus.Entity#shake
         * @param {Object} shake
         * @param {number} [shake.xMagnitude] How much to move along the x axis.
         * @param {number} [shake.yMagnitude] How much to move along the y axis.
         * @param {number} [shake.xFrequency] How quickly to shake along the x axis.
         * @param {number} [shake.yFrequency] How quickly to shake along the y axis.
         * @param {number} [shake.time] How long the camera should shake.
         */
        "shake": function (def = {}) {
            const
                xMag    = def.xMagnitude || 0,
                yMag    = def.yMagnitude || 0,
                xFreq   = def.xFrequency || 0, //Cycles per second
                yFreq   = def.yFrequency || 0, //Cycles per second
                second  = 1000,
                time    = def.time || 0;
            
            this.viewportUpdate = true;
            
            this.shakeIncrementor = 0;
            
            this.xMagnitude = xMag;
            this.yMagnitude = yMag;
            
            if (xFreq === 0) {
                this.xWaveLength = 1;
                this.xShakeTime = 0;
            } else {
                this.xWaveLength = (second / xFreq);
                this.xShakeTime = Math.ceil(time / this.xWaveLength) * this.xWaveLength;
            }
            
            if (yFreq === 0) {
                this.yWaveLength = 1;
                this.yShakeTime = 0;
            } else {
                this.yWaveLength = (second / yFreq);
                this.yShakeTime = Math.ceil(time / this.yWaveLength) * this.yWaveLength;
            }
            
            this.shakeTime = Math.max(this.xShakeTime, this.yShakeTime);
        }
    },
    
    methods: {
        follow: function ({begin = 0, entity, mode, orientation = 0, time = 0, x, y} = {}) {
            if (begin || time) {
                platypus.debug.warn(`"begin" and "time" syntax has been deprecated. Use the "Timeline" component to set up transitional timings instead.`);
            }
            
            this.mode = getCameraMode(mode);
            
            switch (this.mode) {
            case 'following':
                this.addCamera(entity);
                break;
            case 'mouse-pan':
                if ((typeof x === 'number') && (typeof y === 'number')) {
                    this.move(x, y, orientation);
                    this.viewportUpdate = true;
                }
                break;
            default:
                if ((typeof x === 'number') && (typeof y === 'number')) {
                    this.move(x, y, orientation);
                    this.viewportUpdate = true;
                }
                break;
            }
        },

        addCamera (entity) {
            const
                needsAdding = this.cameras.indexOf(entity) === -1;

            if (needsAdding) {
                if (typeof entity.cameraFocus !== 'number') {
                    entity.addComponent(new EntityCamera(entity, {}));
                }

                this.cameras.push(entity);
                this.mode = 'following';
            }

            return needsAdding;
        },
        
        removeCamera (entity) {
            const
                index = this.cameras.indexOf(entity),
                canBeRemoved = index >= 0;

            if (canBeRemoved) {
                this.cameras.splice(index, 1);
                if (this.cameras.length === 0) {
                    this.mode = 'static';
                }
            }

            return canBeRemoved;
        },
        
        move: function (x, y, newOrientation) {
            const
                movedX = this.moveX(x),
                movedY = this.moveY(y),
                movedR = this.rotate && this.reorient(newOrientation || 0);

            return movedX || movedY || movedR;
        },
        
        moveX: doNothing,
        
        moveY: doNothing,
        
        reorient: function (newOrientation) {
            const
                errMargin = 0.0001,
                {worldCamera} = this;
            
            if (Math.abs(worldCamera.orientation - newOrientation) > errMargin) {
                worldCamera.orientation = newOrientation;
                return true;
            }
            return false;
        },
        
        lockedFollow (entities) {
            const
                {worldCamera: {viewport: currentBounds}, worldDimensions: {top, bottom, left, right, height, width, x, y}, unbounded} = this,
                sum = entities.reduce((prev, {cameraFocus}) => prev + cameraFocus, 0),
                useCurrentBounds = sum < 1,
                list = entities.filter(({cameraFocus}) => cameraFocus > 0),
                reduce = (property) => [({focus, result}, {cameraFocus, cameraBounds}) => {
                    const
                        value = cameraBounds[property];

                    if (cameraFocus > focus) {
                        cameraFocus = focus;
                    }
                    return {
                        focus: (cameraFocus <= focus) ? focus - cameraFocus : 0,
                        result: result + cameraFocus * value
                    };
                }, {
                    focus: sum,
                    result: useCurrentBounds ? currentBounds[property] * (1 - sum) : 0
                }],
                {result: t} = list.sort(({cameraBounds: {top: a}}, {cameraBounds: {top: b}}) => a - b).reduce(...reduce('top')),
                {result: b} = list.sort(({cameraBounds: {bottom: a}}, {cameraBounds: {bottom: b}}) => b - a).reduce(...reduce('bottom')),
                {result: l} = list.sort(({cameraBounds: {left: a}}, {cameraBounds: {left: b}}) => a - b).reduce(...reduce('left')),
                {result: r} = list.sort(({cameraBounds: {right: a}}, {cameraBounds: {right: b}}) => b - a).reduce(...reduce('right')),
                lastBounds = AABB.setUp(currentBounds);

            currentBounds.setBounds(l, t, r, b);
            if (this.width !== currentBounds.width || this.height !== currentBounds.height) {
                this.width = currentBounds.width;
                this.height = currentBounds.height;
                this.matchAspectRatio();
                this.resize();
            } else {
                this.matchAspectRatio();
            }

            if (!unbounded) {
                if (width) {
                    if (width < currentBounds.width) {
                        currentBounds.moveX(x);
                    } else if (left > currentBounds.left) {
                        currentBounds.moveX(left + currentBounds.halfWidth);
                    } else if (right < currentBounds.right) {
                        currentBounds.moveX(right - currentBounds.halfWidth);
                    }
                }
                if (height) {
                    if (height < currentBounds.height) {
                        currentBounds.moveY(y);
                    } else if (top > currentBounds.top) {
                        currentBounds.moveY(top + currentBounds.halfHeight);
                    } else if (bottom < currentBounds.bottom) {
                        currentBounds.moveY(bottom - currentBounds.halfHeight);
                    }
                }
            }

            if (lastBounds.equals(currentBounds)) {
                lastBounds.recycle();
                return false;
            } else {
                lastBounds.recycle();
                return true;
            }
        },

        matchAspectRatio () {
            const
                {height, owner, width, worldCamera} = this,
                {viewport} = worldCamera,
                worldAspectRatio = width / height,
                windowAspectRatio = owner.width / owner.height;
            
            if (windowAspectRatio > worldAspectRatio) {
                viewport.resize(height * windowAspectRatio, height);
            } else {
                viewport.resize(width, width / windowAspectRatio);
            }
        },
        
        clampAspectRatio () {
            const
                {height, owner, viewport, width} = this,
                worldAspectRatio = width / height,
                windowAspectRatio = owner.width / owner.height;
            
            if (windowAspectRatio > worldAspectRatio) {
                viewport.resize(viewport.height * worldAspectRatio, viewport.height);
            } else {
                viewport.resize(viewport.width, viewport.width / worldAspectRatio);
            }
        },
        
        resize: function () {
            const
                {container, height, owner, viewport, width, worldCamera} = this,
                worldAspectRatio = width / height,
                windowAspectRatio = owner.width / owner.height,
                {viewport: worldVP} = worldCamera;
            
            //The dimensions of the camera in the window
            viewport.setAll(owner.width / 2, owner.height / 2, owner.width, owner.height);
            
            if (windowAspectRatio > worldAspectRatio) {
                worldVP.resize(height * windowAspectRatio, height);
            } else {
                worldVP.resize(width, width / windowAspectRatio);
            }
            
            this.worldPerWindowUnitWidth  = worldVP.width  / viewport.width;
            this.worldPerWindowUnitHeight = worldVP.height / viewport.height;
            this.windowPerWorldUnitWidth  = viewport.width  / worldVP.width;
            this.windowPerWorldUnitHeight = viewport.height / worldVP.height;
            
            container.updateTransform({
                x: viewport.x - viewport.halfWidth,
                y: viewport.y - viewport.halfHeight
            });
            
            this.viewportUpdate = true;
            
            this.updateMovementMethods();
        },
        
        updateMovementMethods: (function () {
            // This is used to change movement modes as needed rather than doing a check every tick to determine movement type. - DDD 2/29/2016
            const
                centerX = function () {
                    const
                        {worldDimensions} = this;
                    
                    this.worldCamera.viewport.moveX(worldDimensions.width / 2 + worldDimensions.left);
                    this.moveX = doNothing;
                    return true;
                },
                centerY = function () {
                    const
                        {worldDimensions} = this;
                    
                    this.worldCamera.viewport.moveY(worldDimensions.height / 2 + worldDimensions.top);
                    this.moveY = doNothing;
                    return true;
                },
                containX = function (x) {
                    const
                        {worldDimensions, worldCamera} = this,
                        {viewport} = worldCamera,
                        {left, width} = worldDimensions;
                    
                    if (Math.abs(viewport.x - x) > this.threshold) {
                        if (x + viewport.halfWidth > width + left) {
                            viewport.moveX(width - viewport.halfWidth + left);
                        } else if (x < viewport.halfWidth + left) {
                            viewport.moveX(viewport.halfWidth + left);
                        } else {
                            viewport.moveX(x);
                        }
                        return true;
                    }
                    return false;
                },
                containY = function (y) {
                    const
                        {worldDimensions, worldCamera} = this,
                        {viewport} = worldCamera,
                        {height, top} = worldDimensions;
                    
                    if (Math.abs(viewport.y - y) > this.threshold) {
                        if (y + viewport.halfHeight > height + top) {
                            viewport.moveY(height - viewport.halfHeight + top);
                        } else if (y < viewport.halfHeight + top) {
                            viewport.moveY(viewport.halfHeight + top);
                        } else {
                            viewport.moveY(y);
                        }
                        return true;
                    }
                    return false;
                },
                allX = function (x) {
                    const
                        {threshold, worldCamera} = this,
                        {viewport} = worldCamera;
                    
                    if (Math.abs(viewport.x - x) > threshold) {
                        viewport.moveX(x);
                        return true;
                    }
                    return false;
                },
                allY = function (y) {
                    const
                        {threshold, worldCamera} = this,
                        {viewport} = worldCamera;
                    
                    if (Math.abs(viewport.y - y) > threshold) {
                        viewport.moveY(y);
                        return true;
                    }
                    return false;
                };
            
            return function () {
                const
                    {threshold, unbounded, worldCamera, worldDimensions} = this,
                    {viewport} = worldCamera,
                    {height, width} = worldDimensions;
                
                if (unbounded || !width) {
                    this.moveX = allX;
                } else if (width < viewport.width) {
                    this.moveX = centerX;
                } else {
                    this.moveX = containX;
                }

                if (unbounded || !height) {
                    this.moveY = allY;
                } else if (height < viewport.height) {
                    this.moveY = centerY;
                } else {
                    this.moveY = containY;
                }

                // Make sure camera is correctly contained:
                this.threshold = -1; // forces update
                this.moveX(viewport.x);
                this.moveY(viewport.y);
                this.threshold = threshold;
            };
        }()),

        updateViewport: function () {
            const
                {container, message: msg, owner, stationary, viewportUpdate, windowPerWorldUnitHeight, windowPerWorldUnitWidth, world, worldCamera} = this,
                {viewport} = msg;
            
            if (viewportUpdate) {
                this.viewportUpdate = false;
                this.stationary = false;
                msg.stationary = false;
                
                viewport.set(worldCamera.viewport);

                // Set up the rest of the camera message:
                msg.scaleX = windowPerWorldUnitWidth;
                msg.scaleY = windowPerWorldUnitHeight;
                msg.orientation = worldCamera.orientation;
                
                // Transform the world to appear within camera
                world.x = -viewport.x;
                world.y = -viewport.y;
                container.x = viewport.halfWidth * msg.scaleX;
                container.y = viewport.halfHeight * msg.scaleY;
                container.scale.x = msg.scaleX;
                container.scale.y = msg.scaleY;
                container.rotation = msg.orientation;
                container.visible = true;

                /**
                 * This component fires "camera-update" when the position of the camera in the world has changed. This event is triggered on both the entity (typically a layer) as well as children of the entity.
                 *
                 * @event platypus.Entity#camera-update
                 * @param message {Object}
                 * @param message.world {platypus.AABB} The dimensions of the world map.
                 * @param message.orientation {Number} Number describing the orientation of the camera.
                 * @param message.scaleX {Number} Number of window pixels that comprise a single world coordinate on the x-axis.
                 * @param message.scaleY {Number} Number of window pixels that comprise a single world coordinate on the y-axis.
                 * @param message.viewport {platypus.AABB} An AABB describing the world viewport area.
                 * @param message.stationary {Boolean} Whether the camera is moving.
                 **/
                owner.triggerEvent('camera-update', msg);
                if (owner.triggerEventOnChildren) {
                    owner.triggerEventOnChildren('camera-update', msg);
                }
            } else if (!stationary) {
                this.stationary = true;
                msg.stationary = true;

                owner.triggerEvent('camera-update', msg);
                if (owner.triggerEventOnChildren) {
                    owner.triggerEventOnChildren('camera-update', msg);
                }
            }
        },
        
        destroy: function () {
            this.parentContainer.removeChild(this.container);
            this.parentContainer = null;
            this.container = null;
            if (this.mouseVector) {
                this.mouseVector.recycle();
                this.mouseWorldOrigin.recycle();
            }
            
            this.viewport.recycle();
            this.worldCamera.viewport.recycle();
            this.worldCamera.recycle();
            this.message.viewport.recycle();
            this.message.recycle();
            this.cameraLoadedMessage.recycle();
            this.worldDimensions.recycle();
        }
    },

    publicMethods: {
        /**
         * Returns whether a particular display object intersects the camera's viewport on the canvas.
         *
         * @method platypus.components.Camera#isOnCanvas
         * @param bounds {PIXI.Rectangle|Object} The bounds of the display object.
         * @param bounds.height {Number} The height of the display object.
         * @param bounds.width {Number} The width of the display object.
         * @param bounds.x {Number} The left edge of the display object.
         * @param bounds.y {Number} The top edge of the display object.
         * @return {Boolean} Whether the display object intersects the camera's bounds.
         */
        isOnCanvas: function (bounds) {
            const
                {canvas} = this;

            return !bounds || !((bounds.x + bounds.width < 0) || (bounds.x > canvas.width) || (bounds.y + bounds.height < 0) || (bounds.y > canvas.height));
        },

        /**
         * Returns a world coordinate corresponding to a provided window coordinate.
         *
         * @method platypus.components.Camera#windowToWorld
         * @param windowVector {platypus.Vector} A vector describing a window position.
         * @param withOffset {Boolean} Whether to provide a world position relative to the camera's location.
         * @param vector {platypus.Vector} If provided, this is used as the return vector.
         * @return {platypus.Vector} A vector describing a world position.
         */
        windowToWorld: function (windowVector, withOffset, vector) {
            const
                worldVector = vector || Vector.setUp();
            
            worldVector.x = windowVector.x * this.worldPerWindowUnitWidth;
            worldVector.y = windowVector.y * this.worldPerWindowUnitHeight;
            
            if (withOffset !== false) {
                worldVector.x += this.worldCamera.viewport.left;
                worldVector.y += this.worldCamera.viewport.top;
            }

            return worldVector;
        },
        
        /**
         * Returns a window coordinate corresponding to a provided world coordinate.
         *
         * @method platypus.components.Camera#worldToWindow
         * @param worldVector {platypus.Vector} A vector describing a world position.
         * @param withOffset {Boolean} Whether to provide a window position relative to the camera's location.
         * @param vector {platypus.Vector} If provided, this is used as the return vector.
         * @return {platypus.Vector} A vector describing a window position.
         */
        worldToWindow: function (worldVector, withOffset, vector) {
            const
                windowVector = vector || Vector.setUp();

            windowVector.x = worldVector.x * this.windowPerWorldUnitWidth;
            windowVector.y = worldVector.y * this.windowPerWorldUnitHeight;
            
            if (withOffset !== false) {
                windowVector.x += this.viewport.x;
                windowVector.y += this.viewport.y;
            }

            return windowVector;
        }
    }
});
