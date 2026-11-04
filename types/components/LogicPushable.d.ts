import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicPushable.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicPushableContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "hit-solid": unknown;
    "push-entity": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicPushableProps = LogicPushableContribution['props'];
export type LogicPushableEvents = LogicPushableContribution['events'];
