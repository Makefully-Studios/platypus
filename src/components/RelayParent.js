/**
 * This component listens for specified local entity messages and re-broadcasts them on its parent entity.
 *
 * @memberof platypus.components
 * @class RelayParent
 * @uses platypus.Component
 */
import createComponentClass from '../factory.js';

export default (function () {
    

    var broadcast = function () {
        var parent = this.owner.parent;
        
        if (parent) {
            parent.trigger.apply(parent, arguments);
        }
    };
    
    return createComponentClass(/** @lends platypus.components.RelayParent.prototype */{
        id: 'RelayParent',
        
        properties: {
            /**
             * This is an object of key/value pairs. The keys are events this component is listening for locally, and the value is the event to be broadcast on the parent. The value can also be an array of events to be triggered on the parent.
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
            
            // Messages that this component listens for and then broadcasts to parent.
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
