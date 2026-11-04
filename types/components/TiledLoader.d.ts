import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for TiledLoader.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface TiledLoaderContribution extends ComponentContribution {
    props: {
    entityModifier?: unknown;
    entityPositionX?: unknown;
    entityPositionY?: unknown;
    level?: unknown;
    manuallyLoad?: unknown;
    tileHeight?: unknown;
    tileWidth?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "layer-loaded": unknown;
    "load-level": unknown;
    };
    componentProps: {
    backgroundLoad?: unknown;
    images?: unknown;
    layerIncrement?: unknown;
    offsetMap?: unknown;
    separateTiles?: unknown;
    showCollisionTiles?: unknown;
    spriteSheet?: unknown;
    };
}

export type TiledLoaderProps = TiledLoaderContribution['props'];
export type TiledLoaderEvents = TiledLoaderContribution['events'];
