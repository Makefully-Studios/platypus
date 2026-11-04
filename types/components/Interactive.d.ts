import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Interactive.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface InteractiveContribution extends ComponentContribution {
    props: {
    buttonMode?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "camera-update": unknown;
    "dispatch-event": unknown;
    "input-off": unknown;
    "input-on": unknown;
    "pointercancel": unknown;
    "pointerdown": unknown;
    "pointermove": unknown;
    "pointerup": unknown;
    "pointerupoutside": unknown;
    "set-hit-area": unknown;
    };
    componentProps: {
    container?: unknown;
    hitArea?: unknown;
    hover?: unknown;
    relativeToSelf?: unknown;
    trackCameraUpdates?: unknown;
    };
}

export type InteractiveProps = InteractiveContribution['props'];
export type InteractiveEvents = InteractiveContribution['events'];
