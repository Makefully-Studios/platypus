import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicTimer.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicTimerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "set-timer": unknown;
    "start-timer": unknown;
    "stop-timer": unknown;
    };
    componentProps: {
    alarmMessage?: unknown;
    alarmTime?: unknown;
    isIncrementing?: unknown;
    isInterval?: unknown;
    isOn?: unknown;
    maxTime?: unknown;
    resetOnStop?: unknown;
    time?: unknown;
    updateMessage?: unknown;
    };
}

export type LogicTimerProps = LogicTimerContribution['props'];
export type LogicTimerEvents = LogicTimerContribution['events'];
