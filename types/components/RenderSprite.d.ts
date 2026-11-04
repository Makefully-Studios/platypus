import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderSprite.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderSpriteContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-render": unknown;
    "play-animation": unknown;
    "stop-animation": unknown;
    };
    componentProps: {
    animationEvents?: unknown;
    animationMap?: unknown;
    animationStates?: unknown;
    cache?: unknown;
    eventBased?: unknown;
    flip?: unknown;
    forcePlayThrough?: unknown;
    ignoreOpacity?: unknown;
    interactive?: unknown;
    localRotation?: unknown;
    localScaleX?: unknown;
    localScaleY?: unknown;
    mask?: unknown;
    mirror?: unknown;
    offsetX?: unknown;
    offsetY?: unknown;
    offsetZ?: unknown;
    restart?: unknown;
    scale?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    skew?: unknown;
    skewX?: unknown;
    skewY?: unknown;
    spriteSheet?: unknown;
    stateBased?: unknown;
    visible?: unknown;
    };
}

export type RenderSpriteProps = RenderSpriteContribution['props'];
export type RenderSpriteEvents = RenderSpriteContribution['events'];
