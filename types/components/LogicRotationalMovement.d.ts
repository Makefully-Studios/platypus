import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicRotationalMovement.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicRotationalMovementContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "go-backward": unknown;
    "go-forward": unknown;
    "handle-logic": unknown;
    "rotate": unknown;
    "stop": unknown;
    "stop-moving": unknown;
    "stop-turning": unknown;
    "turn-left": unknown;
    "turn-right": unknown;
    };
    componentProps: {
    angle?: unknown;
    degree?: unknown;
    speed?: unknown;
    };
}

export type LogicRotationalMovementProps = LogicRotationalMovementContribution['props'];
export type LogicRotationalMovementEvents = LogicRotationalMovementContribution['events'];
