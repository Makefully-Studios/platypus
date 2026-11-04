import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicAngularMovement.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicAngularMovementContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "move": unknown;
    "set-angle": unknown;
    "set-max-velocity": unknown;
    "stop": unknown;
    };
    componentProps: {
    acceleration?: unknown;
    maxVelocity?: unknown;
    startAngle?: unknown;
    visualOffset?: unknown;
    };
}

export type LogicAngularMovementProps = LogicAngularMovementContribution['props'];
export type LogicAngularMovementEvents = LogicAngularMovementContribution['events'];
