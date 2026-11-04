import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderAnimator.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderAnimatorContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "animation-ended": unknown;
    "state-changed": unknown;
    "update-animation": unknown;
    };
    componentProps: {
    animationEvents?: unknown;
    animationStates?: unknown;
    component?: unknown;
    forcePlayThrough?: unknown;
    loop?: unknown;
    restart?: unknown;
    };
}

export type RenderAnimatorProps = RenderAnimatorContribution['props'];
export type RenderAnimatorEvents = RenderAnimatorContribution['events'];
