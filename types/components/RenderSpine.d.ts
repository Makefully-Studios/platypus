import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderSpine.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderSpineContribution extends ComponentContribution {
    props: {
    dragMode?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    skewX?: unknown;
    skewY?: unknown;
    x?: unknown;
    y?: unknown;
    z?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "apply-spine-physics": unknown;
    "handle-render": unknown;
    "hide": unknown;
    "pause-animation": unknown;
    "play-animation": unknown;
    "set-mix-times": unknown;
    "show": unknown;
    "stop-animation": unknown;
    "switch-skin": unknown;
    "tint-attachment": unknown;
    "tint-slots": unknown;
    "unpause-animation": unknown;
    };
    componentProps: {
    animationEvents?: unknown;
    animationMap?: unknown;
    animationStates?: unknown;
    atlas?: unknown;
    eventBased?: unknown;
    flip?: unknown;
    interactive?: unknown;
    localScaleX?: unknown;
    localScaleY?: unknown;
    mask?: unknown;
    mirror?: unknown;
    mixTimes?: unknown;
    offsetX?: unknown;
    offsetY?: unknown;
    offsetZ?: unknown;
    preMultipliedAlpha?: unknown;
    skeleton?: unknown;
    skinMap?: unknown;
    stateBased?: unknown;
    visible?: unknown;
    };
}

export type RenderSpineProps = RenderSpineContribution['props'];
export type RenderSpineEvents = RenderSpineContribution['events'];
