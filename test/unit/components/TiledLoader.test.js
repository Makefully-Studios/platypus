import {beforeEach, describe, expect, it} from 'vitest';
import createComponentClass from '../../../src/factory.js';
import Data from '../../../src/Data.js';
import DataMap from '../../../src/DataMap.js';
import EntityLinker from '../../../src/EntityLinker';
import TiledLoader from '../../../src/components/TiledLoader.js';

function makeTileLayer ({width = 2, height = 1, tile = 1} = {}) {
    return {
        type: 'tilelayer',
        width,
        height,
        data: Array(width * height).fill(tile),
        id: 5,
        properties: []
    };
}

function makeTilesets () {
    return [{
        firstgid: 1,
        image: 'tiles.png',
        tilecount: 1,
        columns: 1,
        tilewidth: 32,
        tileheight: 32,
        imagewidth: 32,
        imageheight: 32,
        margin: 0,
        spacing: 0
    }];
}

function makeLoader () {
    return new TiledLoader({
        on () {},
        triggerEvent () {},
        addEntity (_entity, _options, callback) {
            if (callback) {
                callback();
            }
            return {
                triggerEvent () {}
            };
        }
    }, {});
}

describe('TiledLoader createLayer', () => {
    beforeEach(() => {
        globalThis.platypus = {
            components: {
                RenderTiles: createComponentClass({
                    id: 'RenderTiles',
                    properties: {},
                    initialize: function () {}
                })
            },
            game: {
                settings: {
                    entities: {
                        'render-layer': {
                            id: 'render-layer',
                            properties: {
                                marker: 'template'
                            },
                            components: [{
                                type: 'RenderTiles',
                                spriteSheet: 'import',
                                imageMap: 'import'
                            }]
                        }
                    },
                    spriteSheets: {}
                }
            },
            assetCache: {
                get () {
                    return null;
                }
            },
            debug: {
                warn () {}
            }
        };
    });

    it('does not mutate shared entity templates in settings', () => {
        const
            template = platypus.game.settings.entities['render-layer'],
            loader = makeLoader(),
            entityLinker = EntityLinker.setUp(),
            progress = Data.setUp('count', 0, 'progress', 0, 'total', 1),
            tileSetTileData = DataMap.setUp();

        loader.finishedLoading = () => {};

        loader.createLayer(
            'render-layer',
            makeTileLayer(),
            0,
            0,
            32,
            32,
            makeTilesets(),
            tileSetTileData,
            [],
            null,
            progress,
            entityLinker,
            0,
            0
        );

        expect(template.properties.marker).toBe('template');
        expect(template.properties).not.toHaveProperty('tiledId');
        expect(template.properties).not.toHaveProperty('width');
        expect(template.components[0].spriteSheet).toBe('import');
        expect(template.components[0].imageMap).toBe('import');
    });
});
