import {beforeEach, describe, expect, it, vi} from 'vitest';
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

    it('returns a string description', () => {
        expect(new Messenger().toString()).toBe('[Messenger Object]');
    });

    it('dispatches via triggerEvent directly', () => {
        const messenger = new Messenger();
        const spy = vi.fn();

        messenger.on('direct', spy);
        expect(messenger.triggerEvent('direct', 9)).toBe(1);
        expect(spy).toHaveBeenCalledWith(9);
        expect(messenger.triggerEvent('missing')).toBe(0);
    });

    it('dispatches object events with explicit debug flag', () => {
        const messenger = new Messenger({debug: true});
        const spy = vi.fn();

        messenger.type = 'entity';
        messenger.on('debug-event', spy);

        messenger.trigger({
            event: 'debug-event',
            message: 7,
            debug: true
        });

        expect(spy).toHaveBeenCalledWith(7, true);
    });

    it('dispatches object events without an explicit debug flag', () => {
        const messenger = new Messenger();
        const spy = vi.fn();

        messenger.on('plain-object', spy);
        messenger.trigger({event: 'plain-object', message: 4});

        expect(spy).toHaveBeenCalledWith(4);
    });

    it('uses the trigger message when the object omits message', () => {
        const messenger = new Messenger();
        const spy = vi.fn();

        messenger.on('fallback', spy);
        messenger.trigger({event: 'fallback'}, 9);

        expect(spy).toHaveBeenCalledWith(9);
    });

    it('honors an explicit debug false on object events', () => {
        const messenger = new Messenger();
        const spy = vi.fn();

        messenger.on('quiet', spy);
        messenger.trigger({event: 'quiet', message: 2, debug: false});

        expect(spy).toHaveBeenCalledWith(2, false);
    });

    it('passes object debug with a fallback trigger payload', () => {
        const messenger = new Messenger({debug: true});
        const spy = vi.fn();

        messenger.type = 'entity';
        messenger.on('payload', spy);
        messenger.trigger({event: 'payload', debug: true}, 11);

        expect(spy).toHaveBeenCalledWith(11, true);
    });


    it('ignores off calls after destruction', () => {
        const messenger = new Messenger();
        const spy = vi.fn();

        messenger.on('late', spy);
        messenger.destroy();
        messenger.off('late', spy);

        expect(spy).not.toHaveBeenCalled();
    });

    it('warns on malformed event descriptors', () => {
        globalThis.platypus = {debug: {warn: vi.fn()}};

        const messenger = new Messenger();

        expect(messenger.trigger({noEvent: true})).toBe(0);
        expect(globalThis.platypus.debug.warn).toHaveBeenCalled();
    });

    it('does not register listeners after destruction', () => {
        const messenger = new Messenger();

        messenger.destroy();

        expect(messenger.on('late', vi.fn())).toBe(null);
        expect(messenger.trigger('late')).toBe(0);
    });

    it('removes a single listener with matching context', () => {
        const messenger = new Messenger();
        const ctx = {id: 1};
        const spy = vi.fn();

        messenger.on('ctx', spy, ctx);
        messenger.off('ctx', spy, ctx);
        messenger.trigger('ctx');

        expect(spy).not.toHaveBeenCalled();
    });

    it('recycles empty listener lists when removing the last handler', () => {
        const messenger = new Messenger();
        const spy = vi.fn();

        messenger.on('solo', spy);
        messenger.off('solo', spy);

        expect(messenger.getMessageIds()).toEqual([]);
    });
});

