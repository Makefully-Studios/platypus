import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicStateMachine.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicStateMachineContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "state-changed": unknown;
    "update-state": unknown;
    };
    componentProps: {
    appendDetails?: unknown;
    inputs?: unknown;
    outputs?: unknown;
    };
}

export type LogicStateMachineProps = LogicStateMachineContribution['props'];
export type LogicStateMachineEvents = LogicStateMachineContribution['events'];
