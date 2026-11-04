import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderProgress.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderProgressContribution extends ComponentContribution {
    props: {
    x?: unknown;
    y?: unknown;
    z?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "handle-render": unknown;
    "handle-render-load": unknown;
    "update-progress": unknown;
    };
    componentProps: {
    backgroundColor?: unknown;
    color?: unknown;
    flip?: unknown;
    height?: unknown;
    mirror?: unknown;
    regX?: unknown;
    regY?: unknown;
    width?: unknown;
    };
}

export type RenderProgressProps = RenderProgressContribution['props'];
export type RenderProgressEvents = RenderProgressContribution['events'];