describe('Messenger debug mode', () => {
    beforeEach(() => {
        globalThis.platypus = {
            debug: {
                warn: vi.fn(),
                log: vi.fn()
            }
        };
    });

    it('warns on nested identical events', () => {
        const messenger = new Messenger({debug: true});
        let nested = false;

        messenger.type = 'entity';
        messenger.on('loop', () => {
            if (!nested) {
                nested = true;
                messenger.triggerEvent('loop', {debug: true});
            }
        });

        messenger.triggerEvent('loop', {debug: true});

        expect(globalThis.platypus.debug.warn).toHaveBeenCalled();
    });

    it('logs when debug mode is enabled on the messenger', () => {
        const messenger = new Messenger({debug: true});

        messenger.type = 'entity';
        messenger.debug = true;
        messenger.triggerEvent('solo', {debug: true});

        expect(globalThis.platypus.debug.warn).toHaveBeenCalledWith(
            expect.stringContaining('no subscribers'),
            {debug: true}
        );
    });

    it('logs singular subscriber counts for one handler', () => {
        const messenger = new Messenger({debug: true});

        messenger.type = 'entity';
        messenger.on('solo', vi.fn());
        messenger.triggerEvent('solo', {debug: true});

        expect(globalThis.platypus.debug.log).toHaveBeenCalledWith(
            expect.stringMatching(/1 subscriber\./),
            {debug: true}
        );
    });

    it('logs plural subscriber counts when multiple handlers exist', () => {
        const messenger = new Messenger({debug: true});
        const spy = vi.fn();

        messenger.type = 'entity';
        messenger.on('duo', spy);
        messenger.on('duo', vi.fn());
        messenger.triggerEvent('duo', {debug: true});

        expect(globalThis.platypus.debug.log).toHaveBeenCalledWith(
            expect.stringContaining('subscribers'),
            {debug: true}
        );
        expect(spy).toHaveBeenCalled();
    });

    it('uses the non-debug trigger path inside a debug messenger', () => {
        const messenger = new Messenger({debug: true});
        const spy = vi.fn();

        messenger.on('plain', spy);
        messenger.triggerEvent('plain', 3);

        expect(spy).toHaveBeenCalledWith(3);
    });

    it('skips loop warnings when nested events differ', () => {
        const messenger = new Messenger({debug: true});

        messenger.type = 'entity';
        messenger.on('outer', () => {
            messenger.triggerEvent('inner', {debug: true});
        });
        messenger.on('inner', vi.fn());
        messenger.triggerEvent('outer', {debug: true});

        expect(globalThis.platypus.debug.warn).not.toHaveBeenCalledWith(
            expect.stringContaining('nested inside another'),
            expect.anything()
        );
    });

    it('dispatches debug events when performance APIs are unavailable', () => {
        const original = globalThis.performance;

        globalThis.performance = {measure: vi.fn()};

        const messenger = new Messenger({debug: true});
        const spy = vi.fn();

        messenger.type = 'entity';
        messenger.on('perf', spy);
        messenger.triggerEvent('perf', {debug: true});

        expect(spy).toHaveBeenCalledWith({debug: true});

        globalThis.performance = original;
    });

    it('enters debug instrumentation when messenger.debug is set', () => {
        const messenger = new Messenger({debug: true});

        messenger.type = 'entity';
        messenger.debug = true;
        messenger.on('inst', vi.fn());
        messenger.triggerEvent('inst', {});

        expect(messenger.loopCheck.length).toBe(0);
    });

    it('throws when the same event nests too many times', () => {
        const messenger = new Messenger({debug: true});

        messenger.type = 'entity';
        messenger.on('loop', () => {
            messenger.triggerEvent('loop', {debug: true});
        });

        expect(() => messenger.triggerEvent('loop', {debug: true})).toThrow(/Endless loop/);
    });
});

describe('Messenger.mixin', () => {
    it('mixes messenger methods onto another class', () => {
        const calls = [];

        class Thing {
            local () {
                return 'local';
            }

            toString () {
                calls.push('thing');
                return 'Thing';
            }
        }

        Messenger.mixin(Thing);

        const thing = new Thing();

        Messenger.initialize(thing);

        expect(typeof thing.on).toBe('function');
        expect(typeof thing.trigger).toBe('function');

        thing.toString();

        expect(calls).toContain('thing');

        const spy = vi.fn();

        thing.on('mixed', spy);
        thing.trigger('mixed', 1);

        expect(spy).toHaveBeenCalledWith(1);
        expect(thing.local()).toBe('local');
    });

    it('initializes messenger state on plain objects', () => {
        const obj = {};

        Messenger.initialize(obj);

        expect(obj._listeners).toEqual({});
        expect(obj._destroyed).toBe(false);
        expect(obj.loopCheck).toBeDefined();
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