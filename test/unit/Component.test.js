import {beforeEach, describe, expect, it, vi} from 'vitest';
import Component from '../../src/Component.js';
import Messenger from '../../src/Messenger.js';

const createOwner = () => {
    const owner = new Messenger();

    owner.type = 'test-entity';
    owner.state = {
        get: vi.fn(() => false)
    };
    owner.parent = {
        triggerEvent: vi.fn()
    };

    return owner;
};

beforeEach(() => {
    globalThis.platypus = {
        debug: {
            warn: vi.fn(),
            log: vi.fn()
        }
    };
});

describe('Component', () => {
    it('calls the optional initialize hook', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');
        const hook = vi.spyOn(component, 'initialize');

        component.initialize();

        expect(hook).toHaveBeenCalled();
    });

    it('initializes type, owner, id, and listener data', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');

        expect(component.type).toBe('TestComponent');
        expect(component.owner).toBe(owner);
        expect(component.id).toBe('comp-1');
        expect(component.listener.events).toEqual([]);
        expect(component.toString()).toBe('[Component TestComponent]');
    });

    it('adds and removes event listeners on the owner', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');
        const handler = vi.fn();
        const onSpy = vi.spyOn(owner, 'on');

        component.addEventListener('tick', handler, 5);
        owner.triggerEvent('tick', 1);

        expect(handler).toHaveBeenCalledWith(1);
        expect(onSpy).toHaveBeenCalledWith('tick', expect.any(Function), 5);

        component.removeEventListener('tick', component.listener.messages[0]);
        owner.triggerEvent('tick', 2);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('removes listeners by event name list', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');
        const handler = vi.fn();

        component.addEventListener('tick', handler);
        component.removeEventListeners(['tick']);
        owner.triggerEvent('tick');

        expect(handler).not.toHaveBeenCalled();
    });

    it('adds event listeners in bulk and tears them down', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');
        const tick = vi.fn();
        const load = vi.fn();

        const teardown = component.addEventListeners({
            tick,
            load
        });

        owner.triggerEvent('tick');
        owner.triggerEvent('load');

        expect(tick).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledTimes(1);

        teardown();

        owner.triggerEvent('tick');
        owner.triggerEvent('load');

        expect(tick).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledTimes(1);
    });

    it('notifies parent when adding listeners to a loaded entity', () => {
        const owner = createOwner();

        owner.state.get = vi.fn(() => true);

        const component = new Component('TestComponent', owner, 'comp-1');

        component.addEventListeners({tick: vi.fn()});

        expect(owner.parent.triggerEvent).toHaveBeenCalledWith('child-entity-updated', owner);
    });

    it('adds and removes public methods on the owner', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');
        const method = vi.fn(function () {
            return this.id;
        });

        component.addMethod('doThing', method);

        expect(owner.doThing()).toBe('comp-1');

        component.removeMethod('doThing');

        expect(owner.doThing).toBeUndefined();
    });

    it('warns when adding a method that already exists', () => {
        const owner = createOwner();

        owner.existing = () => {};

        const component = new Component('TestComponent', owner, 'comp-1');

        component.addMethod('existing', vi.fn());

        expect(globalThis.platypus.debug.warn).toHaveBeenCalled();
        expect(owner.existing).not.toBeUndefined();
    });

    it('warns when removing a missing method', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');

        component.removeMethod('missing');

        expect(globalThis.platypus.debug.warn).toHaveBeenCalled();
    });

    it('ignores destroy when listener data is already cleared', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');

        component.listener = null;

        expect(() => component.destroy()).not.toThrow();
    });

    it('destroys when only listeners are registered', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');

        component.addEventListener('tick', vi.fn());
        component.destroy();

        expect(component.listener).toBe(null);
    });

    it('destroys listeners, methods, and custom teardown', () => {
        const owner = createOwner();
        const component = new Component('TestComponent', owner, 'comp-1');
        const destroyed = vi.fn();

        component._destroy = destroyed;
        component.addEventListener('tick', vi.fn());
        component.addMethod('act', vi.fn());

        component.destroy();

        expect(destroyed).toHaveBeenCalled();
        expect(component.listener).toBe(null);
        expect(owner.act).toBeUndefined();
    });

    it('returns a pooled asset list', () => {
        const list = Component.getAssetList();

        expect(list).toEqual([]);
    });
});
