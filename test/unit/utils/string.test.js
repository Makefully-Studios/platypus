import {describe, expect, it} from 'vitest';
import {arrayCache} from '../../../src/utils/array.js';
import {greenSplit} from '../../../src/utils/string.js';

describe('string utils', () => {
    describe('greenSplit', () => {
        it('splits on a delimiter', () => {
            const parts = greenSplit('a,b,c', ',');

            expect(parts).toEqual(['a', 'b', 'c']);

            arrayCache.recycle(parts);
        });

        it('splits into characters when no delimiter is provided', () => {
            const parts = greenSplit('ab');

            expect(parts).toEqual(['a', 'b']);

            arrayCache.recycle(parts);
        });

        it('coerces non-string input via toString', () => {
            const parts = greenSplit(123, '');

            expect(parts).toEqual(['1', '2', '3']);

            arrayCache.recycle(parts);
        });
    });
});
