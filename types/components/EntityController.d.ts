import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for EntityController.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface EntityControllerContribution extends ComponentContribution {
    props: {
    paused?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "handle-controller": unknown;
    "pause-controls": unknown;
    "pointerdown": unknown;
    "pressmove": unknown;
    "pressup": unknown;
    "unpause-controls": unknown;
    };
    componentProps: {
    controlMap?: unknown;
    joystick?: unknown;
    stateMaps?: unknown;
    };
}

export type EntityControllerProps = EntityControllerContribution['props'];
export type EntityControllerEvents = EntityControllerContribution['events'];
