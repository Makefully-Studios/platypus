import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicDestroyMe.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicDestroyMeContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "destroy-me": unknown;
    "prepare-logic": unknown;
    };
    componentProps: {
    delay?: unknown;
    destroyed?: unknown;
    };
}

export type LogicDestroyMeProps = LogicDestroyMeContribution['props'];
export type LogicDestroyMeEvents = LogicDestroyMeContribution['events'];
