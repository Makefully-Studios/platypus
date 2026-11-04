import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for HandlerRender.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface HandlerRenderContribution extends ComponentContribution {
    props: {
    timeMultiplier?: unknown;
    worldContainer?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "child-entity-added": unknown;
    "load": unknown;
    "pause-render": unknown;
    "render-update": unknown;
    "set-parent-render-container": unknown;
    "tick": unknown;
    "unpause-render": unknown;
    };
    componentProps: {
    interactive?: unknown;
    };
}

export type HandlerRenderProps = HandlerRenderContribution['props'];
export type HandlerRenderEvents = HandlerRenderContribution['events'];
