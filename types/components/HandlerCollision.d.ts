import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for HandlerCollision.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface HandlerCollisionContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
    getEntityCollisions?: (...args: never[]) => unknown;
    getPointCollisions?: (...args: never[]) => unknown;
    getShapeCollisions?: (...args: never[]) => unknown;
    getWorldEntities?: (...args: never[]) => unknown;
    getWorldTerrain?: (...args: never[]) => unknown;
    };
    events: {
    "add-collision-entity": unknown;
    "check-collision-group": unknown;
    "child-entity-added": unknown;
    "child-entity-removed": unknown;
    "child-entity-updated": unknown;
    "remove-collision-entity": unknown;
    [event: `hit-by-${string}`]: unknown;
    };
    componentProps: {
    gridBits?: unknown;
    };
}

export type HandlerCollisionProps = HandlerCollisionContribution['props'];
export type HandlerCollisionEvents = HandlerCollisionContribution['events'];
