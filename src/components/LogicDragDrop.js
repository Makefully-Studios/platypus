/* global platypus */
import {Container, Rectangle} from 'pixi.js';
import {createComponentClass} from 'platypus';

const
    claimHitArea = new Rectangle(-2000, -2000, 4000, 4000),
    allDraggedItems = [];

export default createComponentClass(/** @lends platypus.components.LogicDragDrop.prototype */{
    id: 'LogicDragDrop',
    
    properties: {
        //TODO: Impement Multi-Drag

        /**
         * Sets how far a `pressmove` event can deviate from the original `pointerdown` before a stickyClick becomes unstuck (ie normal drag-drop). `0` means any movement will unstick the click. `10` means the mouse needs to move more than 10 units before the unstick occurs. `stickyClick` must be enabled for this property to matter.
         * 
         * @property stickiness
         * @type Number
         * @default 0
         */
        stickiness: 0,

        /**
         * Sets whether an entity can be dragged at initial. Change via disable-drag().
         *
         * @property dragDisabled
         * @type Boolean
         * @default false
         */
        dragDisabled: false

    },

    publicProperties: {
        /**
         * Sets whether a click-move should start the dragging behavior in addition to click-drag. Defaults to `true` on desktop and `false` on mobile devices.
         *
         * @property stickyClick
         * @type Boolean
         * @default undefined
         */
        stickyClick: undefined
    },
    
    /**
     * A component that allows an object to be dragged and dropped. Can use collision to prevent dropping the objects in certain locations.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#camera-update
     * @listens platypus.Entity#component-added
     * @listens platypus.Entity#handle-logic
     * @listens platypus.Entity#handle-post-collision-logic
     * @listens platypus.Entity#pointerdown
     * @listens platypus.Entity#pointermove
     * @listens platypus.Entity#prepare-logic
     * @listens platypus.Entity#pressmove
     * @listens platypus.Entity#pressup
     */
    initialize: function () {
        this.aabb = this.owner.parent.worldCamera.viewport;
        this.cameraScaleX = 1;
        this.cameraScaleY = 1;
        this.nextX = this.owner.x;
        this.nextY = this.owner.y;
        this.grabOffsetX = 0;
        this.grabOffsetY = 0;
        this.state = this.owner.state;
        this.state.set('dragging', false);
        this.dragId = null;
        this.originalContainer = null
        this.dragContainer = new Container();

        this.dragContainer.zIndex = Infinity;

        if (this.stickyClick === undefined) {
            this.stickyClick = platypus.supports.mobile;
        }
        this.releaseStick = false;
    },

    events: {
        "camera-update": function ({scaleX, scaleY}) {
            this.cameraScaleX = scaleX;
            this.cameraScaleY = scaleY;
            this.checkCamera();
        },
        
        "prepare-logic": function () {
            this.checkCamera(); // may end dragging
        },

        "handle-logic": function () {
            let defaultCancelled = false;

            if (this.state.get('dragging')) {
                const
                    {dragContainer, nextX, nextY, owner} = this;

                owner.triggerEvent('dragging', {
                    dragContainer,
                    entity: owner,
                    x: nextX,
                    y: nextY,
                    pointer: {
                        x: nextX + this.grabOffsetX,
                        y: nextY + this.grabOffsetY
                    },
                    preventDefault: () => {
                        defaultCancelled = true;
                    }
                });

                if (!defaultCancelled) {
                    owner.x = nextX;
                    owner.y = nextY;
                }
            }
        },

        "pointerdown": function (eventData) {
            if (this.dragDisabled) {
                return;
            }

            if (this.sticking) {
                this.sticking = null;
                this.nextX = eventData.x - this.grabOffsetX;
                this.nextY = eventData.y - this.grabOffsetY;
                this.releaseStick = true; // Delay release until logic runs in case of collision checks, etc.
            } else {
                const
                    {owner} = this;

                if (this.dragId === null) {
                    const
                        {dragContainer} = this;
                    let defaultCancelled = false;

                    this.dragId = eventData.event.pointerId;

                    owner.triggerEvent('drag-start', {
                        dragContainer,
                        entity: owner,
                        preventDefault: () => {
                            defaultCancelled = true;
                        }
                    });

                    if (defaultCancelled) {
                        this.dragId = null;
                    } else {
                        const
                            {state} = this,
                            {x, y} = owner;

                        this.nextX = x;
                        this.nextY = y;
                        this.grabOffsetX = (eventData.x >> 0) - x;
                        this.grabOffsetY = (eventData.y >> 0) - y;
                        state.set('dragging', true);
                        owner.dragMode = true;
                        this.sticking = this.stickyClick ? {x, y} : null;
                        this.claimPointer();
        
                        // put in top layer
                        this.checkCamera(); //update dragContainer dimensions
                        this.originalContainer = owner.container.parent;
                        dragContainer.addChild(owner.container);
                        owner.parent.stage.addChild(dragContainer);
                        allDraggedItems.push(this);
                    }
                }
            }
            
            eventData.pixiEvent.stopPropagation();
        },

        "pressup": function (eventData) {
            if (this.releaseStick) {
                this.release();
                this.releaseStick = false;
                return;
            }

            if (!this.state.get('dragging')) {
                return;
            }

            if (this.dragId !== null && !this.sticking) {
                this.release();
            }
            
            eventData.pixiEvent.stopPropagation();
        },

        "pointermove": function (eventData) {
            if (!this.state.get('dragging')) {
                return;
            }

            if (this.sticking) {
                this.nextX = eventData.x - this.grabOffsetX;
                this.nextY = eventData.y - this.grabOffsetY;
                
                eventData.event.preventDefault();
                eventData.pixiEvent.stopPropagation();
            }
        },

        "pressmove": function (eventData) {
            if (!this.state.get('dragging')) {
                return;
            }
            
            if (this.dragId !== null) {
                const
                    {stickiness, sticking} = this;

                this.nextX = eventData.x - this.grabOffsetX;
                this.nextY = eventData.y - this.grabOffsetY;
                if (sticking && (Math.pow(this.nextX - sticking.x, 2) + Math.pow(this.nextY - sticking.y, 2) > Math.pow(stickiness, 2))) {
                    this.sticking = null;
                }
                
                eventData.event.preventDefault();
                eventData.pixiEvent.stopPropagation();
            }
        },

        "disable-drag": function (disable) {
            //If we don't send in a value, we toggle the dragDisabled.
            this.dragDisabled = typeof disable === 'boolean' ? disable : !this.dragDisabled;

            if (this.dragDisabled && this.state.get('dragging')) {
                this.release();
            }
        }
    },
    
    methods: {// These are methods that are called by this component.
        checkCamera () {
            const
                {state} = this;

            if (state?.get('dragging')) {
                const
                    {aabb} = this;

                if (!aabb.containsPoint(this.nextX + this.grabOffsetX, this.nextY + this.grabOffsetY)) {
                    this.release();
                } else { // adjust container if needed.
                    const
                        {cameraScaleX, cameraScaleY, dragContainer} = this;
    
                    dragContainer.scale.x = cameraScaleX;
                    dragContainer.scale.y = cameraScaleY;
                    dragContainer.x = -(aabb.left * cameraScaleX);
                    dragContainer.y = -(aabb.top * cameraScaleY);
                }
            }
        },

        claimPointer () {
            this.lastHitArea = this.owner.container.hitArea;

            this.owner.container.hitArea = claimHitArea; // capture all the clicks!
        },

        releasePointer () {
            this.owner.container.hitArea = this.lastHitArea;
        },

        releaseContainer () {
            const
                {originalContainer, owner} = this,
                index = allDraggedItems.indexOf(this);

            if (index >= 0) {
                allDraggedItems.splice(index, 1);
            }

            if (originalContainer) {
                owner.parent.stage.removeChild(this.dragContainer);
                originalContainer.addChild(owner.container);
                this.originalContainer = null;
            }
        },

        release () {
            const
                {dragContainer, owner, state} = this,
                dropX = owner.x,
                dropY = owner.y;
            let defaultCancelled = false;

            this.sticking = null;

            this.dragId = null;
            state.set('dragging', false);
            owner.dragMode = false;
            this.releasePointer();

            this.releaseContainer();

            owner.triggerEvent('drop', {
                dragContainer,
                entity: owner,
                x: dropX,
                y: dropY,
                preventDefault: () => {
                    defaultCancelled = true;
                }
            });

            if (!defaultCancelled) {
                //do default drop actions here
                owner.x = dropX;
                owner.y = dropY;
                owner.triggerEvent('drop-complete');
            }
        },
        
        destroy () {
            if (this.state.get('dragging')) {
                this.dragId = null;
                this.releaseContainer();
                this.state.set('dragging', false);
            }
            this.owner.dragMode = false;
            this.state = null;
        }
    }
});
