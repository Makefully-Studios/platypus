import {beforeEach, describe, expect, it, vi} from 'vitest';
import Gamepad from '../../src/Gamepad.js';

const createSource = (overrides = {}) => ({
    id: 'Mock Controller',
    index: 0,
    axes: [0, 0, 0, 0],
    buttons: [{value: 0}, {value: 0}, {value: 0}, {value: 0}],
    vibrationActuator: {
        playEffect: vi.fn()
    },
    ...overrides
});

describe('Gamepad', () => {
    let onDown;
    let onUp;
    let onChange;
    let events;

    beforeEach(() => {
        events = [];
        onDown = vi.fn((event) => events.push({type: 'down', code: event.code}));
        onUp = vi.fn((event) => events.push({type: 'up', code: event.code}));
        onChange = vi.fn((event) => events.push({type: 'change', code: event.code}));
    });

    it('initializes axis vectors and button values from the source', () => {
        const source = createSource({
            axes: [0.5, -0.5, 1, 0],
            buttons: [{value: 0}, {value: 1}]
        });
        const pad = new Gamepad(source, onDown, onUp, onChange, 'pad-1', 0.1);

        expect(pad.id).toBe('pad-1');
        expect(pad.axes).toHaveLength(2);
        expect(pad.buttons).toEqual([0, 1]);
        expect(pad.axes[0].x).toBeCloseTo(0.444, 2);
        expect(pad.axes[0].y).toBeCloseTo(-0.667, 2);
    });

    it('applies deadzone clamping to axis vectors', () => {
        const source = createSource({axes: [0.05, 0.05, 0, 0]});
        const pad = new Gamepad(source, onDown, onUp, onChange, 'pad-1', 0.1);

        expect(pad.axes[0].x).toBe(0);
        expect(pad.axes[0].y).toBe(0);
    });

    it('fires onChange when an axis moves', () => {
        const source = createSource({axes: [0, 0, 0, 0]});
        const pad = new Gamepad(source, onDown, onUp, onChange, 'pad-1', 0.1);

        pad.update(createSource({axes: [1, 0, 0, 0]}));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(events[0]).toEqual({type: 'change', code: 'LeftStick'});
        expect(pad.axes[0].x).toBe(1);
        expect(onDown).not.toHaveBeenCalled();
        expect(onUp).not.toHaveBeenCalled();
    });

    it('fires onDown and onChange when a button is pressed', () => {
        const source = createSource({buttons: [{value: 0}, {value: 0}]});
        const pad = new Gamepad(source, onDown, onUp, onChange, 'pad-1', 0.1);

        pad.update(createSource({buttons: [{value: 0}, {value: 1}]}));

        expect(onDown).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(events).toContainEqual({type: 'down', code: 'BButton'});
        expect(pad.buttons[1]).toBe(1);
    });

    it('fires onUp and onChange when a button is released', () => {
        const source = createSource({buttons: [{value: 1}, {value: 0}]});
        const pad = new Gamepad(source, onDown, onUp, onChange, 'pad-1', 0.1);

        pad.update(createSource({buttons: [{value: 0}, {value: 0}]}));

        expect(onUp).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(events).toContainEqual({type: 'up', code: 'AButton'});
        expect(pad.buttons[0]).toBe(0);
    });

    it('plays dual-rumble effects through the source actuator', () => {
        const source = createSource();
        const pad = new Gamepad(source, onDown, onUp, onChange);

        pad.dualRumble(250, 10, 0.8, 0.6);

        expect(source.vibrationActuator.playEffect).toHaveBeenCalledWith('dual-rumble', {
            duration: 250,
            startDelay: 10,
            strongMagnitude: 0.8,
            weakMagnitude: 0.6
        });
    });

    it('recycles axis vectors on destroy', () => {
        const source = createSource();
        const pad = Gamepad.setUp(source, onDown, onUp, onChange);
        const axis = pad.axes[0];

        pad.recycle();

        expect(pad.axes).toHaveLength(0);
        expect(pad.buttons).toHaveLength(0);
        expect(axis.matrix).toHaveLength(0);
    });
});
