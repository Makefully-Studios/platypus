import createComponentClass from '../factory.js';

const
    collidePos = function (state, event, collInfo) {
        if (this.state.get(state)) {
            this.trigger(event, collInfo);
        }
    },
    collideNeg = function (state, event, collInfo) {
        if (!this.state.get(state)) {
            this.trigger(event, collInfo);
        }
    };

export default createComponentClass(/** @lends platypus.components.CollisionFilter.prototype */{
    id: 'CollisionFilter',
    
    properties: {
        /**
         * One or more collision events for which to listen. For example, if the state property is set to "allergic":
         *
                 {
                     "hitting-flowers": "sneeze",
                    // Listen for "hitting-flowers", and if the entity is "allergic", trigger a "sneeze" event.
                
                    "in-the-weeds": "cough"
                    // Another collision event that triggers "cough" if the entity is "allergic".
                }
            *
            * @property collisions
            * @type Object
            * @default {}
            */
        collisions: {},
        
        /**
         * The entity state that should cause the following list of collisions to trigger events. If this state is not true, no events are triggered. To trigger events on the inverse of a state, place "!" before the state such as "!allergic".
         *
         * @property state
         * @type String
         * @default ""
         */
        state: ""
    },
    
    /**
     * This component will listen for a particular collision message and, depending on a given entity.state attribute, retrigger the collision as another collision message.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     */
    initialize: function () {
        const
            collisions = this.collisions;
        
        if (collisions) {
            const
                {state, owner} = this,
                negative = state[0] === '!',
                resolveState = negative ? state.substring[1] : state,
                resolveCollision = negative ? collideNeg : collidePos,
                keys = Object.keys(collisions),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    key = keys[i];

                this.addEventListener(key, resolveCollision.bind(owner, resolveState, collisions[key]));
            }
        }
    }
});
