import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for CollisionBasic.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface CollisionBasicContribution extends ComponentContribution {
    props: {
    bullet?: unknown;
    collisionDirty?: unknown;
    immobile?: unknown;
    jumpThrough?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "collide-off": unknown;
    "collide-on": unknown;
    "handle-logic": unknown;
    "orientation-updated": unknown;
    "relocate-entity": unknown;
    [event: `hit-by-${string}`]: unknown;
    };
    componentProps: {
    collisionType?: unknown;
    height?: unknown;
    ignoreOrientation?: unknown;
    margin?: unknown;
    radius?: unknown;
    regX?: unknown;
    regY?: unknown;
    shapeType?: unknown;
    shapes?: unknown;
    softCollisions?: unknown;
    solidCollisions?: unknown;
    width?: unknown;
    };
}

export type CollisionBasicProps = CollisionBasicContribution['props'];
export type CollisionBasicEvents = CollisionBasicContribution['events'];
