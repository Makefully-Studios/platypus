import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderDebug.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderDebugContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "collide-off": unknown;
    "collide-on": unknown;
    "handle-render": unknown;
    "load": unknown;
    "orientation-updated": unknown;
    };
    componentProps: {
    aabbColor?: unknown;
    collisionColor?: unknown;
    groupColor?: unknown;
    height?: unknown;
    offsetZ?: unknown;
    renderColor?: unknown;
    width?: unknown;
    };
}

export type RenderDebugProps = RenderDebugContribution['props'];
export type RenderDebugEvents = RenderDebugContribution['events'];
