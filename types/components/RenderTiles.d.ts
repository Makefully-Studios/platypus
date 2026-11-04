import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderTiles.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderTilesContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
    getMapDimensions?: (...args: never[]) => unknown;
    getRootTileIndex?: (...args: never[]) => unknown;
    getTileAt?: (...args: never[]) => unknown;
    getTileVariants?: (...args: never[]) => unknown;
    };
    events: {
    "add-tiles": unknown;
    "cache-sprite": unknown;
    "camera-loaded": unknown;
    "change-tile": unknown;
    "force-render": unknown;
    "peer-entity-added": unknown;
    "peer-entity-removed": unknown;
    "refresh-cache": unknown;
    };
    componentProps: {
    buffer?: unknown;
    cacheAll?: unknown;
    entityCache?: unknown;
    imageMap?: unknown;
    left?: unknown;
    maximumBuffer?: unknown;
    parallaxOriginX?: unknown;
    parallaxOriginY?: unknown;
    parallaxX?: unknown;
    parallaxY?: unknown;
    refreshBuffer?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    spriteSheet?: unknown;
    tileCache?: unknown;
    tileHeight?: unknown;
    tileWidth?: unknown;
    top?: unknown;
    };
}

export type RenderTilesProps = RenderTilesContribution['props'];
export type RenderTilesEvents = RenderTilesContribution['events'];
