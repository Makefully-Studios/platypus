import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for EntityCamera.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface EntityCameraContribution extends ComponentContribution {
    props: {
    cameraBounds?: unknown;
    cameraFocus?: unknown;
    cameraHeight?: unknown;
    cameraOffset?: unknown;
    cameraOffsetX?: unknown;
    cameraOffsetY?: unknown;
    cameraSize?: unknown;
    cameraWidth?: unknown;
    x?: unknown;
    y?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "follow-me": unknown;
    "handle-movement": unknown;
    };
    componentProps: {
    camera?: unknown;
    mode?: unknown;
    pause?: unknown;
    };
}

export type EntityCameraProps = EntityCameraContribution['props'];
export type EntityCameraEvents = EntityCameraContribution['events'];
