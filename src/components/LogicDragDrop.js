/* global platypus */
import AABB from '../AABB.js';
import {Rectangle} from 'pixi.js';
import createComponentClass from '../factory.js';

const
    claimHitArea = new Rectangle(-2000, -2000, 4000, 4000);

export default createComponentClass(/** @lends LogicDragDrop.prototype */{
    id: 'LogicDragDrop',
    
    properties: {
        /**
         * Sets the renderParent while being dragged.
         *
         * @property dragRenderParent
         * @type string
         * @default ''
         */
        dragRenderParent: '',
        
        /**
         * Sets whether a click-move should start the dragging behavior in addition to click-drag. This value is ignored for mobile devices.
         *
         * @property stickyClick
         * @type Boolean
         * @default false
         */
        stickyClick: false
    },
    
    /**
     * A component that allows an object to be dragged and dropped. Can use collision to prevent dropping the objects in certain locations.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens Entity#component-added
     */
    initialize: function () {
        this.aabb = AABB.setUp();
        this.nextX = this.owner.x;
        this.nextY = this.owner.y;
        this.lastZ = this.owner.z;
        this.grabOffsetX = 0;
        this.grabOffsetY = 0;
        this.state = this.owner.state;
        this.state.set('dragging', false);
        this.state.set('noDrop', false);
        this.tryDrop = false;
        this.hitSomething = false;
        this.hasCollision = false;
        
        if (platypus.supports.mobile) {
            this.stickyClick = false;
        }
    },

    events: {
        /**
         * This component listens for camera updates to know when a dragged item goes off-camera.
         *
         * @method 'camera-update'
         * @param camera {platypus.Data} Camera update information
         * @param camera.viewport {platypus.AABB} The bounding box describing the camera viewport location in the world.
         */
        "camera-update": function (camera) {
            this.aabb.set(camera.viewport);
            this.checkCamera();
        },

        "component-added": function (component) {
            if (component.type === 'CollisionBasic') {
                this.hasCollision = true;
            }
        },
        
        /**
         * Listens for this event to check bounds.
         *
         * @method 'prepare-logic'
         */
        "prepare-logic": function () {
            this.checkCamera(); // may end dragging
        },

        /**
         * Updates the object's location on the handle-logic tick.
         *
         * @method 'handle-logic'
         */
        "handle-logic": function () {
            if (this.state.get('dragging')) {
                this.owner.x = this.nextX;
                this.owner.y = this.nextY;
                this.owner.triggerEvent('hovering');
            }
            
            this.state.set('noDrop', false);
        },

        /**
         * Resolves whether the object state after we check if there are any collisions. If the object was dropped and can be dropped, it is.
         *
         * @method 'handle-post-collision-logic'
         */
        "handle-post-collision-logic": function () {
            if (this.tryDrop) {
                this.tryDrop = false;
                if (this.hitSomething) {
                    this.dropFailed = false;
                    this.state.set('noDrop', true);
                    this.state.set('dragging', true);
                    this.owner.dragMode = true;
                } else {
                    this.state.set('noDrop', false);
                    this.state.set('dragging', false);
                    this.owner.dragMode = false;
                }
            } else if (this.hitSomething) {
                this.state.set('noDrop', true);
            }
            this.hitSomething = false;
        },

        /**
         * The pointerdown event fires when we're grabbing the object. Starts the drag.
         *
         * @method 'pointerdown'
         * @param eventData {platypus.Data} The event data.
         */
        "pointerdown": function (eventData) {
            if (this.sticking) {
                this.sticking = false;
                this.releasePointer();
                this.release();
            } else {
                this.nextX = this.owner.x;
                this.nextY = this.owner.y;
                this.lastZ = this.owner.z;
                this.grabOffsetX = (eventData.x >> 0) - this.owner.x;
                this.grabOffsetY = (eventData.y >> 0) - this.owner.y;
                this.state.set('dragging', true);
                if (this.dragRenderParent !== this.owner.renderParent) {
                    this.originalRenderParent = this.owner.renderParent;
                    this.owner.parent.triggerEvent("set-parent-render-container", this.owner, this.dragRenderParent);
                }
                this.owner.dragMode = true;
                this.sticking = this.stickyClick;
                if (this.sticking) {
                    this.claimPointer();
                }
            }
            
            eventData.pixiEvent.stopPropagation();
        },

        /**
         * The pressup event fires when we're trying to drop the object.
         *
         * @method 'pressup'
         * @param eventData {platypus.Data} The event data.
         */
        "pressup": function (eventData) {
            if (!this.sticking) {
                this.release();
            }
            
            eventData.pixiEvent.stopPropagation();
        },

        /**
         * The pointermove event tells us when we're dragging a "stickyClick" object.
         *
         * @method 'pointermove'
         * @param eventData {platypus.Data} The event data.
         */
        "pointermove": function (eventData) {
            if (this.sticking) {
                this.nextX = eventData.x - this.grabOffsetX;
                this.nextY = eventData.y - this.grabOffsetY;
                
                eventData.event.preventDefault();
                eventData.pixiEvent.stopPropagation();
            }
        },

        /**
         * The pressmove event tells us when we're dragging the object.
         *
         * @method 'pressmove'
         * @param eventData {platypus.Data} The event data.
         */
        "pressmove": function (eventData) {
            this.nextX = eventData.x - this.grabOffsetX;
            this.nextY = eventData.y - this.grabOffsetY;
            if (this.sticking && (this.nextX !== this.owner.x || this.nextY !== this.owner.y)) {
                this.sticking = false;
                this.releasePointer();
            }
            
            eventData.event.preventDefault();
            eventData.pixiEvent.stopPropagation();
        },

        /**
         * This message comes from the collision system letting us know the object is currently in a location that it cannot be dropped.
         *
         * @method 'no-drop'
         */
        "no-drop": function () {
            this.hitSomething = true;
        }
    },
    
    methods: {// These are methods that are called by this component.
        checkCamera: function () {
            if (this.state && this.state.get('dragging') && !this.aabb.containsPoint(this.nextX + this.grabOffsetX, this.nextY + this.grabOffsetY)) {
                if (this.sticking) {
                    this.sticking = false;
                    this.releasePointer();
                }
                this.release();
            }
        },

        claimPointer: function () {
            this.lastHitArea = this.owner.container.hitArea;

            this.owner.container.hitArea = claimHitArea; // capture all the clicks!
        },

        releasePointer: function () {
            this.owner.container.hitArea = this.lastHitArea;
        },

        release: function () {
            if (this.hasCollision) {
                this.tryDrop = true;
            } else {
                this.state.set('noDrop', false);
                this.state.set('dragging', false);
                if (this.originalRenderParent) {
                    this.owner.parent.triggerEvent("set-parent-render-container", this.owner, this.originalRenderParent);
                }
                this.owner.dragMode = false;
                this.owner.z = this.lastZ;
            }
            this.owner.triggerEvent('dropped', this.owner);
        },
        
        destroy: function () {
            this.state.set('dragging', false);
            this.owner.dragMode = false;
            this.state.set('noDrop', false);
            this.state = null;
            this.aabb.recycle();
            this.aabb = null;
            this.owner.z = this.lastZ;
        }
    }
});
