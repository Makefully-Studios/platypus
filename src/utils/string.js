import {arrayCache} from './array.js';

/**
 * Splits a string, but populates an array from the array cache instead of creating a new one.
 *
 * @method greenSplit
 * @param text {String} String to split.
 * @param [splitter] {String} String demarking where to split. If not provided, each character in the split string becomes an array item.
 * @return Array
 */
export function greenSplit (text, splitter) {
    const
        arr = arrayCache.setUp();
    let str = text.toString();
    
    if (splitter) {
        const
            d = splitter.length;
        let i = str.indexOf(splitter);

        while (i >= 0) {
            arr.push(str.substr(0, i));
            str = str.substr(i + d);
            i = str.indexOf(splitter);
        }
        
        arr.push(str);
    } else {
        let i = str.length;
        const
            d = i - 1;

        while (i--) {
            arr.push(str[d - i]);
        }
    }
    
    return arr;
}