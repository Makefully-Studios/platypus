import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for NodeMap.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface NodeMapContribution extends ComponentContribution {
    props: {
    map?: unknown;
    };
    methods: {
    getClosestNode?: (...args: never[]) => unknown;
    getNode?: (...args: never[]) => unknown;
    };
    events: {
    "add-node": unknown;
    "child-entity-added": unknown;
    "child-entity-removed": unknown;
    "remove-node": unknown;
    };
    componentProps: {
        // none
    };
}

export type NodeMapProps = NodeMapContribution['props'];
export type NodeMapEvents = NodeMapContribution['events'];
