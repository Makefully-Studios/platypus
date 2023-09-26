import {Circle, Polygon, Rectangle} from 'pixi.js';
import Data from '../Data.js';
import createComponentClass from '../factory.js';
import {arrayCache} from '../utils/array.js';

const
    savedHitAreas = {}; //So generated hitAreas are reused across identical entities.

export default createComponentClass(/** @lends platypus.components.Interactive.prototype */{
    id: 'Interactive',

    properties: {
        /**
         * Sets the container that represents the interactive area.
         *
         * @property container
         * @type PIXI.Container
         * @default null
         */
        "container": null,

        /**
         * Sets the hit area for interactive responses by describing the dimensions of a clickable rectangle:
         *
         *     "hitArea": {
         *         "x": 10,
         *         "y": 10,
         *         "width": 40,
         *         "height": 40
         *     }
         *
         * Or a circle:
         *
         *     "hitArea": {
         *         "x": 10,
         *         "y": 10,
         *         "radius": 40
         *     }
         *
         * Or use an array of numbers to define a polygon: [x1, y1, x2, y2, ...]
         *
         *     "hitArea": [-10, -10, 30, -10, 30, 30, -5, 30]
         *
         * Defaults to the container if not specified.
         *
         * @property hitArea
         * @type Object
         * @default null
         */
        "hitArea": null,

        /**
         * Sets whether the entity should respond to mouse hovering.
         *
         * @property hover
         * @type Boolean
         * @default false
         */
        "hover": false,

        /**
         * Used when returning world coordinates. Typically coordinates are relative to the parent, but when this component is added to the layer level, coordinates must be relative to self.
         *
         * @property relativeToSelf
         * @type String
         * @default false
         */
        "relativeToSelf": false,

        /**
         * Whether camera updates should trigger "pointermove" and "pressmove" events.
         *
         * @property trackCameraUpdates
         * @type Boolean
         * @default false
         */
        "trackCameraUpdates": false
    },
    
    publicProperties: {
        /**
         * Determines whether hovering over the sprite should alter the cursor.
         *
         * @property buttonMode
         * @type Boolean
         * @default false
         * @deprecated
         */
        buttonMode: false
    },
    
    /**
     * This component accepts touches and clicks on the entity. It is typically automatically added by a render component that requires interactive functionality.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#dispatch-event
     * @listens platypus.Entity#handle-render
     * @listens platypus.Entity#input-off
     * @listens platypus.Entity#input-on
     * @listens platypus.Entity#set-hit-area
     * @fires platypus.Entity#pressmove
     * @fires platypus.Entity#pressup
     * @fires platypus.Entity#pointerdown
     * @fires platypus.Entity#pointermove
     * @fires platypus.Entity#pointertap
     * @fires platypus.Entity#pointerout
     * @fires platypus.Entity#pointerover
     * @fires platypus.Entity#pointerup
     * @fires platypus.Entity#pointerupoutside
     * @fires platypus.Entity#pointercancel
     */
    initialize: function () {
        this.pressed = null;
        if (this.hitArea) {
            this.container.hitArea = this.setHitArea(this.hitArea);
        }

        if (this.buttonMode) {
            platypus.debug.warn('Interactive: "buttonMode" is deprecated. Set "cursor" to "pointer" on the entity instead.');
        }

        this.dragOver = false;
    },

    events: {
        /**
         * This event dispatches a PIXI.Event on this component's PIXI.Sprite. Useful for rerouting mouse/keyboard events.
         *
         * @event platypus.Entity#dispatch-event
         * @param event {Object | PIXI.Event} The event to dispatch.
         */
        "dispatch-event": function (event) {
            this.sprite.dispatchEvent(this.sprite, event.event, event.data);
        },

        'camera-update': function () {
            if (this.dragOver) {
                this.dragOver();
            }
        },
        
        "input-on": function () {
            if (!this.removeInputListeners) {
                this.addInputs();
            }
        },
        
        "input-off": function () {
            if (this.removeInputListeners) {
                this.removeInputListeners();
            }
        },

        "pointerdown": function (event) {
            if (this.pressed === null) { // so extra multi-touch presses won't trigger 'pressmove' / 'pressup'
                this.pressed = event.pixiEvent.pointerId;
            }
        },

        "pointermove": function (event) {
            if (this.pressed === event.pixiEvent.pointerId) {
                /**
                 * This event is triggered on press move (drag).
                 *
                 * @event platypus.Entity#pressmove
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                this.owner.triggerEvent('pressmove', event);
            }
        },

        "pointerup": function (event) {
            if (this.pressed === event.pixiEvent.pointerId) {
                /**
                 * This event is triggered on press up.
                 *
                 * @event platypus.Entity#pressup
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                this.owner.triggerEvent('pressup', event);
                this.pressed = null;
            }
        },

        "pointerupoutside": function (event) {
            if (this.pressed === event.pixiEvent.pointerId) {
                this.owner.triggerEvent('pressup', event);
                this.pressed = null;
            }
        },

        "pointercancel": function (event) {
            if (this.pressed === event.pixiEvent.pointerId) {
                this.owner.triggerEvent('pressup', event);
                this.pressed = null;
            }
        },

        /**
         * Sets the hit area for interactive responses by describing the dimensions of a clickable rectangle:
         *
         *     "hitArea": {
         *         "x": 10,
         *         "y": 10,
         *         "width": 40,
         *         "height": 40
         *     }
         *
         * Or a circle:
         *
         *     "hitArea": {
         *         "x": 10,
         *         "y": 10,
         *         "radius": 40
         *     }
         *
         * Or use an array of numbers to define a polygon: [x1, y1, x2, y2, ...]
         *
         *     "hitArea": [-10, -10, 30, -10, 30, 30, -5, 30]
         *
         * Defaults to the container if set to `null`.
         *
         * @event platypus.Entity#set-hit-area
         * @param {Object} shape
         */
        "set-hit-area": function (shape) {
            this.container.hitArea = this.setHitArea(shape);
        }
    },
    
    methods: {
        addInputs () {
            const
                sprite = this.container,
                removals = arrayCache.setUp(),
                addListener = (event, handler) => {
                    sprite.addListener(event, handler);
                    removals.push(() => {
                        sprite.removeListener(event, handler);
                    });
                },
                trigger = (target, eventName, event) => {
                    const
                        {container} = target;
                    
                    if (
                        container && //TML - This is in case we do a scene change using an event and the container is destroyed.
                        event.data.originalEvent // This is a workaround for a bug in Pixi 3 where phantom hover events are triggered. - DDD 7/20/16
                        ) {
                        const
                            {owner, relativeToSelf} = target,
                            camera = owner.worldCamera?.viewport ?? owner.parent.worldCamera.viewport,
                            matrix = relativeToSelf ? container.transform.worldTransform : container.parent.transform.worldTransform,
                            msg = Data.setUp(
                                "event", event.data.originalEvent,
                                "pixiEvent", event,
                                "x", event.data.global.x / matrix.a + camera.left,
                                "y", event.data.global.y / matrix.d + camera.top,
                                "entity", owner
                            );
        
                        owner.trigger(eventName, msg);
                        msg.recycle();
                    }
                };
                
            // The following appends necessary information to displayed objects to allow them to receive touches and clicks
            sprite.eventMode = 'static';
            
            addListener('pointerdown', (event) => {
                /**
                 * This event is triggered on pointer down.
                 *
                 * @event platypus.Entity#pointerdown
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                trigger(this, 'pointerdown', event);
                event.currentTarget.mouseTarget = true;
            });
            addListener('pointerup', (event) => {
                /**
                 * This event is triggered on pointer up.
                 *
                 * @event platypus.Entity#pointerup
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                trigger(this, 'pointerup', event);
                event.currentTarget.mouseTarget = false;
                
                if (event.currentTarget.removeDisplayObject) {
                    event.currentTarget.removeDisplayObject();
                }
            });
            addListener('pointerupoutside', (event) => {
                /**
                 * This event is triggered on pointer up outside.
                 *
                 * @event platypus.Entity#pointerupoutside
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                trigger(this, 'pointerupoutside', event);
                event.currentTarget.mouseTarget = false;
                
                if (event.currentTarget.removeDisplayObject) {
                    event.currentTarget.removeDisplayObject();
                }
            });
            addListener('pointercancel', (event) => {
                /**
                 * This event is triggered on pointer cancel.
                 *
                 * @event platypus.Entity#pointercancel
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                trigger(this, 'pointercancel', event);
                event.currentTarget.mouseTarget = false;
                
                if (event.currentTarget.removeDisplayObject) {
                    event.currentTarget.removeDisplayObject();
                }
            });
            addListener('pointermove', (event) => {
                /**
                 * This event is triggered on pointer move.
                 *
                 * @event platypus.Entity#pointermove
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                trigger(this, 'pointermove', event);
                event.currentTarget.mouseTarget = true;
            });
            addListener('pointertap', (event) => {
                /**
                 * This event is triggered on pointer tap.
                 *
                 * @event platypus.Entity#pointertap
                 * @param event {DOMEvent} The original DOM pointer event.
                 * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                 * @param x {Number} The x coordinate in world units.
                 * @param y {Number} The y coordinate in world units.
                 * @param entity {platypus.Entity} The entity receiving this event.
                 */
                trigger(this, 'pointertap', event);
            });

            if (this.hover) {
                addListener('pointerover', (event) => {
                    /**
                     * This event is triggered on pointer over.
                     *
                     * @event platypus.Entity#pointerover
                     * @param event {DOMEvent} The original DOM pointer event.
                     * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                     * @param x {Number} The x coordinate in world units.
                     * @param y {Number} The y coordinate in world units.
                     * @param entity {platypus.Entity} The entity receiving this event.
                     */
                    trigger(this, 'pointerover', event);
                });
                addListener('pointerout', (event) => {
                    /**
                     * This event is triggered on pointer out.
                     *
                     * @event platypus.Entity#pointerout
                     * @param event {DOMEvent} The original DOM pointer event.
                     * @param pixiEvent {PIXI.interaction.InteractionEvent} The Pixi pointer event.
                     * @param x {Number} The x coordinate in world units.
                     * @param y {Number} The y coordinate in world units.
                     * @param entity {platypus.Entity} The entity receiving this event.
                     */
                    trigger(this, 'pointerout', event);
                });
            }

            if (this.trackCameraUpdates) {
                const
                    handlePositionUpdate = (event) => {
                        if (over) {
                            over = event;
                        }
                    };
                let over = null;

                this.dragOver = () => {
                    if (over) {
                        trigger(this, 'pointermove', over);
                    }
                };

                addListener('pointerover', (event) => over = event);
                addListener('pointerdown', handlePositionUpdate);
                addListener('pointermove', handlePositionUpdate);
                addListener('pointerout', () => over = null);
                
                removals.push(() => {
                    over = null;
                    this.dragOver = null;
                });
            }

            this.removeInputListeners = () => {
                for (let i = 0; i < removals.length; i++) {
                    removals[i]();
                }
                arrayCache.recycle(removals);
                sprite.eventMode = 'auto';
                this.removeInputListeners = null;
            };
        },

        setHitArea (shape) {
            const
                sav = JSON.stringify(shape);
            let ha = savedHitAreas[sav];

            if (!ha) {
                if (Array.isArray(shape)) {
                    ha = new Polygon(shape);
                } else if (shape.radius) {
                    ha = new Circle(shape.x ?? 0, shape.y ?? 0, shape.radius);
                } else {
                    ha = new Rectangle(shape.x ?? 0, shape.y ?? 0, shape.width ?? this.owner.width ?? 0, shape.height ?? this.owner.height ?? 0);
                }
                
                savedHitAreas[sav] = ha;
            }
            
            return ha;
        },

        toJSON () { // This component is added by another component, so it shouldn't be returned for reconstruction.
            return null;
        },

        destroy () {
            const
                {container, removeInputListeners} = this;

            if (removeInputListeners) {
                removeInputListeners();
            }
            
            // This handles removal after the mouseup event to prevent weird input behaviors. If it's not currently a mouse target, we let the render component handle its removal from the parent container.
            if (container.mouseTarget && container.parent) {
                container.visible = false;
                container.removeDisplayObject = () => {
                    if (container.parent) {
                        container.parent.removeChild(container);
                    }
                    this.container = null;
                };
            }
        }
    }
});
