import Data from '../Data.js';
import createComponentClass from '../factory.js';

/* global platypus */
export default (function () {
    return createComponentClass(/** @lends platypus.components.Counter.prototype */{

        id: 'Counter',

        properties: {
            /**
             * Sets whether count is stored permanently. Can be set to a storage key or if `true` will use entity's type.
             * 
             * @property persistentStorage
             * @type Boolean|String
             * @default false
             */
            persistentStorage: false
        },

        publicProperties: {
            /**
             * Specifies the current count.
             *
             * @property count
             * @type number
             * @default 0
             */
            count: 0,

            /**
             * If total is supplied, progress reports part complete, 0-1.
             *
             * @property progress
             * @type number
             * @default 0
             */
            progress: 0,

            /**
             * A total the counter is incrementing toward.
             *
             * @property total
             * @type number
             * @default 0
             */
            total: 0
        },

        /**
         * A simple component that keeps count of something and sends messages each time the count changes. Can also have a total. When it does it will display 'count / total'.
         *
         * @memberof platypus.components
         * @uses platypus.Component
         * @constructs
         * @listens platypus.Entity#change-total
         * @listens platypus.Entity#change-count
         * @listens platypus.Entity#handle-logic
         * @listens platypus.Entity#increment-count
         * @fires platypus.Entity#update-content
         */
        initialize: function () {
            this.lastTotal = -1;
            this.lastCount = -1;
            this.message = Data.setUp(
                "text", ""
            );
            if (this.persistentStorage) {
                const
                    storage = this.storage = platypus.game.storage;

                if (this.persistentStorage === true) {
                    this.persistentStorage = this.owner.type;
                }

                this.count = storage.get(this.persistentStorage) || 0;
            }
        },

        events: {
            "handle-logic": function () {
                var update  = false,
                    msg = this.message;
                
                if (this.total !== this.lastTotal) {
                    this.lastTotal = this.total;
                    update = true;
                }
                
                if (this.count !== this.lastCount) {
                    this.lastCount = this.count;
                    if (this.persistentStorage) {
                        this.storage.set(this.persistentStorage, this.count);
                    }
                    update = true;
                }
                
                if (update) {
                    if (this.total) {
                        msg.text = String(this.count) + "/" + String(this.total);
                    } else {
                        msg.text = String(this.count);
                    }
                    
                    /**
                     * A call used to notify other components that the count or total has changed.
                     *
                     * @event platypus.Entity#update-content
                     * @param update.text {string} String describing the current count.
                     */
                    this.owner.triggerEvent('update-content', msg);

                    if (this.total) {
                        this.progress = this.count / this.total;
                    }
                }
            },

            /**
             * Changes the total to the given value.
             *
             * @event platypus.Entity#change-total
             * @param data.total {number} The new total value.
             */
            "change-total": function (total) {
                this.total = total;
            },

            /**
             * Changes the count to the given value.
             *
             * @event platypus.Entity#change-count
             * @param data.count {number} The new count value.
             */
            "change-count": function (count) {
                this.count = count;
            },

            /**
             * Increments the count by 1.
             *
             * @event platypus.Entity#increment-count
             */
            "increment-count": function () {
                this.count += 1;
            },

            /**
             * Decrements the count by 1.
             *
             * @event platypus.Entity#decrement-count
             */
            "decrement-count": function () {
                this.count -= 1;
            }
        },
        
        methods: {
            destroy: function () {
                this.message.recycle();
            }
        }
    });
}());
