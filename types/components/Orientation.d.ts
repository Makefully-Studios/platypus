import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Orientation.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface OrientationContribution extends ComponentContribution {
    props: {
    orientation?: unknown;
    orientationMatrix?: unknown;
    rotation?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    };
    methods: {
    tweenTransform?: (...args: never[]) => unknown;
    };
    events: {
    "append-transform": unknown;
    "complete-tweens": unknown;
    "drop-tweens": unknown;
    "handle-logic": unknown;
    "load": unknown;
    "orient-vector": unknown;
    "prepend-transform": unknown;
    "remove-vector": unknown;
    "replace-transform": unknown;
    "transform": unknown;
    "tween-transform": unknown;
    };
    componentProps: {
        // none
    };
}

export type OrientationProps = OrientationContribution['props'];
export type OrientationEvents = OrientationContribution['events'];
