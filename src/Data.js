import recycle from 'recycle';

/**
 * This class defines a generic data object to use for messaging. It includes recycle methods to encourage reuse.
 *
 * @memberof platypus
 * @class Data
 * @param {String|Object} first Can be an object of key/value pairs or the parameters can be an alternating list of keys and values.
 * @return {Data} Returns the new Data object.
 */
const
    Data = function (first) {
        let i = arguments.length;
        
        if (first) {
            if (typeof first === 'string') {
                if (i % 2) {
                    this[i] = null;
                    i -= 1;
                }
                while (i) {
                    this[arguments[i - 2]] = arguments[i - 1];
                    i -= 2;
                }
            } else {
                const
                    keys = Object.keys(first);
                let j = keys.length;

                while (j--) {
                    this[keys[j]] = first[keys[j]];
                }
            }
        }
    };

/**
 * Returns Data from cache or creates a new one if none are available.
 *
 * @method platypus.Data.setUp
 * @return {platypus.Data} The instantiated Data.
 */
/**
 * Returns Data back to the cache. Prefer the Data's recycle method since it recycles property objects as well.
 *
 * @method platypus.Data.recycle
 * @param {platypus.Data} The Data to be recycled.
 */
/**
 * Relinquishes Data properties and recycles it.
 *
 * @method platypus.Data#recycle
 */
recycle.add(Data, 'Data', Data, function () {
    const
        keys = Object.keys(this);
    let i = keys.length;

    while (i--) {
        delete this[keys[i]];
    }
}, true);

export default Data;
