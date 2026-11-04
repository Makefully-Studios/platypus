import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for CollisionGroup.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface CollisionGroupContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
    getCollisionGroupAABB?: (...args: never[]) => unknown;
    getWorldEntities?: (...args: never[]) => unknown;
    getWorldTerrain?: (...args: never[]) => unknown;
    };
    events: {
    "add-collision-entity": unknown;
    "child-entity-added": unknown;
    "child-entity-removed": unknown;
    "relocate-entity": unknown;
    "remove-collision-entity": unknown;
    };
    componentProps: {
        // none
    };
}

export type CollisionGroupProps = CollisionGroupContribution['props'];
export type CollisionGroupEvents = CollisionGroupContribution['events'];
