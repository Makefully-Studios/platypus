/**
 * This component is typically added to an entity automatically by a render component. It handles mapping entity states and events to playable animations.
 *
 * @class RenderAnimator
 * @uses platypus.Component
 * @since 1.0.0
 */
import StateMap from '../StateMap.js';
import {arrayCache} from '../utils/array.js';
import createComponentClass from '../factory.js';

export default (function () {
    var createTest = function (testStates, animation) {
            if (testStates === 'default') {
                return defaultTest.bind(null, animation);
            } else {
                //TODO: Better clean-up: Create a lot of these without removing them later... DDD 2/5/2016
                return stateTest.bind(null, animation, StateMap.setUp(testStates));
            }
        },
        defaultTest = function (animation) {
            return animation;
        },
        methodPlay = function (animation, restart) {
            this.component.playAnimation(animation, restart);
        },
        methodStop = function (animation) {
            this.component.stopAnimation(animation);
        },
        stateTest = function (animation, states, ownerState) {
            if (ownerState.includes(states)) {
                return animation;
            }
            return false;
        },
        triggerPlay = function (animation, restart) {
            /**
             * On entering a new animation-mapped state, this component triggers this event to play an animation.
             *
             * @event 'play-animation'
             * @param animation {String} Describes the animation to play.
             * @param restart {Boolean} Whether to restart a playing animation.
             */
            this.owner.triggerEvent('play-animation', animation, restart);
        },
        triggerStop = function (animation) {
            /**
             * On attaining an animation-mapped state, this component triggers this event to stop a previous animation.
             *
             * @event 'stop-animation'
             * @param animation {String} Describes the animation to stop.
             */
            this.owner.triggerEvent('stop-animation', animation);
        };

    return createComponentClass({
        id: 'RenderAnimator',

        properties: {
            /**
             * An object containg key-value pairs that define a mapping from entity states to the animation that should play. The list is processed from top to bottom, so the most important actions should be listed first (for example, a jumping animation might take precedence over an idle animation). If not specified, an 1-to-1 animation map is created from the list of animations in the sprite sheet definition using the animation names as the keys.
             *
             *  "animationStates":{
             *      "standing": "default-animation"  // On receiving a "standing" event, or when this.owner.state.standing === true, the "default" animation will begin playing.
             *      "ground,moving": "walking",  // Comma separated values have a special meaning when evaluating "state-changed" messages. The above example will cause the "walking" animation to play ONLY if the entity's state includes both "moving" and "ground" equal to true.
             *      "ground,striking": "swing!", // Putting an exclamation after an animation name causes this animation to complete before going to the next animation. This is useful for animations that would look poorly if interrupted.
             *      "default": "default-animation" // Optional. "default" is a special property that matches all states. If none of the above states are valid for the entity, it will use the default animation listed here.
             *  }
             *
             * @property animationStates
             * @type Object
             * @default null
             */
            animationStates: null,

            /**
             * An object containg key-value pairs that define a mapping from triggered events to the animation that should play.
             *
             *     "animationEvents":{
             *         "move": "walk-animation",
             *         "jump": "jumping-animation"
             *     }
             *
             * The above will create two event listeners on the entity, "move" and "jump", that will play their corresponding animations when the events are triggered.
             *
             * @property animationEvents
             * @type Object
             * @default null
             */
            animationEvents: null,

            /**
             * Sets a component that this component should be connected to.
             *
             * @property component
             * @type Component
             * @default null
             * @since 0.9.2
             */
            component: null,

            /**
             * Optional. Forces animations to complete before starting a new animation. Defaults to `false`.
             *
             * @property forcePlayThrough
             * @type Boolean
             * @default false
             */
            forcePlayThrough: false,

            /**
             * Whether to restart a playing animation on event.
             *
             * @property restart
             * @type Boolean
             * @default true
             * @since 0.9.2
             */
            restart: true
        },

        initialize: (function () {
            const
                trigger = function (animation, restart) {
                    /**
                     * On receiving an animation-mapped event, this component triggers this event to play an animation.
                     *
                     * @event 'play-animation'
                     * @param animation {String} Describes the animation to play.
                     * @param restart {Boolean} Whether to restart a playing animation.
                     */
                    this.override = animation;
                    this.owner.triggerEvent('play-animation', animation, restart);
                },
                method = function (animation, restart) {
                    this.override = animation;
                    this.playAnimation(animation, restart);
                };

            return function () {
                const
                    events = this.animationEvents,
                    states = this.animationStates;

                //Handle Events:
                this.override = false;
                if (events) {
                    for (const animation in events) {
                        if (events.hasOwnProperty(animation)) {
                            if (this.component) {
                                this.addEventListener(animation, method.bind(this.component, events[animation], this.restart));
                            } else {
                                this.addEventListener(animation, trigger.bind(this, events[animation], this.restart));
                            }
                        }
                    }
                }

                //Handle States:
                this.followThroughs = {};
                this.checkStates = arrayCache.setUp();
                this.state = this.owner.state;
                this.stateChange = true; //Check state against entity's prior state to update animation if necessary on instantiation.
                this.lastState = -1;

                if (states) {
                    for (const anim in states) {
                        if (states.hasOwnProperty(anim)) {
                            const animation = states[anim];

                            //TODO: Should probably find a cleaner way to accomplish this. Maybe in the animationMap definition? - DDD
                            if (animation[animation.length - 1] === '!') {
                                animation = animation.substring(0, animation.length - 1);
                                this.followThroughs[animation] = true;
                            } else {
                                this.followThroughs[animation] = false;
                            }

                            this.checkStates.push(createTest(anim, animation));
                        }
                    }
                }

                this.waitingAnimation = false;
                this.waitingState = 0;
                this.playWaiting = false;
                this.animationFinished = false;

                if (this.component) {
                    this.playAnimation = methodPlay;
                    this.stopAnimation = methodStop;
                } else {
                    this.playAnimation = triggerPlay;
                    this.stopAnimation = triggerStop;
                }
            };
        } ()),

        events: {
            /**
             * This listens for the entity state to change and will update the currently playing animation.
             *
             * @method 'state-changed'
             */
            "state-changed": function () {
                this.stateChange = true;
            },

            /**
             * On receiving this event, the component checks for any waiting animations and begins playing them if so.
             *
             * @method 'animation-ended'
             * @param animation {String} The animation that completed.
             */
            "animation-ended": function (animation) {
                if (animation === this.currentAnimation) {
                    if (this.override && (animation === this.override)) {
                        this.stateChange = true;
                        this.override = false;
                    }

                    if (this.waitingAnimation) {
                        this.currentAnimation = this.waitingAnimation;
                        this.waitingAnimation = false;
                        this.lastState = this.waitingState;
                        
                        this.animationFinished = false;
                        this.playAnimation(this.currentAnimation);
                    } else {
                        this.animationFinished = true;
                    }
                }
            },

            /**
             * This checks to determine whether another animation should begin playing.
             *
             * @method update-animation
             * @param playing {Boolean} Whether the new animation should play or pause on the first frame.
             */
            "update-animation": function (playing) {
                var i = 0,
                    testCase = false;

                if (this.stateChange && !this.override) {
                    if (this.state.has('visible')) {
                        this.visible = this.state.get('visible');
                    }
                    for (i = 0; i < this.checkStates.length; i++) {
                        testCase = this.checkStates[i](this.state);
                        if (testCase) {
                            if (this.currentAnimation !== testCase) {
                                if (!this.followThroughs[this.currentAnimation] && (!this.forcePlaythrough || (this.animationFinished || (this.lastState >= +i)))) {
                                    this.currentAnimation = testCase;
                                    this.lastState = +i;
                                    this.animationFinished = false;
                                    if (playing) {
                                        this.playAnimation(this.currentAnimation);
                                    } else {
                                        this.stopAnimation(this.currentAnimation);
                                    }
                                } else {
                                    this.waitingAnimation = testCase;
                                    this.waitingState = +i;
                                }
                            } else if (this.waitingAnimation && !this.followThroughs[this.currentAnimation]) {// keep animating this animation since this animation has already overlapped the waiting animation.
                                this.waitingAnimation = false;
                            }
                            break;
                        }
                    }
                    this.stateChange = false;
                }
            }
        },
        
        methods: {
            toJSON: function () { // This component is added by another component, so it shouldn't be returned for reconstruction.
                return null;
            },

            destroy: function () {
                arrayCache.recycle(this.checkStates);
                this.checkStates = null;
                this.followThroughs = null;
                this.state = null;
            }
        }
    });
}());