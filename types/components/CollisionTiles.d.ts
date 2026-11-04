import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for CollisionTiles.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface CollisionTilesContribution extends ComponentContribution {
    props: {
    collisionMap?: unknown;
    tileHeight?: unknown;
    tileWidth?: unknown;
    };
    methods: {
    getAABB?: (...args: never[]) => unknown;
    getCollisionMatrix?: (...args: never[]) => unknown;
    getTileShapes?: (...args: never[]) => unknown;
    isTile?: (...args: never[]) => unknown;
    setCollisionMatrix?: (...args: never[]) => unknown;
    transform?: (...args: never[]) => unknown;
    translate?: (...args: never[]) => unknown;
    };
    events: {
    "add-collision-tiles": unknown;
    "transform": unknown;
    "translate": unknown;
    };
    componentProps: {
    collisionType?: unknown;
    collisionTypeMap?: unknown;
    left?: unknown;
    top?: unknown;
    };
}

export type CollisionTilesProps = CollisionTilesContribution['props'];
export type CollisionTilesEvents = CollisionTilesContribution['events'];
