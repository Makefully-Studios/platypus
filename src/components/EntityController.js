import ActionState from '../ActionState.js';
import Data from '../Data.js';
import DataMap from '../DataMap.js';
import StateMap from '../StateMap.js';
import {arrayCache} from '../utils/array.js';
import createComponentClass from '../factory.js';

const
    distance = function (origin, destination) {
        const
            x = destination.x - origin.x,
            y = destination.y - origin.y;

        return Math.sqrt((x * x) + (y * y));
    },
    angle = function (origin, destination, distance) {
        const
            x = destination.x - origin.x,
            y = destination.y - origin.y,
            circle = Math.PI * 2;
        let a = 0;

        if (!distance) {
            return a;
        }

        a = Math.acos(x / distance);
        if (y < 0) {
            a = circle - a;
        }
        return a;
    },
    directions = [null, null, null, null, //joystick directions
        ['east', 'south', 'west', 'north'], null, null, null,
        ['east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north', 'northeast'], null, null, null, null, null, null, null,
        ['east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest', 'north', 'north-northeast', 'northeast', 'east-northeast']
    ],
    mouseMap = ['left-button', 'middle-button', 'right-button'],
    trigger = function (event, message) {
        if (!this.paused) {
            this.owner.trigger(event, message);
        }
    },
    filteredTrigger = function (state, event, message) {
        if (!this.paused && message[state]) {
            this.owner.trigger(event, message);
        }
    };

