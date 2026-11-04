import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RelativePosition.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RelativePositionContribution extends ComponentContribution {
    props: {
    bottom?: unknown;
    left?: unknown;
    right?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    top?: unknown;
    x?: unknown;
    y?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "camera-update": unknown;
    "handle-logic": unknown;
    };
    componentProps: {
    cameraSizes?: unknown;
    };
}

export type RelativePositionProps = RelativePositionContribution['props'];
export type RelativePositionEvents = RelativePositionContribution['events'];
