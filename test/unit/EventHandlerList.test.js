import {describe, expect, it, vi} from 'vitest';
import EventHandlerList from '../../src/EventHandlerList';

describe('EventHandlerList', () => {
    it('triggers handlers in priority order', () => {
        const
            events = EventHandlerList.setUp(),
            calls = [];

        events.add(() => calls.push('low'), null, false, 100);
        events.add(() => calls.push('high'), null, false, 0);
        events.add(() => calls.push('mid'), null, false, 50);

        events.trigger([]);

        expect(calls).toEqual([
            'high',
            'mid',
            'low'
        ]);

        events.recycle();
    });

    it('preserves insertion order for equal priorities', () => {
        const
            events = EventHandlerList.setUp(),
            calls = [];

        events.add(() => calls.push(1), null, false, 0);
        events.add(() => calls.push(2), null, false, 0);
        events.add(() => calls.push(3), null, false, 0);

        events.trigger([]);

        expect(calls).toEqual([1, 2, 3]);

        events.recycle();
    });

    it('supports listener contexts', () => {
        const
            events = EventHandlerList.setUp(),
            context = {
                value: 42
            };

        const spy = vi.fn(function () {
            expect(this).toBe(context);
            expect(this.value).toBe(42);
        });

        events.add(spy, context, false, 0);

        events.trigger([]);

        expect(spy).toHaveBeenCalledTimes(1);

        events.recycle();
    });

    it('supports once listeners', () => {
        const
            events = EventHandlerList.setUp(),
            spy = vi.fn();

        events.add(spy, null, true, 0);

        events.trigger([]);
        events.trigger([]);

        expect(spy).toHaveBeenCalledTimes(1);

        events.recycle();
    });

    it('allows listeners to remove themselves safely during dispatch', () => {
        const
            events = EventHandlerList.setUp(),
            spy = vi.fn();

        const callback = () => {
            spy();
            events.remove(callback);
        };

        events.add(callback, null, false, 0);

        events.trigger([]);
        events.trigger([]);

        expect(spy).toHaveBeenCalledTimes(1);

        events.recycle();
    });

    it('returns the number of handlers triggered', () => {
        const events = EventHandlerList.setUp();

        events.add(() => {}, null, false, 0);
        events.add(() => {}, null, false, 0);

        expect(events.trigger([])).toBe(2);

        events.recycle();
    });

    it('removes only the matching callback/context pair', () => {
        const list = EventHandlerList.setUp();

        const fn = vi.fn();

        const ctxA = {name: 'A'};
        const ctxB = {name: 'B'};

        list.add(fn, ctxA, false, 0);
        list.add(fn, ctxB, false, 0);

        list.remove(fn, ctxA);

        expect(list.handlers.length).toBe(1);
        expect(list.handlers[0].context).toBe(ctxB);

        list.recycle();
    });

    it('does not remove unrelated handlers sharing the same callback', () => {
        const list = EventHandlerList.setUp();

        const fn = vi.fn();

        const ctx1 = {a: 1};
        const ctx2 = {a: 2};

        list.add(fn, ctx1, false, 1);
        list.add(fn, ctx2, false, 2);

        list.remove(fn, ctx1);

        expect(list.handlers.length).toBe(1);
        expect(list.handlers[0].priority).toBe(2);

        list.recycle();
    });

    it('removes once handlers after triggering', () => {
        const list = EventHandlerList.setUp();

        const spy = vi.fn();

        list.add(spy, null, true, 0);

        list.trigger([123]);
        list.trigger([456]);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(123);

        expect(list.handlers.length).toBe(0);

        list.recycle();
    });

    it('continues iteration safely when handlers remove themselves', () => {
        const list = EventHandlerList.setUp();

        const calls = [];

        const fn1 = () => calls.push('a');
        const fn2 = () => calls.push('b');
        const fn3 = () => calls.push('c');

        list.add(fn1, null, true, 0);
        list.add(fn2, null, false, 0);
        list.add(fn3, null, false, 0);

        list.trigger([]);

        expect(calls).toEqual(['a', 'b', 'c']);

        list.recycle();
    });

    it('sorts by priority then insertion order', () => {
        const list = EventHandlerList.setUp();

        const calls = [];

        list.add(() => calls.push('low'), null, false, 10);
        list.add(() => calls.push('high'), null, false, 0);
        list.add(() => calls.push('equal1'), null, false, 5);
        list.add(() => calls.push('equal2'), null, false, 5);

        list.trigger([]);

        expect(calls).toEqual([
            'high',
            'equal1',
            'equal2',
            'low'
        ]);

        list.recycle();
    });
});

describe('EventHandlerList recycling safety during dispatch', () => {
    it('does not recycle active handlers still being traversed', () => {
        const list = EventHandlerList.setUp();

        const calls = [];

        function sharedHandler() {
            calls.push('b');
        }

        // This handler removes and recycles the second handler
        // before the trigger loop reaches it.
        function remover() {
            list.remove(sharedHandler, ctxB);
        }

        const ctxA = {name: 'a'};
        const ctxB = {name: 'b'};

        list.add(remover, ctxA, false, 0);

        // Target handler that should still safely execute once
        // during the current dispatch cycle even if removed.
        list.add(
            sharedHandler,
            ctxB,
            false,
            1
        );

        // Additional handler to increase traversal pressure.
        list.add(
            function trailingHandler() {
                calls.push('c');
            },
            {},
            false,
            2
        );

        expect(list.handlers.length).toBe(3);

        list.trigger([]);

        // The removed handler should still execute safely
        // during the active traversal.
        expect(calls).toEqual([
            'b',
            'c'
        ]);

        // After dispatch completes, removed handler should
        // actually be gone.
        expect(list.handlers.length).toBe(2);

        // Trigger again to ensure recycled handler was not
        // corrupted/reused unexpectedly.
        calls.length = 0;

        list.trigger([]);

        expect(calls).toEqual([
            'c'
        ]);

        list.recycle();
    });
});