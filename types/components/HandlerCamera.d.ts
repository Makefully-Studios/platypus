import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for HandlerCamera.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface HandlerCameraContribution extends ComponentContribution {
    props: {
    canvas?: unknown;
    transitionAngle?: unknown;
    transitionX?: unknown;
    transitionY?: unknown;
    worldCamera?: unknown;
    z?: unknown;
    };
    methods: {
    isOnCanvas?: (...args: never[]) => unknown;
    windowToWorld?: (...args: never[]) => unknown;
    worldToWindow?: (...args: never[]) => unknown;
    };
    events: {
    "child-entity-added": unknown;
    "child-entity-removed": unknown;
    "child-entity-updated": unknown;
    "follow": unknown;
    "load": unknown;
    "pointerdown": unknown;
    "pressmove": unknown;
    "pressup": unknown;
    "relocate": unknown;
    "render-world": unknown;
    "resize-camera": unknown;
    "shake": unknown;
    "tick": unknown;
    "world-loaded": unknown;
    };
    componentProps: {
    height?: unknown;
    mode?: unknown;
    overflow?: unknown;
    rotate?: unknown;
    stretch?: unknown;
    threshold?: unknown;
    width?: unknown;
    x?: unknown;
    y?: unknown;
    };
}

export type HandlerCameraProps = HandlerCameraContribution['props'];
export type HandlerCameraEvents = HandlerCameraContribution['events'];
