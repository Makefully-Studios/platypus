import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Node.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface NodeContribution extends ComponentContribution {
    props: {
    neighbors?: unknown;
    nodeId?: unknown;
    x?: unknown;
    y?: unknown;
    z?: unknown;
    };
    methods: {
    addToEdge?: (...args: never[]) => unknown;
    addToNode?: (...args: never[]) => unknown;
    getNode?: (...args: never[]) => unknown;
    joinNode?: (...args: never[]) => unknown;
    removeFromEdge?: (...args: never[]) => unknown;
    removeFromNode?: (...args: never[]) => unknown;
    };
    events: {
    "add-neighbors": unknown;
    "remove-neighbor": unknown;
    };
    componentProps: {
    neighborProperties?: unknown;
    };
}

export type NodeProps = NodeContribution['props'];
export type NodeEvents = NodeContribution['events'];
