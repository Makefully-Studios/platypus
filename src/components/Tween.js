/* global platypus */
import TweenJS from '@tweenjs/tween.js';
import createComponentClass from '../factory.js';

const
    Easing = TweenJS.Easing,
    Group = TweenJS.Group,
    Interpolation = TweenJS.Interpolation,
    Tween = TweenJS.Tween,
    eases = (function () {
        const
            easing = {},
            keys = Object.keys(Easing),
            {length} = keys;

        for (let i = 0; i < length; i++) {
            const
                key = keys[i],
                types = Object.keys(Easing[key]),
                {length: typesLength} = types;
    
            for (let j = 0; j < typesLength; j++) {
                const
                    type = types[j];

                easing[key + '.' + type] = Easing[key][type];
            }
        }

        return easing;
    }());

export default createComponentClass(/** @lends platypus.components.Tween.prototype */{
    id: 'Tween',

    properties: {
        /**
         * Required. A key/value list of events and an array or object representing the tween they should trigger.
         *
         *      {
         *          "begin-flying": { // When "begin-flying" is triggered on this entity, the following tween begins. Tween definitions adhere to a similar structure outlined by the [TweenJS documentation](https://github.com/tweenjs/tween.js/blob/master/docs/user_guide.md).
         *              "target": "entityId", // This defaults to the entity that this component is on, but can be the id of any entity in this layer.
         *              "to": { // Specifies the values to change and what they should tween to.
         *                  "scaleY": 1,
         *                  "y": [400, 450, 425]
         *              },
         *              "time": 1000, // Time in MS to make transition.
         *              "easing": "Quadratic.In", Easing function to use.
         *              "onUpdate": "flying", // Event to trigger while transition is running.
         *              "onStart": "wave", // Event to trigger when tween begins (after delay).
         *              "onStop": "whoa", // Event to trigger when tween is stopped (not completed normally).
         *              "onComplete": "done", // Event to trigger when tween is complete.
         *              "onRepeat": "going-again", // Event to trigger when tween is beginning again.
         *              "chain": "stop-flying", // Specifies a tween to use next.
         *              "repeat": 0, // Sets how many times to repeat this tween once it completes.
         *              "yoyo": false, // If this tween repeats, yoyo makes it transition back-and-forth.
         *              "delay": 500, // Time in MS to delay before starting transition.
         *              "repeatDelay": 0, // Time in MS that the transition should wait between repeats if it shouldn't be the `delay` value.
         *              "interpolation": "Linear" // Interpolation method to use for an array of values.
         *          },
         *
         *          "stop-flying": [{ // May also chain tweens by specifying an array.
         *              "to": {"y": 100},
         *              "time": 250
         *          }, {
         *              "to": {"y": 0},
         *              "time": 250
         *          }]
         *      }
         *
         * @property events
         * @type Object
         * @default null
         */
        events: null
    },
    
    /**
     * This component takes a list of tween definitions and plays them as needed. This component requires TweenJS.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#handle-logic
     * @listens platypus.Entity#pause-tween
     * @listens platypus.Entity#stop-tween
     * @listens platypus.Entity#tween
     * @listens platypus.Entity#unpause-tween
     */
    initialize: function () {
        const
            events = this.events;

        this.group = new Group();
        this.time = 0;
        this.paused = false;
        
        if (events) {
            Object.keys(events).forEach((event) => this.addEventListener(event, (augmentTweenData) => {
                const
                    data = events[event],
                    isArr = Array.isArray(data);

                if (typeof augmentTweenData === typeof data && Array.isArray(augmentTweenData) === isArr) {
                    if (isArr) {
                        this.runTween([...data, ...augmentTweenData]);
                    } else {
                        this.runTween({...data, ...augmentTweenData});
                    }
                } else {
                    this.runTween(data);
                }
            }));
        }
    },

    events: {
        /**
         * Trigger this event to play a tween using the same spec used for a tween on this component's `events` property.
         *
         * @event platypus.Entity#tween
         * @param {Object|Array} tween
         */
        'tween': function (tween) {
            this.runTween(tween);
        },

        'handle-logic': function (tick) {
            if (!this.paused) {
                this.time += tick.delta;
                this.group.update(this.time);
            }
        },

        /**
         * This event stops all running tweens on this component.
         *
         * @event platypus.Entity#stop-tween
         */
        'stop-tween': function () {
            this.group.removeAll();
        },

        /**
         * This event pauses all running tweens on this component.
         *
         * @event platypus.Entity#pause-tween
         */
        "pause-tween": function () {
            this.paused = true;
        },

        /**
         * This event unpauses all running tweens on this component.
         *
         * @event platypus.Entity#unpause-tween
         */
        "unpause-tween": function () {
            this.paused = false;
        }
    },

    methods: {
        createTween: function (tweenDefinition, chainable) {
            const
                owner = this.owner,
                entity = tweenDefinition.target ? (typeof tweenDefinition.target === 'string' ? owner.parent.getEntityById(tweenDefinition.target) : tweenDefinition.target) : owner;

            if (!entity) {
                platypus.debug.warn('Component Tween: Could not find entity as specified by `target` - ' + tweenDefinition.target);
                return null;
            } else if (!tweenDefinition.to || !tweenDefinition.time) {
                platypus.debug.warn('Component Tween: Both `time` and `to` must be specified to create tween.');
                return null;
            } else {
                const
                    tween = new Tween(entity, this.group);

                tween.to(tweenDefinition.to, tweenDefinition.time);

                if (tweenDefinition.onUpdate) {
                    tween.onUpdate((typeof tweenDefinition.onUpdate !== 'function') ? (...args) => owner.trigger(tweenDefinition.onUpdate, ...args) : tweenDefinition.onUpdate);
                }
                if (tweenDefinition.onStart) {
                    tween.onStart((typeof tweenDefinition.onStart !== 'function') ? (...args) => owner.trigger(tweenDefinition.onStart, ...args) : tweenDefinition.onStart);
                }
                if (tweenDefinition.onStop) {
                    tween.onStop((typeof tweenDefinition.onStop !== 'function') ? (...args) => owner.trigger(tweenDefinition.onStop, ...args) : tweenDefinition.onStop);
                }
                if (tweenDefinition.onComplete || tweenDefinition.yoyo) { // need fix for repeating an event that yoyo's
                    tween.onComplete(() => {
                        tween.stop();
                        if (tweenDefinition.yoyo) { // reset tween
                            tween.to(tweenDefinition.to);
                            tween.repeat(tweenDefinition.repeat);
                        }
                        if (tweenDefinition.onComplete) {
                            if (typeof tweenDefinition.onComplete !== 'function') {
                                owner.trigger(tweenDefinition.onComplete);
                            } else {
                                tweenDefinition.onComplete();
                            }
                        }
                    });
                }
                if (tweenDefinition.onRepeat) {
                    tween.onRepeat((typeof tweenDefinition.onRepeat !== 'function') ? (...args) => owner.trigger(tweenDefinition.onRepeat, ...args) : tweenDefinition.onRepeat);
                }

                if (tweenDefinition.chain) {
                    if (!chainable) {
                        platypus.debug.warn('Component Tween: ignoring `chain` on tween since it is part of an array of tweens.');
                    } else if (typeof tweenDefinition.chain === 'string') {
                        if (this.events[tweenDefinition.chain]) {
                            tween.chain(this.createTweens(this.events[tweenDefinition.chain]));
                        } else {
                            platypus.debug.warn(`Component Tween: ignoring chain on tween since there is no tween event trigger "${tweenDefinition.chain}".`);
                        }
                    } else {
                        tween.chain(tweenDefinition.chain);
                    }
                }

                if (tweenDefinition.repeat) {
                    tween.repeat(tweenDefinition.repeat);
                }
                if (tweenDefinition.yoyo) {
                    tween.yoyo(true);
                }
                if (tweenDefinition.delay) {
                    tween.delay(tweenDefinition.delay);
                }
                if (typeof tweenDefinition.repeatDelay !== 'undefined') {
                    tween.repeatDelay(tweenDefinition.repeatDelay);
                }
                
                if (tweenDefinition.interpolation) {
                    if (typeof tweenDefinition.interpolation === 'function') {
                        tween.interpolation(tweenDefinition.interpolation);
                    } else if (Interpolation[tweenDefinition.interpolation]) {
                        tween.interpolation(Interpolation[tweenDefinition.interpolation]);
                    } else {
                        platypus.debug.warn('Component Tween: "' + tweenDefinition.interpolation + '" is not a valid interpolation value; must be "Linear", "Bezier", or "CatmullRom".');
                    }
                }
           
                if (tweenDefinition.easing) {
                    if (typeof tweenDefinition.easing === 'function') {
                        tween.easing(tweenDefinition.easing);
                    } else if (eases[tweenDefinition.easing]) {
                        tween.easing(eases[tweenDefinition.easing]);
                    } else {
                        const
                            joinEnd = '", or "',
                            join = '", "';

                        platypus.debug.warn(`Component Tween: "${tweenDefinition.easing}" is not a valid easing value; must be ${Object.keys(eases).reduce((str, value, index) => `${index === 0 ? joinEnd : join}${value}${str}`, '".').substring(3)}`);
                    }
                }

                return tween;
            }
        },

        createTweens: function (tween) {
            if (Array.isArray(tween)) {
                let i = tween.length,
                    lastTween = null;

                while (i--) {
                    const newTween = this.createTween(tween[i], !lastTween);

                    if (lastTween) {
                        newTween.chain(lastTween);
                    }
                    lastTween = newTween;
                }

                return lastTween;
            } else {
                return this.createTween(tween, true);
            }
        },

        destroy: function () {
            this.group.removeAll();
        },

        runTween: function (tweenDefinition) {
            const
                tween = this.createTweens(tweenDefinition);

            if (tween) {
                tween.start(this.time);
            } else {
                platypus.debug.warn('Component Tween: Unable to run requested tween.', tweenDefinition);
            }
        }
    }
});
