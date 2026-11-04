import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderDestroyMe.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderDestroyMeContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "animation-ended": unknown;
    };
    componentProps: {
    animationId?: unknown;
    animationIds?: unknown;
    };
}

export type RenderDestroyMeProps = RenderDestroyMeContribution['props'];
export type RenderDestroyMeEvents = RenderDestroyMeContribution['events'];
