import {describe, expect, it} from 'vitest';
import DataMap from '../../src/DataMap.js';

describe('DataMap', () => {
    it('creates from an object', () => {
        const map = new DataMap({a: 1, b: 2});

        expect(map.get('a')).toBe(1);
        expect(map.get('b')).toBe(2);
        expect(map.has('a')).toBe(true);
    });

    it('creates from alternating key/value arguments', () => {
        const map = new DataMap('x', 10, 'y', 20);

        expect(map.get('x')).toBe(10);
        expect(map.get('y')).toBe(20);
    });

    it('tracks keys for iteration', () => {
        const map = new DataMap();

        map.set('first', 1);
        map.set('second', 2);

        expect(map.keys).toEqual(['first', 'second']);
    });

    it('does not duplicate keys when setting the same value', () => {
        const map = new DataMap({a: 1});

        map.set('a', 1);

        expect(map.keys).toEqual(['a']);
    });

    it('deletes keys and removes them from the key list', () => {
        const map = new DataMap({a: 1, b: 2});

        expect(map.delete('a')).toBe(1);
        expect(map.has('a')).toBe(false);
        expect(map.keys).toEqual(['b']);
    });

    it('clears all entries', () => {
        const map = new DataMap({a: 1, b: 2});

        map.clear();

        expect(map.keys).toHaveLength(0);
        expect(map.has('a')).toBe(false);
        expect(map.has('b')).toBe(false);
    });

    it('serializes to JSON using tracked keys', () => {
        const map = new DataMap({red: true, blue: false});

        expect(map.toJSON()).toEqual({red: true, blue: false});
    });

    it('recycles and can be reused from the pool', () => {
        const map = DataMap.setUp({temp: true});

        map.recycle();

        const reused = DataMap.setUp({next: 42});

        expect(reused.get('next')).toBe(42);
        expect(reused.has('temp')).toBe(false);

        reused.recycle();
    });
});
