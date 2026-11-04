import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicSwitch.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicSwitchContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "switch-pressed": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicSwitchProps = LogicSwitchContribution['props'];
export type LogicSwitchEvents = LogicSwitchContribution['events'];
