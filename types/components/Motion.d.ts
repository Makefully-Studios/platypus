import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Motion.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface MotionContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "control-acceleration": unknown;
    "control-velocity": unknown;
    "instant-begin": unknown;
    "instant-end": unknown;
    "instant-motion": unknown;
    "set-motion": unknown;
    "start-acceleration": unknown;
    "start-velocity": unknown;
    "stop-acceleration": unknown;
    "stop-velocity": unknown;
    };
    componentProps: {
    acceleration?: unknown;
    activeAcceleration?: unknown;
    activeVelocity?: unknown;
    controlState?: unknown;
    drag?: unknown;
    friction?: unknown;
    instant?: unknown;
    instantDecay?: unknown;
    instantState?: unknown;
    instantSuccess?: unknown;
    maxMagnitude?: unknown;
    orient?: unknown;
    stopOnCollision?: unknown;
    velocity?: unknown;
    };
}

export type MotionProps = MotionContribution['props'];
export type MotionEvents = MotionContribution['events'];
