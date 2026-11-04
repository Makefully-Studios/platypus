import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Counter.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface CounterContribution extends ComponentContribution {
    props: {
    count?: unknown;
    progress?: unknown;
    total?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "change-count": unknown;
    "change-total": unknown;
    "decrement-count": unknown;
    "handle-logic": unknown;
    "increment-count": unknown;
    };
    componentProps: {
    persistentStorage?: unknown;
    };
}

export type CounterProps = CounterContribution['props'];
export type CounterEvents = CounterContribution['events'];
