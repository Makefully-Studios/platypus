import {describe, expect, it} from 'vitest';
import StateMap from '../../src/StateMap.js';

describe('StateMap', () => {
    it('creates from an object like DataMap', () => {
        const state = new StateMap({moving: true, jumping: false});

        expect(state.get('moving')).toBe(true);
        expect(state.get('jumping')).toBe(false);
    });

    it('parses comma-delimited state strings', () => {
        const state = new StateMap('blue,red,!green');

        expect(state.get('blue')).toBe(true);
        expect(state.get('red')).toBe(true);
        expect(state.get('green')).toBe(false);
    });

    it('updates from a string via updateFromString', () => {
        const state = new StateMap();

        state.updateFromString('idle,!running');

        expect(state.get('idle')).toBe(true);
        expect(state.get('running')).toBe(false);
    });

    it('updates matching keys from another state map', () => {
        const current = new StateMap({a: true, b: false});
        const next = new StateMap({a: false, b: false, c: true});

        expect(current.update(next)).toBe(true);
        expect(current.get('a')).toBe(false);
        expect(current.get('b')).toBe(false);
        expect(current.get('c')).toBe(true);
    });

    it('returns false from update when states already match', () => {
        const current = new StateMap({a: true, b: false});
        const next = new StateMap({a: true, b: false});

        expect(current.update(next)).toBe(false);
    });

    it('checks inclusion against another state map', () => {
        const superset = new StateMap({a: true, b: false, c: true});
        const subset = new StateMap({a: true, b: false});
        const mismatch = new StateMap({a: false, b: false});

        expect(superset.includes(subset)).toBe(true);
        expect(superset.includes(mismatch)).toBe(false);
    });

    it('checks intersection against another state map', () => {
        const left = new StateMap({a: true, b: false});
        const overlap = new StateMap({a: true, c: true});
        const disjoint = new StateMap({a: false, c: true});

        expect(left.intersects(overlap)).toBe(true);
        expect(left.intersects(disjoint)).toBe(false);
    });

    it('recycles cleanly through the pool', () => {
        const state = StateMap.setUp('active,!paused');

        state.recycle();

        const reused = StateMap.setUp({fresh: true});

        expect(reused.get('fresh')).toBe(true);
        expect(reused.has('active')).toBe(false);

        reused.recycle();
    });
});
