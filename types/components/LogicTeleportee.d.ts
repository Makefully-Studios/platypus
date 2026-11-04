import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicTeleportee.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicTeleporteeContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "hit-telepoint": unknown;
    "set-destination": unknown;
    "teleport": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicTeleporteeProps = LogicTeleporteeContribution['props'];
export type LogicTeleporteeEvents = LogicTeleporteeContribution['events'];
