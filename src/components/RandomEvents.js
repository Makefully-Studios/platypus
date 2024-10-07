/**
 * This component listens for certain messages, picks a message from a related list of events, and triggers it. This is useful for adding random behaviors to an entity, such as having an entity say one thing from a list of audio clips. For example, defining this component on an Entity may look like this:
 * 
 *     {
 *       "type": "RandomEvents",
 *       "trueRandom": "true",
 *       //If true, events will play completely randomly, otherwise all events in the set will fire before repeating.
 *       
 *       "events": {
 *       // This is a key/value list of events to listen for, with each event mapping to an array of events to pick from.
 *       
 *         "make-sound": ["scream", "whisper", "talk"]
 *         //on the component receiving the "make-sound" message, it will trigger one of the three possible messages listed here.
 *       }
 *     }
 *     
 * @memberof platypus.components
 * @class RandomEvents
 * @uses platypus.Component
*/
import RandomSet from '../RandomSet.js';
import createComponentClass from '../factory.js';

const
    createTrigger = function (eventSet) {
        return function (value, debug) {
            this.owner.trigger(eventSet.get(), value, debug);
        };
    },
    createTrueRandomTrigger = function (eventList) {
        return function (value, debug) {
            this.owner.trigger(eventList[Math.floor(Math.random() * eventList.length)], value, debug);
        };
    };

export default createComponentClass(/** @lends platypus.components.RandomEvents.prototype */{
    id: 'RandomEvents',

    properties: {
        events: null,

        /**
         * Whether to cycle through all options (default) or just trigger any option.
         * 
         * @property trueRandom
         * @type boolean
         * @default false
         */
        trueRandom: false
    },
    
    initialize: function () {
        const
            events = this.events;

        if (events) {
            const
                keys = Object.keys(events),
                {length} = keys;
    
            for (let i = 0; i < length; i++) {
                const
                    key = keys[i];

                if (this.trueRandom) {
                    this.addEventListener(key, createTrueRandomTrigger(events[key]));
                } else {
                    this.addEventListener(key, createTrigger(RandomSet.setUp(events[key])));
                }
            }
        }
    }
});
