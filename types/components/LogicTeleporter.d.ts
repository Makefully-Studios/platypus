import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicTeleporter.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicTeleporterContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "peer-entity-added": unknown;
    "teleport-entity": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicTeleporterProps = LogicTeleporterContribution['props'];
export type LogicTeleporterEvents = LogicTeleporterContribution['events'];
