import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Mover.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface MoverContribution extends ComponentContribution {
    props: {
    drag?: unknown;
    friction?: unknown;
    gravity?: unknown;
    jump?: unknown;
    maxMagnitude?: unknown;
    maxMagnitudeDelta?: unknown;
    movers?: unknown;
    reorientVelocities?: unknown;
    speed?: unknown;
    };
    methods: {
    addMover?: (...args: never[]) => unknown;
    removeMover?: (...args: never[]) => unknown;
    };
    events: {
    "component-added": unknown;
    "component-removed": unknown;
    "handle-movement": unknown;
    "handle-post-collision-logic": unknown;
    "hit-solid": unknown;
    "load": unknown;
    "orientation-updated": unknown;
    "pause-movement": unknown;
    "set-mover": unknown;
    "unpause-movement": unknown;
    };
    componentProps: {
    ground?: unknown;
    };
}

export type MoverProps = MoverContribution['props'];
export type MoverEvents = MoverContribution['events'];
