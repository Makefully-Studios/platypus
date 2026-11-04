import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicSpawner.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicSpawnerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "spawn": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicSpawnerProps = LogicSpawnerContribution['props'];
export type LogicSpawnerEvents = LogicSpawnerContribution['events'];
