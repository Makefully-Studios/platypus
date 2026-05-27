import {describe, expect, it, vi} from 'vitest';
import Messenger from '../../src/Messenger';

describe('Messenger', () => {
    it('registers and triggers listeners', () => {
        const
            messenger = new Messenger(),
            spy = vi.fn();

        messenger.on('test', spy);

        const count = messenger.trigger('test', 123);

        expect(count).toBe(1);
        expect(spy).toHaveBeenCalledWith(123);
    });

    it('passes messenger as default context', () => {
        const messenger = new Messenger();

        const spy = vi.fn(function () {
            expect(this).toBe(messenger);
        });

        messenger.on('test', spy);

        messenger.trigger('test');

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('supports custom contexts', () => {
        const
            messenger = new Messenger(),
            context = {value: 42};

        const spy = vi.fn(function () {
            expect(this).toBe(context);
            expect(this.value).toBe(42);
        });

        messenger.on('test', spy, context);

        messenger.trigger('test');

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('supports once listeners', () => {
        const
            messenger = new Messenger(),
            spy = vi.fn();

        messenger.on('test', spy, null, true);

        messenger.trigger('test');
        messenger.trigger('test');

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('supports prioritized listeners', () => {
        const
            messenger = new Messenger(),
            calls = [];

        messenger.on('test', () => calls.push('low'), null, false, 100);
        messenger.on('test', () => calls.push('high'), null, false, 0);
        messenger.on('test', () => calls.push('mid'), null, false, 50);

        messenger.trigger('test');

        expect(calls).toEqual([
            'high',
            'mid',
            'low'
        ]);
    });

    it('preserves insertion order for equal priorities', () => {
        const
            messenger = new Messenger(),
            calls = [];

        messenger.on('test', () => calls.push(1), null, false, 0);
        messenger.on('test', () => calls.push(2), null, false, 0);
        messenger.on('test', () => calls.push(3), null, false, 0);

        messenger.trigger('test');

        expect(calls).toEqual([1, 2, 3]);
    });

    it('removes listeners', () => {
        const
            messenger = new Messenger(),
            spy = vi.fn();

        messenger.on('test', spy);

        messenger.off('test', spy);

        messenger.trigger('test');

        expect(spy).not.toHaveBeenCalled();
    });

    it('removes all listeners for an event', () => {
        const
            messenger = new Messenger(),
            spy1 = vi.fn(),
            spy2 = vi.fn();

        messenger.on('test', spy1);
        messenger.on('test', spy2);

        messenger.off('test');

        messenger.trigger('test');

        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });

    it('removes all listeners', () => {
        const
            messenger = new Messenger(),
            spy1 = vi.fn(),
            spy2 = vi.fn();

        messenger.on('a', spy1);
        messenger.on('b', spy2);

        messenger.off();

        messenger.trigger('a');
        messenger.trigger('b');

        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });

    it('supports array event dispatch', () => {
        const
            messenger = new Messenger(),
            spy = vi.fn();

        messenger.on('a', spy);
        messenger.on('b', spy);

        const count = messenger.trigger(['a', 'b']);

        expect(count).toBe(2);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('supports object event dispatch', () => {
        const
            messenger = new Messenger(),
            spy = vi.fn();

        messenger.on('test', spy);

        messenger.trigger({
            event: 'test',
            message: 123
        });

        expect(spy).toHaveBeenCalledWith(123);
    });

    it('returns zero for unknown events', () => {
        const messenger = new Messenger();

        expect(
            messenger.trigger('missing')
        ).toBe(0);
    });

    it('supports self-removal during dispatch', () => {
        const messenger = new Messenger();

        const spy = vi.fn(() => {
            messenger.off('test', spy);
        });

        messenger.on('test', spy);

        messenger.trigger('test');
        messenger.trigger('test');

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('tracks destruction state', () => {
        const messenger = new Messenger();

        expect(messenger.destroyed).toBe(false);

        messenger.destroy();

        expect(messenger.destroyed).toBe(true);
    });

    it('keeps handlers isolated between events even with shared callbacks', () => {
        const messenger = new Messenger();

        const calls = [];

        const fn = () => calls.push('called');

        messenger.on('camera-loaded', fn, {type: 'camera'});
        messenger.on('handle-render', fn, {type: 'render'});

        messenger.trigger('handle-render');

        expect(calls).toEqual(['called']);

        messenger.off('handle-render', fn);

        calls.length = 0;

        messenger.trigger('camera-loaded');

        expect(calls).toEqual(['called']);
    });

    it('removing one event listener does not affect another event', () => {
        const messenger = new Messenger();

        const camera = vi.fn();
        const render = vi.fn();

        messenger.on('camera-loaded', camera);
        messenger.on('handle-render', render);

        messenger.off('camera-loaded', camera);

        messenger.trigger('handle-render');

        expect(render).toHaveBeenCalledTimes(1);
        expect(camera).not.toHaveBeenCalled();
    });

    it('supports the same callback across multiple events', () => {
        const messenger = new Messenger();

        const fn = vi.fn();

        messenger.on('a', fn);
        messenger.on('b', fn);

        messenger.off('a', fn);

        messenger.trigger('b');

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('supports the same callback across multiple events', () => {
        const messenger = new Messenger();

        const fn = vi.fn();

        messenger.on('a', fn);
        messenger.on('b', fn);

        messenger.off('a', fn);

        messenger.trigger('b');

        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('Messenger recycling stability', () => {
    it('does not retain handlers after repeated add/remove/trigger cycles', () => {
        const messenger = new Messenger();
        const calls = [];

        function makeHandler(index) {
            return function (value) {
                calls.push([index, value]);
            };
        }

        for (let cycle = 0; cycle < 1000; cycle++) {
            const handlers = [];

            for (let i = 0; i < 25; i++) {
                const fn = makeHandler(i);

                handlers.push(fn);

                messenger.on(
                    'test-event',
                    fn,
                    null,
                    i % 2 === 0,
                    i
                );
            }

            messenger.triggerEvent('test-event', cycle);

            for (let i = 0; i < handlers.length; i++) {
                messenger.off('test-event', handlers[i]);
            }

            const listenerList = messenger._listeners['test-event'];

            if (listenerList) {
                expect(listenerList.handlers.length).toBe(0);
            }
        }

        expect(messenger.getMessageIds().length === 0 ||
            messenger._listeners['test-event'].handlers.length === 0
        ).toBe(true);

        messenger.destroy();

        expect(messenger.destroyed).toBe(true);
        expect(messenger._listeners).toBe(null);
        expect(messenger.loopCheck).toBe(null);
    });
});