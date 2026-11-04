import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicRebounder.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicRebounderContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "hit-non-static": unknown;
    "hit-static": unknown;
    "share-velocity": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicRebounderProps = LogicRebounderContribution['props'];
export type LogicRebounderEvents = LogicRebounderContribution['events'];
