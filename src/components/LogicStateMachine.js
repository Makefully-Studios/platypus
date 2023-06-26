/**
### Local Broadcasts:
- **[output messages]** - This component triggers output messages as determined by the JSON settings.

## JSON Definition
    {
      "type": "LogicStateMachine",
      
      "inputs":{
      // This is a list of messages that this component should listen for to change states.
      
        "smell-toast":{
        // If the entity triggers "smell-toast", this component will change the state of the entity as follows:
        
          "smelling-food": true,
          "smelling-nothing": false
        },
        
        "go-to-store":{
          "at-store": true
        }
      },
      
      "sustained-inputs":{
      // These are messages that must be triggered every tick for the state to remain true: if not, they become false.
        "near-grover": "smelling-trash"
      }
    }
*/
import {arrayCache, greenSplice} from '../utils/array.js';
import DataMap from '../DataMap.js';
import StateMap from '../StateMap.js';
import createComponentClass from '../factory.js';

const
    setUpOutputs = function (outs) {
        if (!outs || (typeof outs !== 'object') || Array.isArray(outs) || outs.event) {
            return outs;
        } else {
            const
                data = DataMap.setUp(),
                keys = Object.keys(outs),
                {length} = keys;
    
            for (let i = 0; i < length; i++) {
                const
                    key = keys[i];

                data.set(key, setUpOutputs(outs[key]));
            }
            return data;
        }
    },
    recycleOutputs = function (outs) {
        if (outs instanceof DataMap) {
            const
                keys = outs.keys;
            let i = keys.length;

            while (i--) {
                recycleOutputs(outs[keys[i]]);
            }
            outs.recycle();
        }
    },
    handleResult = function (title, state, last, checks, changed, self, queue) {
        const
            keys = checks.keys,
            message = checks.message ?? (checks.message === 0) ?? (checks.message === false);

        if (changed) {
            if (typeof checks === 'string') {
                self.triggerEvent(checks);
                return;
            } else if (Array.isArray(checks)) {
                for (let i = 0; i < checks.length; i++) {
                    handleResult(title, state, last, checks[i], changed, self, queue);
                }
                return;
            } else if (checks.event && (message || checks.delay)) {
                if (checks.delay) {
                    queue.push(checks);
                } else {
                    self.trigger(checks.event, checks.message);
                }
                return;
            } else if (checks.get) {
                const
                    value = checks.get('true');

                if (value) {
                    handleResult(title, state, last, value, changed, self, queue);
                }
            }
        }

        keys = checks.keys;
        if (keys) {
            let i = keys.length;

            while (i--) {
                const
                    key = keys[i];

                if (key !== 'true') {
                    handleOutput(key, state, last, checks.get(key), changed, self, queue);
                }
            }
        }
    },
    handleOutput = function (title, state, last, checks, changed, self, queue) {
        let c = changed,
            value = false;

        if (title.charAt(0) === '!') {
            const
                st = title.substring(1),
                stateValue = state.get(st);

            value = (stateValue === false);
            if ((title !== 'outputs') && (last.get(st) !== stateValue)) {
                c = true;
            }
        } else {
            const
                stateValue = state.get(title);

            value = (stateValue === true);
            if ((title !== 'outputs') && (last.get(title) !== stateValue)) {
                c = true;
            }
        }

        if (value || (title === 'outputs')) {
            handleResult(title, state, last, checks, c, self, queue);
        }
    };

