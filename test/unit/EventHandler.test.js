import {describe, expect, it, vi} from 'vitest';
import EventHandler from '../../src/EventHandler';

describe('EventHandler', () => {
    it('stores constructor values', () => {
        const
            callback = vi.fn(),
            context = {},
            handler = EventHandler.setUp(
                callback,
                context,
                true,
                10,
                5
            );

        expect(handler.callback).toBe(callback);
        expect(handler.context).toBe(context);
        expect(handler.once).toBe(true);
        expect(handler.priority).toBe(10);
        expect(handler.order).toBe(5);

        handler.recycle();
    });

    it('sorts lower priorities first', () => {
        const
            high = EventHandler.setUp(
                vi.fn(),
                null,
                false,
                0,
                0
            ),

            low = EventHandler.setUp(
                vi.fn(),
                null,
                false,
                100,
                1
            );

        expect(high.sortPriority(low)).toBeLessThan(0);
        expect(low.sortPriority(high)).toBeGreaterThan(0);

        high.recycle();
        low.recycle();
    });

    it('preserves insertion order for equal priorities', () => {
        const
            first = EventHandler.setUp(
                vi.fn(),
                null,
                false,
                10,
                0
            ),

            second = EventHandler.setUp(
                vi.fn(),
                null,
                false,
                10,
                1
            );

        expect(first.sortPriority(second)).toBeLessThan(0);
        expect(second.sortPriority(first)).toBeGreaterThan(0);

        first.recycle();
        second.recycle();
    });

    it('returns zero for identical priority and order', () => {
        const
            a = EventHandler.setUp(
                vi.fn(),
                null,
                false,
                10,
                0
            ),

            b = EventHandler.setUp(
                vi.fn(),
                null,
                false,
                10,
                0
            );

        expect(a.sortPriority(b)).toBe(0);

        a.recycle();
        b.recycle();
    });

    it('supports null context', () => {
        const handler = EventHandler.setUp(
            vi.fn(),
            null,
            false,
            0,
            0
        );

        expect(handler.context).toBeNull();

        handler.recycle();
    });

    it('supports once listeners', () => {
        const handler = EventHandler.setUp(
            vi.fn(),
            null,
            true,
            0,
            0
        );

        expect(handler.once).toBe(true);

        handler.recycle();
    });
});