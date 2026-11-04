import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicDirectionalMovement.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicDirectionalMovementContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "accelerate": unknown;
    "component-added": unknown;
    "face": unknown;
    "go-down": unknown;
    "go-down-left": unknown;
    "go-down-right": unknown;
    "go-east": unknown;
    "go-left": unknown;
    "go-north": unknown;
    "go-northeast": unknown;
    "go-northwest": unknown;
    "go-right": unknown;
    "go-south": unknown;
    "go-southeast": unknown;
    "go-southwest": unknown;
    "go-up": unknown;
    "go-up-left": unknown;
    "go-up-right": unknown;
    "go-west": unknown;
    "handle-logic": unknown;
    "stop": unknown;
    };
    componentProps: {
    axis?: unknown;
    speed?: unknown;
    };
}

export type LogicDirectionalMovementProps = LogicDirectionalMovementContribution['props'];
export type LogicDirectionalMovementEvents = LogicDirectionalMovementContribution['events'];
