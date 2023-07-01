/**
 * This component listens for specified local entity messages and re-broadcasts them at the scene level.
 *
 * @memberof platypus.components
 * @class RelayGame
 * @uses platypus.Component
 */
/* global platypus */
import createComponentClass from '../factory.js';

export default (function () {
    var broadcast = function () {
        platypus.game.triggerOnChildren.apply(platypus.game, arguments);
    };

    return createComponentClass(/** @lends platypus.components.RelayGame.prototype */{
        id: 'RelayGame',
        
        properties: {
            /**
             * This is an object of key/value pairs. The keys are events this component is listening for locally, and the value is the event to be broadcast to the scene. The value can also be an array of events to be fired on the scene.
             *
             *      "events": {
             *          "sleeping": "good-night",
             *          "awake": ["alarm", "get-up"]
             *      }
             *
             * @property events
             * @type Object
             * @default null
             */
            events: null
        },

        initialize: function () {
            const
                events = this.events;
            
            // Messages that this component listens for and then broadcasts to all layers.
            if (events) {
                const
                    keys = Object.keys(events),
                    {length} = keys;

                for (let i = 0; i < length; i++) {
                    const
                        key = keys[i];

                    this.addEventListener(key, broadcast.bind(this, events[key]));
                }
            }
        }
    });
}());
