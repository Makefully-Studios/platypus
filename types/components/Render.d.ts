import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Render.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderContribution extends ComponentContribution {
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
    image?: unknown;
    images?: unknown;
    localRotation?: unknown;
    localScaleX?: unknown;
    localScaleY?: unknown;
    matchEntity?: unknown;
    offsetX?: unknown;
    offsetY?: unknown;
    offsetZ?: unknown;
    options?: unknown;
    spriteType?: unknown;
    };
}

export type RenderProps = RenderContribution['props'];
export type RenderEvents = RenderContribution['events'];