export default createComponentClass(/** @lends platypus.components.EntityController.prototype */{
    id: 'EntityController',
    
    properties: {
        /**
         * Use the controlMap property object to map inputs to messages that should be triggered. At least one control mapping should be included. The following are a few examples:
         *
         *       {
         *           "key:x": "run-left",
         *           // This causes an "x" keypress to fire "run-left" on the entity. For a full listing of key names, check out the `HandlerController` component.
         *
         *           "button-pressed": "throw-block",
         *           // custom input messages can be fired on this entity from other entities, allowing for on-screen input buttons to run through the same controller channel as other inputs.
         *
         *           "mouse:left-button"
         *           // The controller can also handle mouse events on the entity if the entity's render component triggers mouse events on the entity (for example, the `RenderSprite` component).
         *       }
         *
         * @property controlMap
         * @type Object
         * @default {}
         */
        controlMap: {},

        /**
         * Determines whether this entity should listen for mouse events to trigger directional events. Can be set simply to "true" to accept all joystick defaults.
         *
         *       "joystick": {
         *           "directions": 8, // Optional: 4, 8, or 16. Determines how many directions to broadcast. Default is 4 ("north", "east", "south", and "west").
         *           "innerRadius": 30, // Optional. Number determining how far the mouse must be from the entity's position before joystick events should be triggered. Default is 0.
         *           "outerRadius": 60 // Optional. Number determining how far the mouse can move away from the entity's position before the joystick stops triggering events. Default is Infinity.
         *       }
         *
         * @property joystick
         * @type Object
         * @default null
         */
        joystick: null,
        
        /**
         * The stateMaps property can hold multiple control maps. Use this if certain controls should only be available for certain states. The controller finds the first valid state and falls back to the base `controlMap` as default if no matches are found.
         *
         * @property stateMaps
         * @type Object
         * @default {}
         */
        stateMaps: {}
    },
    
    publicProperties: {
        /**
         * Whether input controls should be deactivated.
         *
         * @property paused
         * @type Boolean
         * @default false
         */
        paused: false
    },
    
    /**
     * This component listens for input messages triggered on the entity and updates the state of any controller inputs it is listening for. It then broadcasts messages on the entity corresponding to the input it received.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#[event.code]:down
     * @listens platypus.Entity#[event.code]:up
     * @listens platypus.Entity#handle-controller
     * @listens platypus.Entity#pause-controls
     * @listens platypus.Entity#pointerdown
     * @listens platypus.Entity#pressmove
     * @listens platypus.Entity#pressup
     * @listens platypus.Entity#unpause-controls
     * @fires platypus.Entity#[active-state]
     * @fires platypus.Entity#joystick:down
     * @fires platypus.Entity#joystick:up
     * @fires platypus.Entity#mouse:mouse-left:down
     * @fires platypus.Entity#mouse:mouse-middle:down
     * @fires platypus.Entity#mouse:mouse-right:down
     * @fires platypus.Entity#mouse:mouse-left:up
     * @fires platypus.Entity#mouse:mouse-middle:up
     * @fires platypus.Entity#mouse:mouse-right:up
     * @fires platypus.Entity#north
     * @fires platypus.Entity#north-northeast
     * @fires platypus.Entity#northeast
     * @fires platypus.Entity#east-northeast
     * @fires platypus.Entity#east
     * @fires platypus.Entity#east-southeast
     * @fires platypus.Entity#southeast
     * @fires platypus.Entity#south-southeast
     * @fires platypus.Entity#south
     * @fires platypus.Entity#south-southwest
     * @fires platypus.Entity#southwest
     * @fires platypus.Entity#west-southwest
     * @fires platypus.Entity#west
     * @fires platypus.Entity#west-northwest
     * @fires platypus.Entity#northwest
     * @fires platypus.Entity#north-northwest
     * @fires platypus.Entity#joystick-orientation
     * @fires platypus.Entity#stop
     */
    initialize: function (definition) {
        const
            stateMaps = this.stateMaps;

        this.actions = DataMap.setUp();
        
        if (stateMaps) {
            const
                keys = Object.keys(stateMaps),
                {length} = keys;
    
            for (let i = 0; i < length; i++) {
                const
                    key = keys[i],
                    filter = StateMap.setUp(key);

                this.addMap(stateMaps[key], key, filter);
                filter.recycle();
            }
        }
        
        this.addMap(this.controlMap, 'default');

        if (definition.joystick) {
            this.joystick = Data.setUp(
                "directions",  definition.joystick.directions  || 4, // 4 = n,e,s,w; 8 = n,ne,e,se,s,sw,w,nw; 16 = n,nne,ene,e...
                "handleEdge",  definition.joystick.handleEdge  || false,
                "innerRadius", definition.joystick.innerRadius || 0,
                "outerRadius", definition.joystick.outerRadius || Infinity
            );
        }
    },
    
    events: {
        "handle-controller": function () {
            const
                actions = this.actions,
                keys = actions.keys,
                resolution = arrayCache.setUp(),
                state = this.owner.state;
            let i = keys.length,
                j = 0;
            
            while (i--) {
                const
                    action = actions.get(keys[i]);

                if (action.update(state)) {
                    resolution.push(action);
                }
            }
            
            j = resolution.length;
            while (j--) {
                resolution[j].resolve();
            }
            
            arrayCache.recycle(resolution);
        },
        
        "pointerdown": function (value) {
            if (value.pixiEvent.data.pointerType === 'mouse') {
                /**
                 * This component triggers the state of mouse inputs on the entity if a render component of the entity accepts mouse input.
                 *
                 * @event platypus.Entity#mouse:mouse-left:down
                 * @param message {Event} The original mouse event object is passed along with the control message.
                 */
                /**
                 * This component triggers the state of mouse inputs on the entity if a render component of the entity accepts mouse input (for example [[Render-Animation]]).
                 *
                 * @event platypus.Entity#mouse:mouse-middle:down
                 * @param message {Event} The original mouse event object is passed along with the control message.
                 */
                /**
                 * This component triggers the state of mouse inputs on the entity if a render component of the entity accepts mouse input (for example [[Render-Animation]]).
                 *
                 * @event platypus.Entity#mouse:mouse-right:down
                 * @param message {Event} The original mouse event object is passed along with the control message.
                 */
                this.owner.triggerEvent('mouse:' + mouseMap[value.event.button || 0] + ':down', value.event);
            }

            if (this.joystick) {
                /**
                 * This event is triggered when there is an active touch in the joystick area.
                 *
                 * @event platypus.Entity#joystick:down
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                this.owner.triggerEvent('joystick:down', value.event);
                this.handleJoy(value);
            }
        },
        
        "pressup": function (value) {
            const
                owner = this.owner;

            if (value.pixiEvent.data.pointerType === 'mouse') {
                /**
                 * This component triggers the state of mouse inputs on the entity if a render component of the entity accepts mouse input (for example [[Render-Animation]]).
                 *
                 * @event platypus.Entity#mouse:mouse-left:up
                 * @param message {Event} The original mouse event object is passed along with the control message.
                 */
                /**
                 * This component triggers the state of mouse inputs on the entity if a render component of the entity accepts mouse input (for example [[Render-Animation]]).
                 *
                 * @event platypus.Entity#mouse:mouse-middle:up
                 * @param message {Event} The original mouse event object is passed along with the control message.
                 */
                /**
                 * This component triggers the state of mouse inputs on the entity if a render component of the entity accepts mouse input (for example [[Render-Animation]]).
                 *
                 * @event platypus.Entity#mouse:mouse-right:up
                 * @param message {Event} The original mouse event object is passed along with the control message.
                 */
                owner.triggerEvent('mouse:' + mouseMap[value.event.button || 0] + ':up', value.event);
            }

            if (this.joystick) {
                /**
                 * This event is triggered when there is an active touch is released from the joystick area.
                 *
                 * @event platypus.Entity#joystick:up
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                owner.triggerEvent('joystick:up', value.event);
                
                owner.triggerEvent('stop');
            }
        },
        
        "pressmove": function (value) {
            if (this.joystick) {
                this.handleJoy(value);
            }
        },
        
        /**
         * This message will stop the controller from triggering messages until "unpause-controls" is triggered on the entity.
         *
         * @event platypus.Entity#pause-controls
         */
        "pause-controls": function () {
            this.paused = true;
        },
        
        /**
         * This message will allow the controller to trigger messages until "pause-controls" is triggered on the entity.
         *
         * @event platypus.Entity#unpause-controls
         */
        "unpause-controls": function () {
            this.paused = false;
        }
    },

    methods: {
        handleJoy: function (event) {
            // The following translate mouse and touch events into messages that this controller can handle in a systematic way
            const
                joystick = this.joystick,
                dist = distance(owner, event);
            
            if ((dist > joystick.outerRadius) || (dist < joystick.innerRadius)) {
                return;
            } else if (!this.paused) {
                const
                    owner = this.owner,
                    divisions = Math.PI / (joystick.directions / 2),
                    orientation = angle(owner, event, dist),
                    direction = directions[joystick.directions][Math.floor(((orientation + divisions / 2) % (Math.PI * 2)) / divisions)];
                
                if (joystick.handleEdge) {
                    const
                        segment  = Math.PI / joystick.directions,
                        accuracy = directions[joystick.directions * 2][Math.floor(((orientation + segment / 2) % (Math.PI * 2)) / segment)];

                    if (accuracy !== direction) {
                        owner.triggerEvent(accuracy.replace(direction, '').replace('-', ''), event);  //There's probably a better way to perform this, but the current method is functional. - DDD
                    }
                }

                owner.triggerEvent('stop');

                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due north.
                 *
                 * @event platypus.Entity#north
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due north-northeast.
                 *
                 * @event platypus.Entity#north-northeast
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due northeast.
                 *
                 * @event platypus.Entity#northeast
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due east-northeast.
                 *
                 * @event platypus.Entity#east-northeast
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due east.
                 *
                 * @event platypus.Entity#east
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due east-southeast.
                 *
                 * @event platypus.Entity#east-southeast
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due southeast.
                 *
                 * @event platypus.Entity#southeast
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due south-southeast.
                 *
                 * @event platypus.Entity#south-southeast
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due south.
                 *
                 * @event platypus.Entity#south
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due south-southwest.
                 *
                 * @event platypus.Entity#south-southwest
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due southwest.
                 *
                 * @event platypus.Entity#southwest
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due west-southwest.
                 *
                 * @event platypus.Entity#west-southwest
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due west.
                 *
                 * @event platypus.Entity#west
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due west-northwest.
                 *
                 * @event platypus.Entity#west-northwest
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due northwest.
                 *
                 * @event platypus.Entity#northwest
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                /**
                 * If the soft joystick is enabled on this component, it will broadcast this directional message if the joystick is dragged due north-northwest.
                 *
                 * @event platypus.Entity#north-northwest
                 * @param message {Event} The original pointer event object is passed along with the control message.
                 */
                owner.triggerEvent(direction, event);

                /**
                 * If the soft joystick is enabled on this component, this message will trigger to provide the current orientation of the joystick.
                 *
                 * @event platypus.Entity#joystick-orientation
                 * @param orientation (number) - A number in radians representing the orientation of the joystick.
                 */
                owner.triggerEvent("joystick-orientation", orientation);
            }
        },
        
        addController: (function () {
            const
                up = function (index) {
                    this.inputs[index] = false;
                },
                down = function (index) {
                    this.inputs[index] = true;
                };
            
            return function (key, stateId, controller, states, controllerState) {
                const
                    actions = this.actions,
                    id = `${stateId}-${controller}-${controllerState || 'all'}`;
                let actionState = actions.get(id); // If there's already a state storage object for this action, reuse it: there are multiple keys mapped to the same action.
                    
                // Otherwise create a new state storage object
                if (!actionState) {

                    /**
                     * Broadcasts active states using the JSON-defined message on each `handle-controller` message. Active states include `pressed` being true or `released` being true. If both of these states are false, the message is not broadcasted.
                     *
                     * @event platypus.Entity#[active-state]
                     * @param message.pressed {Boolean} Whether the current input is active.
                     * @param message.released {Boolean} Whether the current input was active last tick but is no longer active.
                     * @param message.triggered {Boolean} Whether the current input is active but was not active last tick.
                     * @param message.over {Boolean} Whether the mouse was over the entity when pressed, released, or triggered. This value is always false for non-mouse input messages.
                     */
                    if (controllerState) {
                        actionState = actions.set(id, ActionState.setUp(controller, states, filteredTrigger.bind(this, controllerState)));
                    } else {
                        actionState = actions.set(id, ActionState.setUp(controller, states, trigger.bind(this)));
                    }
                }
                
                // Set up listeners and input flag.
                this.addEventListener(key + ':up',   up.bind(actionState, actionState.inputs.length));
                this.addEventListener(key + ':down', down.bind(actionState, actionState.inputs.length));
                actionState.inputs.push(false);
            };
        }()),

        addMap: function (map, id, states) {
            const
                keys = Object.keys(map),
                {length} = keys;
    
            for (let i = 0; i < length; i++) {
                const
                    key = keys[i],
                    controller = map[key];

                if (typeof controller === 'string') {
                    this.addController(key, id, controller, states);
                } else if (Array.isArray(controller)) {
                    for (let j = 0; j < controller.length; j++) {
                        this.addController(key, id, controller[j], states);
                    }
                } else {
                    const
                        controllerKeys = Object.keys(controller),
                        {length} = controllerKeys;
            
                    for (let j = 0; j < length; j++) {
                        const
                            controllerKey = controllerKeys[j],
                            subcontroller = controller[controllerKey];

                        if (typeof subcontroller === 'string') {
                            this.addController(key, id, subcontroller, states, controllerKey);
                        } else {
                            for (let k = 0; k < subcontroller.length; k++) {
                                this.addController(key, id, subcontroller[k], states, controllerKey);
                            }
                        }
                    }
                }
            }
        },
        
        destroy: function () {
            const
                actions = this.actions,
                keys = actions.keys;
            let i = keys.length;
            
            while (i--) {
                actions.get(keys[i]).recycle();
            }
            actions.recycle();
            if (this.joystick) {
                this.joystick.recycle();
            }
        }
    }
});
