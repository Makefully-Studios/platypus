import {describe, expect, it} from 'vitest';
import Data from '../../src/Data.js';

describe('Data', () => {
    it('creates from an object', () => {
        const data = new Data({x: 1, y: 2});

        expect(data.x).toBe(1);
        expect(data.y).toBe(2);
    });

    it('creates from alternating key/value arguments', () => {
        const data = new Data('a', 1, 'b', 2);

        expect(data.a).toBe(1);
        expect(data.b).toBe(2);
    });

    it('supports setUp from the recycle pool', () => {
        const first = Data.setUp('x', 10, 'y', 20);

        first.recycle();

        const second = Data.setUp('x', 99, 'y', 88);

        expect(second.x).toBe(99);
        expect(second.y).toBe(88);

        second.recycle();
    });

    it('clears properties on recycle', () => {
        const data = Data.setUp('alpha', 1, 'beta', 2);

        data.recycle();

        expect(Object.keys(data)).toHaveLength(0);
    });
});
