import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderContainer.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderContainerContribution extends ComponentContribution {
    props: {
    dragMode?: unknown;
    renderParent?: unknown;
    rotation?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    skewX?: unknown;
    skewY?: unknown;
    tint?: unknown;
    x?: unknown;
    y?: unknown;
    z?: unknown;
    };
    methods: {
    addToParentContainer?: (...args: never[]) => unknown;
    removeFromParentContainer?: (...args: never[]) => unknown;
    };
    events: {
    "cache": unknown;
    "handle-render-load": unknown;
    "hide-sprite": unknown;
    "set-mask": unknown;
    "show-sprite": unknown;
    };
    componentProps: {
    cache?: unknown;
    cullable?: unknown;
    flip?: unknown;
    ignoreOpacity?: unknown;
    interactive?: unknown;
    interpolation?: unknown;
    localMask?: unknown;
    mask?: unknown;
    mirror?: unknown;
    rotate?: unknown;
    visible?: unknown;
    };
}

export type RenderContainerProps = RenderContainerContribution['props'];
export type RenderContainerEvents = RenderContainerContribution['events'];
