import {describe, expect, it, vi} from 'vitest';
import Messenger from '../../../src/Messenger';
import EventHandlerList from '../../../src/EventHandlerList';
import EntityContainer from '../../../src/components/EntityContainer';

describe('EntityContainer child listener propagation', () => {
    const
        createContainer = () => new EntityContainer(new Messenger());

    it('propagates child listeners', () => {
        const
            container = createContainer(),
            child = new Messenger(),
            spy = vi.fn();

        child.on('test', spy);

        container.addChildEventListeners(child);

        container.trigger('test', 123);

        expect(spy).toHaveBeenCalledWith(123);
    });

    it('preserves listener context', () => {
        const
            container = createContainer(),
            child = new Messenger(),
            context = {value: 42};

        const spy = vi.fn(function () {
            expect(this).toBe(context);
        });

        child.on(
            'test',
            spy,
            context
        );

        container.addChildEventListeners(child);

        container.trigger('test');

        expect(spy).toHaveBeenCalled();
    });

    it('preserves once listeners', () => {
        const
            container = createContainer(),
            child = new Messenger(),
            spy = vi.fn();

        child.on(
            'test',
            spy,
            null,
            true
        );

        container.addChildEventListeners(child);

        container.trigger('test');
        container.trigger('test');

        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('preserves listener priorities', () => {
        const
            container = createContainer(),
            child = new Messenger(),
            calls = [];

        child.on(
            'test',
            () => calls.push('late'),
            null,
            false,
            100
        );

        child.on(
            'test',
            () => calls.push('early'),
            null,
            false,
            0
        );

        container.addChildEventListeners(child);

        container.trigger('test');

        expect(calls).toEqual([
            'early',
            'late'
        ]);
    });

    it('supports removing propagated listeners', () => {
        const
            container = createContainer(),
            child = new Messenger(),
            spy = vi.fn();

        child.on('test', spy);

        container.addChildEventListeners(child);

        container.off('test', spy);

        container.trigger('test');

        expect(spy).not.toHaveBeenCalled();
    });

    it('forwards child listeners to the correct event only', () => {
        const container = createContainer();
        const child = new Messenger();

        const cameraSpy = vi.fn();
        const renderSpy = vi.fn();

        child.on('camera-loaded', cameraSpy);
        child.on('handle-render', renderSpy);

        container.addChildEventListeners(child);

        container.triggerEvent('handle-render');

        expect(renderSpy).toHaveBeenCalledTimes(1);
        expect(cameraSpy).not.toHaveBeenCalled();
    });

    it('removes stale forwarded handlers during child update', () => {
        const container = createContainer();
        const child = new Messenger();

        const oldSpy = vi.fn();
        const newSpy = vi.fn();

        child.on('camera-loaded', oldSpy);

        container.addChildEventListeners(child);

        child.off('camera-loaded', oldSpy);
        child.on('camera-loaded', newSpy);

        container.updateChildEventListeners(child);

        container.triggerEvent('camera-loaded');

        expect(oldSpy).not.toHaveBeenCalled();
        expect(newSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps shared child callbacks isolated across events', () => {
        const container = createContainer();

        const childA = new Messenger();
        const childB = new Messenger();

        const shared = vi.fn();

        childA.on('camera-loaded', shared, childA);
        childB.on('handle-render', shared, childB);

        container.addChildEventListeners(childA);
        container.addChildEventListeners(childB);

        container.triggerEvent('handle-render');

        expect(shared).toHaveBeenCalledTimes(1);
    });

    it('removing one child preserves listeners for remaining children', () => {
        const container = createContainer();

        const childA = new Messenger();
        const childB = new Messenger();

        const spyA = vi.fn();
        const spyB = vi.fn();

        childA.on('camera-loaded', spyA);
        childB.on('handle-render', spyB);

        container.addChildEventListeners(childA);
        container.addChildEventListeners(childB);

        container.removeChildEventListeners(childA);

        container.triggerEvent('handle-render');

        expect(spyA).not.toHaveBeenCalled();
        expect(spyB).toHaveBeenCalledTimes(1);
    });
});

describe('EntityContainer child listener recycling', () => {
    it('cleans up propagated listeners correctly across repeated cycles', () => {
        const component = new EntityContainer(new Messenger());

        function persistentHandler() {}
        function onceHandler() {}

        function createChild(index) {
            const child = new Messenger();

            child.type = 'child-' + index;

            child.on(
                'handle-render',
                persistentHandler,
                child,
                false,
                index
            );

            child.on(
                'camera-loaded',
                onceHandler,
                child,
                true,
                index
            );

            return child;
        }

        for (let cycle = 0; cycle < 250; cycle++) {
            const child = createChild(cycle);

            component.addChildEventListeners(child);

            expect(
                component._listeners['handle-render'].handlers.length
            ).toBe(1);

            expect(
                component._listeners['camera-loaded'].handlers.length
            ).toBe(1);

            component.triggerOnChildren('camera-loaded', cycle);

            expect(
                component._listeners['camera-loaded'].handlers.length
            ).toBe(0);

            component.triggerOnChildren('handle-render', cycle);

            expect(
                component._listeners['handle-render'].handlers.length
            ).toBe(1);

            component.removeChildEventListeners(child);

            expect(child.containerListener).toBe(null);

            for (const key in component._listeners) {
                const listenerList = component._listeners[key];

                if (listenerList?.handlers) {
                    expect(listenerList.handlers.length).toBe(0);
                }
            }
        }
    });
});