export default createComponentClass(/** @lends platypus.components.LogicStateMachine.prototype */{
    id: 'LogicStateMachine',
    
    properties: {
        /**
         * This is the list of events containing key/value pairs that describe state changes to make for the given event.
         *
         *     {
         *         "smell-toast": {
         *             "smelling-food": true,
         *             "smelling-nothing": false
         *         },
         *         "go-to-store": {
         *             "at-store": true
         *         }
         *     }
         *
         * @property inputs
         * @type Object
         * @default null
         */
        inputs: null,
        
        /**
         * These are messages that should be triggered when certain conditions are met. The messages are only triggered the instant the condition is met, until the conditions are no longer met and then once again met. Example:
         *
         *     {
         *         "smelling-food": { // Keys map to states, and if true, the value of the key is processed. In this case, the value of the "smelling-food" key is another object of key/value pairs, giving us another layer of checks.
         *             "!smelling-trash": "time-to-eat", // This key is an inverse check, meaning that the "smelling-trash" state of the entity must be false to continue along this path. This time the value is a string, so the string "time-to-eat" is treated as a message to be broadcast if the entity is both "smelling-food" and not "smelling-trash".
         *             "true": "belly-rumble" // In some cases, a message should be triggered for a set of states, while still doing deeper state checks like above. "true" will always handle the next layer of values if the parent key was true.
         *         },
         *         "smelling-trash": "feeling-sick" // Multiple states can be handled to multiple depths, like a list of if () statements
         *         "!smelling-nothing": {
         *             "!smelling-trash":{
         *                 "!at-store": "go-to-store", // Note that the "go-to-store" message will change this entity's state to "at-store" according to "inputs" above, but LogicStateMachine uses a cache of states when broadcasting output messages, so the next section will not be processed until the next state check.
         *                 "at-store":{
         *                     "have-money": "buy-more-food",
         *                     "!have-money": "buy-less-food"
         *                 }
         *             }
         *         }
         *     }
         *
         * @property outputs
         * @type Object
         * @default null
         */
        outputs: null
    },
    
    /**
     * This component is a general purpose state-machine for an entity, taking in various message inputs to determine the entity's state and triggering messages as necessary when a certain state occurs or several state combinations are in place.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @param {*} definition 
     * @listens platypus.Entity#handle-logic
     * @listens platypus.Entity#state-changed
     */
    initialize: function (definition) {
        const
            inputDefinition = this.inputs,
            susDef = definition["sustained-inputs"],
            thisState = this.owner.state;
        
        this.state = thisState;
        
        if (inputDefinition) {
            const
                stateObjects = arrayCache.setUp(),
                keys = Object.keys(inputDefinition),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    key = keys[i],
                    state = StateMap.setUp(inputDefinition[key]),
                    stateKeys = state.keys;
                let j = stateKeys.length;
                
                stateObjects.push(state);
                this.addEventListener(key, () => {
                    thisState.update(state);
                });

                while (j--) {
                    if (!thisState.has(stateKeys[j])) { // set initial value to false if it's currently undefined.
                        thisState.set(stateKeys[j], false);
                    }
                }
            }
            this.stateObjects = stateObjects;
        }

        this.sustainedState = StateMap.setUp();
        if (susDef) {
            const
                keys = Object.keys(susDef),
                {length} = keys,
                {sustainedState} = this;
    
            for (let i = 0; i < length; i++) {
                const
                    key = keys[i],
                    definition = susDef[key];

                this.addEventListener(key, () => {
                    sustainedState.set(definition, true);
                });
                sustainedState.set(susDef[key], false);
                thisState.set(susDef[key], false);
            }
        }

        this.snapshot = StateMap.setUp();
        this.last = StateMap.setUp();
        this.queueTimes = arrayCache.setUp();
        this.queue = arrayCache.setUp();
        this.outputs = setUpOutputs(this.outputs);
    },

    events: {
        "handle-logic": function (resp) {
            const
                {state, sustainedState} = this,
                keys = sustainedState.keys;
            let i = keys.length;
            
            while (i--) {
                const
                    key = keys[i];

                state.set(key, sustainedState.get(key));
                sustainedState.set(key, false);
            }
            
            i = this.queue.length;
            while (i--) {
                this.queueTimes[i] -= resp.delta;
                
                if (this.queueTimes[i] <= 0) {
                    this.owner.trigger(this.queue[i].event, this.queue[i].message);
                    greenSplice(this.queueTimes, i);
                    greenSplice(this.queue, i);
                }
            }
        },
        
        "update-state": function (state) {
            this.state.update(state);
        },
        
        "state-changed": function (state) {
            const
                ss = this.snapshot;
            
            if (this.outputs) {
                const
                    queue = arrayCache.setUp();

                ss.update(state);
                handleOutput('outputs', ss, this.last, this.outputs, false, this.owner, queue);
                
                let i = queue.length;
                
                while (i--) {
                    this.queue.push(queue[i]);
                    this.queueTimes.push(queue[i].delay);
                }
                arrayCache.recycle(queue);
                
                this.last.update(ss);
            }
        }
    },
    
    methods: {
        destroy: function () {
            const
                so = this.stateObjects;
            
            arrayCache.recycle(this.queueTimes);
            arrayCache.recycle(this.queue);
            
            if (so) {
                let i = so.length;

                while (i--) {
                    so[i].recycle();
                }
                arrayCache.recycle(so);
                this.stateObjects = null;
            }

            this.sustainedState.recycle();
            this.snapshot.recycle();
            this.last.recycle();
            
            this.state = null;
            this.inputs = null;
        }
    }
});
