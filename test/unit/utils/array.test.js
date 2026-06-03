import {describe, expect, it} from 'vitest';
import {arrayCache, greenSlice, greenSplice, union} from '../../../src/utils/array.js';

describe('array utils', () => {
    describe('union', () => {
        it('merges unique items from multiple arrays', () => {
            const target = ['a'];

            union(target, ['b', 'a'], ['c', 'b']);

            expect(target).toEqual(['a', 'b', 'c']);
        });

        it('skips empty or missing source arrays', () => {
            const target = ['x'];

            union(target, null, [], ['y']);

            expect(target).toEqual(['x', 'y']);
        });
    });

    describe('greenSlice', () => {
        it('copies array contents into a pooled array', () => {
            const copy = greenSlice([1, 2, 3]);

            expect(copy).toEqual([1, 2, 3]);
            expect(copy).not.toBe([1, 2, 3]);

            arrayCache.recycle(copy);
        });
    });

    describe('greenSplice', () => {
        it('removes and returns the item at an index', () => {
            const arr = ['a', 'b', 'c'];

            expect(greenSplice(arr, 1)).toBe('b');
            expect(arr).toEqual(['a', 'c']);
        });

        it('returns null for out-of-range indices', () => {
            const arr = ['only'];

            expect(greenSplice(arr, -1)).toBe(null);
            expect(greenSplice(arr, 5)).toBe(null);
            expect(arr).toEqual(['only']);
        });

        it('handles empty arrays', () => {
            const arr = [];

            expect(greenSplice(arr, 0)).toBe(null);
            expect(arr).toEqual([]);
        });

        it('skips length adjustment when the source array is already empty', () => {
            const arr = [];

            expect(greenSplice(arr, -5)).toBe(null);
            expect(arr.length).toBe(0);
        });
    });
});
