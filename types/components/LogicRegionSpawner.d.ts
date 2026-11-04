import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicRegionSpawner.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicRegionSpawnerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicRegionSpawnerProps = LogicRegionSpawnerContribution['props'];
export type LogicRegionSpawnerEvents = LogicRegionSpawnerContribution['events'];
