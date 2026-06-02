import {describe, expect, it} from 'vitest';
import TimeEvent from '../../src/TimeEvent.js';

describe('TimeEvent', () => {
    it('creates from positional arguments', () => {
        const event = new TimeEvent('tick', 250, 'payload', 'entity-1', false);

        expect(event.event).toBe('tick');
        expect(event.time).toBe(250);
        expect(event.message).toBe('payload');
        expect(event.entity).toBe('entity-1');
        expect(event.interruptable).toBe(false);
    });

    it('creates from an object definition', () => {
        const event = new TimeEvent({
            event: 'spawn',
            time: 100,
            message: {kind: 'enemy'},
            entity: 'spawner-1',
            interruptable: true
        });

        expect(event.event).toBe('spawn');
        expect(event.time).toBe(100);
        expect(event.message).toEqual({kind: 'enemy'});
        expect(event.entity).toBe('spawner-1');
        expect(event.interruptable).toBe(true);
    });

    it('adds a time offset when constructed from an object', () => {
        const event = new TimeEvent({event: 'wait', time: 50}, 25);

        expect(event.time).toBe(75);
    });

    it('serializes to JSON', () => {
        const event = new TimeEvent('finish', 500, 'done', {id: 'player-1'}, true);

        expect(event.toJSON()).toEqual({
            event: 'finish',
            message: 'done',
            time: 500,
            entity: 'player-1',
            interruptable: true
        });
    });

    it('supports setUp and recycle from the pool', () => {
        const event = TimeEvent.setUp('pulse', 10);

        expect(event.event).toBe('pulse');
        expect(event.time).toBe(10);

        event.recycle();

        const reused = TimeEvent.setUp({event: 'reset', time: 0});

        expect(reused.event).toBe('reset');
        expect(reused.time).toBe(0);

        reused.recycle();
    });
});
