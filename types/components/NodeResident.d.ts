import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for NodeResident.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface NodeResidentContribution extends ComponentContribution {
    props: {
    friendlyEntities?: unknown;
    friendlyNodes?: unknown;
    nodeId?: unknown;
    speed?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "follow": unknown;
    "goto-closest-node": unknown;
    "goto-node": unknown;
    "handle-logic": unknown;
    "remove-directions": unknown;
    "set-algorithm": unknown;
    "set-directions": unknown;
    };
    componentProps: {
    algorithm?: unknown;
    node?: unknown;
    offset?: unknown;
    snapToNodes?: unknown;
    updateOrientation?: unknown;
    };
}

export type NodeResidentProps = NodeResidentContribution['props'];
export type NodeResidentEvents = NodeResidentContribution['events'];
