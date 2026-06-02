import {describe, expect, it} from 'vitest';
import TimeEvent from '../../src/TimeEvent.js';
import TimeEventList from '../../src/TimeEventList.js';

describe('TimeEventList', () => {
    it('adds events with cumulative numeric delays', () => {
        const list = new TimeEventList([
            {event: 'start'},
            100,
            {event: 'middle'},
            50,
            {event: 'end'}
        ]);

        expect(list.list.map((entry) => entry.event)).toEqual(['start', 'middle', 'end']);
        expect(list.list.map((entry) => entry.time)).toEqual([0, 100, 150]);
    });

    it('sorts added events by time', () => {
        const list = new TimeEventList();

        list.addEvents([
            {event: 'late', time: 300},
            {event: 'early', time: 100},
            {event: 'mid', time: 200}
        ]);

        expect(list.list.map((entry) => entry.event)).toEqual(['early', 'mid', 'late']);
    });

    it('returns due events and advances internal time', () => {
        const list = new TimeEventList([
            {event: 'a', time: 0},
            {event: 'b', time: 100},
            {event: 'c', time: 200}
        ]);

        const firstBatch = list.getEvents(100);

        expect(firstBatch.map((entry) => entry.event)).toEqual(['a', 'b']);
        expect(list.time).toBe(100);
        expect(list.list.map((entry) => entry.event)).toEqual(['c']);
    });

    it('updates by delta and returns newly due events', () => {
        const list = new TimeEventList([
            {event: 'a', time: 50},
            {event: 'b', time: 150}
        ], 25);

        const due = list.update(100);

        expect(due.map((entry) => entry.event)).toEqual(['a']);
        expect(list.time).toBe(125);
    });

    it('reports the duration of the final scheduled event', () => {
        const list = new TimeEventList([
            {event: 'a', time: 10},
            {event: 'b', time: 90}
        ]);

        expect(list.getDuration()).toBe(90);
    });

    it('clears all scheduled events', () => {
        const list = new TimeEventList([
            {event: 'a', time: 0},
            {event: 'b', time: 50}
        ]);

        const cleared = list.clear();

        expect(cleared).toHaveLength(2);
        expect(list.list).toHaveLength(0);
        expect(list.getDuration()).toBe(0);
    });

    it('serializes scheduled events to JSON', () => {
        const list = new TimeEventList([
            {event: 'intro', time: 0, message: 'go', entity: 'scene', interruptable: false}
        ]);

        expect(list.toJSON()).toEqual([{
            event: 'intro',
            message: 'go',
            time: 0,
            entity: 'scene',
            interruptable: false
        }]);
    });

    it('accepts existing TimeEvent instances', () => {
        const existing = new TimeEvent('custom', 42);
        const list = new TimeEventList([existing]);

        expect(list.list[0]).toBe(existing);
        expect(list.getDuration()).toBe(42);
    });
});
