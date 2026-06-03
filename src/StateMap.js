import DataMap from './DataMap.js';
import {arrayCache} from './utils/array.js';
import {greenSplit} from './utils/string.js';
import recycle from 'recycle';

/**
 * This class defines a state object to use for entity states with helper methods. It includes recycle methods to encourage reuse.
 *
 * @memberof platypus
 * @class StateMap
 * @extends platypus.DataMap
 * @return stateMap {platypus.StateMap} Returns the new StateMap object.
 */
const
    clean = function (arr) {
        const
            cleaned = arrayCache.setUp();

        if (typeof arr[0] === 'string') {
            for (let i = 0; i < arr.length; i++) {
                cleaned.push((i % 2) ? !!arr[i] : arr[i]);
            }
        } else if (typeof arr[0] === 'object') {
            const
                obj = arr[0];

            if (obj.keys && obj.get) {
                const
                    {keys} = obj;
                let i = keys.length;

                while (i--) {
                    cleaned.push(keys[i], !!obj.get(keys[i]));
                }
            } else {
                const
                    keys = Object.keys(obj);
                let i = keys.length;

                while (i--) {
                    cleaned.push(keys[i], !!obj[keys[i]]);
                }
            }
        }

        return cleaned;
    },
    StateMap = function (first) {
        const
            l = arguments.length;
        
        if (l) {
            if ((l === 1) && (typeof first === 'string')) {
                DataMap.call(this);
                this.updateFromString(first);
            } else {
                const
                    cleanedArgs = clean(arguments);

                DataMap.apply(this, cleanedArgs);
                arrayCache.recycle(cleanedArgs);
            }
        } else {
            DataMap.call(this);
        }
    },
    parent = DataMap.prototype,
    proto = StateMap.prototype = Object.create(parent);

Object.defineProperty(proto, 'constructor', {
    configurable: true,
    writable: true,
    value: StateMap
});
    
/**
 * Returns a JSON object of state keys and boolean values.
 *
 * @method platypus.StateMap#toJSON
 * @return {Object} State keys mapped to `true` or `false`.
 */

/**
 * Returns a comma-delimited list of state keys compatible with `updateFromString`. False values are prefixed with `"!"`.
 *
 * @method platypus.StateMap#toString
 * @return {String} The serialized state string.
 */
Object.defineProperty(proto, 'toString', {
    value: function () {
        const
            {keys} = this;
        let i = keys.length,
            parts = arrayCache.setUp();

        while (i--) {
            const
                key = keys[i];

            parts.push(this.get(key) ? key : `!${key}`);
        }

        const
            string = parts.join(',');

        arrayCache.recycle(parts);

        return string;
    }
});

/**
 * Sets the state using the provided string value which is a comma-delimited list such that `"blue,red,!green"` sets the following state values:
 *
 *      {
 *          red: true,
 *          blue: true,
 *          green: false
 *      }
 *
 * @method platypus.StateMap#updateFromString
 * @param states {String} A comma-delimited list of true/false state values.
 * @chainable
 */
Object.defineProperty(proto, 'updateFromString', {
    value: function (states) {
        const
            arr = greenSplit(states, ',');
        let i = arr.length;
        
        while (i--) {
            const
                str = arr[i];

            if (str) {
                if (str.substr(0, 1) === '!') {
                    this.set(str.substr(1), false);
                } else {
                    this.set(str, true);
                }
            }
        }
        
        arrayCache.recycle(arr);
        
        return this;
    }
});

/**
 * Checks whether the provided state matches this state and updates this state to match.
 *
 * @method platypus.StateMap#update
 * @param state {platypus.StateMap} The state that this state should match.
 * @return {Boolean} Whether this state already matches the provided state.
 */
Object.defineProperty(proto, 'update', {
    value: function (newState) {
        const
            {keys} = newState;
        let i = keys.length,
            changed = false;
        
        while (i--) {
            const
                state = keys[i],
                value = newState.get(state);

            if (this.get(state) !== value) {
                this.set(state, value);
                changed = true;
            }
        }
        
        return changed;
    }
});

/**
 * Checks whether the provided state matches all equivalent keys on this state.
 *
 * @method platypus.StateMap#includes
 * @param state {platypus.StateMap} The state that this state should match.
 * @return {Boolean} Whether this state matches the provided state.
 */
Object.defineProperty(proto, 'includes', {
    value: function (otherState) {
        const
            {keys} = otherState;
        let i = keys.length;
        
        while (i--) {
            const
                state = keys[i];

            if (this.get(state) !== otherState.get(state)) {
                return false;
            }
        }
        
        return true;
    }
});

/**
 * Checks whether the provided state matches any equivalent keys on this state.
 *
 * @method platypus.StateMap#intersects
 * @param state {platypus.StateMap} The state that this state should intersect.
 * @return {Boolean} Whether this state intersects the provided state.
 */
Object.defineProperty(proto, 'intersects', {
    value: function (otherState) {
        const
            {keys} = otherState;
        let i = keys.length;
        
        while (i--) {
            const
                state = keys[i];

            if (this.get(state) === otherState.get(state)) {
                return true;
            }
        }
        
        return false;
    }
});

/**
 * Returns StateMap from cache or creates a new one if none are available.
 *
 * @method platypus.StateMap.setUp
 * @return {platypus.StateMap} The instantiated StateMap.
 */
/**
 * Returns StateMap back to the cache. Prefer the StateMap's recycle method since it recycles property objects as well.
 *
 * @method platypus.StateMap.recycle
 * @param {platypus.StateMap} stateMap The StateMap to be recycled.
 */
/**
 * Relinquishes StateMap properties and recycles it.
 *
 * @method platypus.StateMap#recycle
 */
recycle.add(StateMap, 'StateMap', StateMap, function () {
    this.clear();
}, true);

export default StateMap;
