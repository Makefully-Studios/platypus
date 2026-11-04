import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderLottie.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderLottieContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
        // none
    };
    componentProps: {
    localRotation?: unknown;
    localScaleX?: unknown;
    localScaleY?: unknown;
    offsetX?: unknown;
    offsetY?: unknown;
    offsetZ?: unknown;
    options?: unknown;
    };
}

export type RenderLottieProps = RenderLottieContribution['props'];
export type RenderLottieEvents = RenderLottieContribution['events'];
