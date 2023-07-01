/* global platypus */
import createComponentClass from '../factory.js';
import {greenSplice} from '../utils/array.js';

const
    channels = {},
    broadcast = function (...args) {
        const channel = this.channel;

        for (let i = 0; i < channel.length; i++) {
            channel[i].trigger(...args);
        }
    };

export default createComponentClass(/** @lends platypus.components.RelayLinker.prototype */{
    id: 'RelayLinker',

    properties: {
        /**
         * The id that defines the 'channel' the linkers are talking on. This should be matched on the entity/entities you want to talk between.
         *
         * @property linkId
         * @type String
         * @default 'linked'
         */
        linkId: 'linked',
        
        /**
         * This is an object of key/value pairs. The keys are events this component is listening for locally, the value is the event to be broadcast to its linked entities. The value can also be an array of events to be fired on linked entities.
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

    /**
     * Allows an entity to communicate directly with one or more entities via the message model by passing local events directly to the linked entities as new triggered events.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#load
     */
    initialize: function () {
        const
            {events, linkId} = this;

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
        
        if (!this.owner.linkId) {
            this.owner.linkId = linkId;
        }
        
        // Connect channel, or create if it doesn't exist.
        this.channel = channels[linkId] = channels[linkId] ?? [];
    },
    
    events: {
        "load": function () {
            this.channel.push(this.owner);
        }
    },
    
    methods: {
        destroy: function () {
            const index = this.channel.indexOf(this.owner);

            if (index >= 0) {
                greenSplice(this.channel, index);
            } else {
                platypus.debug.warn('RelayLinker: Component destroyed, but entity not found on channel.');
            }
            this.events = null;
        }
    }
});
