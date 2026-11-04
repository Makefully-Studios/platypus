import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicPacingPlatform.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicPacingPlatformContribution extends ComponentContribution {
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

export type LogicPacingPlatformProps = LogicPacingPlatformContribution['props'];
export type LogicPacingPlatformEvents = LogicPacingPlatformContribution['events'];
