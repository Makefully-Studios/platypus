import {beforeEach, describe, expect, it} from 'vitest';
import LevelBuilder from '../../../src/components/LevelBuilder.js';
import Messenger from '../../../src/Messenger.js';

function makePiece ({width, height, tile, objectX = 0, objectY = 0}) {
    return {
        width,
        height,
        tilewidth: 32,
        tileheight: 32,
        layers: [
            {
                type: 'tilelayer',
                width,
                height,
                data: Array(width * height).fill(tile)
            },
            {
                type: 'objectgroup',
                objects: [{
                    id: 1,
                    x: objectX,
                    y: objectY,
                    width: 32,
                    height: 32,
                    polygon: [{x: 0, y: 0}, {x: 16, y: 16}]
                }]
            }
        ],
        tilesets: [{
            firstgid: 1,
            name: 'tiles',
            image: 'tiles.png',
            properties: [{name: 'shared', type: 'string', value: 'tileset'}]
        }],
        properties: [{name: 'piece', type: 'string', value: `${tile}`}]
    };
}

function makeBuilder () {
    return new LevelBuilder(new Messenger(), {});
}

describe('LevelBuilder mergeLevels', () => {
    beforeEach(() => {
        globalThis.platypus = {
            game: {
                settings: {
                    levels: {}
                }
            },
            debug: {
                warn () {}
            }
        };
    });

    it('does not reuse arrays or objects from source pieces', () => {
        const
            left = makePiece({width: 2, height: 1, tile: 1, objectX: 0}),
            right = makePiece({width: 2, height: 1, tile: 2, objectX: 32}),
            builder = makeBuilder(),
            merged = builder.mergeLevels([[left, right]]);

        expect(merged.width).toBe(4);
        expect(merged.layers[0].data).not.toBe(left.layers[0].data);
        expect(merged.layers[0].data).not.toBe(right.layers[0].data);
        expect(merged.layers[1].objects).not.toBe(left.layers[1].objects);
        expect(merged.layers[1].objects).not.toBe(right.layers[1].objects);
        expect(merged.layers[1].objects[0]).not.toBe(left.layers[1].objects[0]);
        expect(merged.layers[1].objects[1]).not.toBe(right.layers[1].objects[0]);
        expect(merged.layers[1].objects[0].polygon).not.toBe(left.layers[1].objects[0].polygon);
        expect(merged.tilesets).not.toBe(left.tilesets);
        expect(merged.tilesets[0]).not.toBe(left.tilesets[0]);
        expect(merged.tilesets[0].properties).not.toBe(left.tilesets[0].properties);
        expect(merged.properties).not.toBe(left.properties);

        merged.layers[0].data[0] = 99;
        merged.layers[1].objects[0].x = 999;
        merged.layers[1].objects[0].polygon[0].x = 999;
        merged.tilesets[0].properties[0].value = 'mutated';
        merged.properties[0].value = 'mutated';

        expect(left.layers[0].data[0]).toBe(1);
        expect(left.layers[1].objects[0].x).toBe(0);
        expect(left.layers[1].objects[0].polygon[0].x).toBe(0);
        expect(left.tilesets[0].properties[0].value).toBe('tileset');
        expect(left.properties[0].value).toBe('1');
    });

    it('can reuse the same source piece twice without cross-contamination', () => {
        const
            piece = makePiece({width: 1, height: 1, tile: 5, objectX: 0}),
            builder = makeBuilder(),
            merged = builder.mergeLevels([[piece, piece]]);

        expect(merged.width).toBe(2);
        expect(merged.layers[0].data).toEqual([5, 5]);
        expect(merged.layers[1].objects[0]).not.toBe(merged.layers[1].objects[1]);

        merged.layers[1].objects[0].x = 111;

        expect(merged.layers[1].objects[1].x).toBe(32);
        expect(piece.layers[1].objects[0].x).toBe(0);
    });

    it('keeps a pristine copy for replay separate from the loaded level definition', () => {
        const
            piece = makePiece({width: 1, height: 1, tile: 3, objectX: 0}),
            builder = makeBuilder(),
            merged = builder.mergeLevels([[piece]]),
            stored = builder.cloneLevel(merged);

        expect(stored).not.toBe(merged);
        expect(stored.layers[0].data).not.toBe(merged.layers[0].data);

        merged.layers[0].data[0] = 99;

        expect(stored.layers[0].data[0]).toBe(3);
    });
});

describe('LevelBuilder validation errors', () => {
    beforeEach(() => {
        globalThis.platypus = {
            game: {
                settings: {
                    levels: {}
                }
            },
            debug: {
                warn () {}
            }
        };
    });

    it('throws when merging an undefined level piece by name', () => {
        const builder = makeBuilder();

        expect(() => builder.mergeLevels([['missing-piece']])).toThrow(
            'Level piece "missing-piece" was not found in platypus.game.settings.levels.'
        );
    });

    it('throws when merging a level piece missing tilewidth', () => {
        const builder = makeBuilder();

        expect(() => builder.mergeLevels([[{width: 1, height: 1, layers: []}]])).toThrow(
            'Level piece "row 0, column 0" is missing tilewidth.'
        );
    });

    it('throws when levelPieces entry has an invalid type', () => {
        const builder = makeBuilder();

        expect(() => triggerLayerLoaded(builder, {
            levelPieces: {forest: 42},
            levelTemplate: ['forest']
        })).toThrow(
            'levelPieces["forest"] must be a string or array of strings, received number.'
        );
    });

    it('throws when levelTemplate row is empty', () => {
        const builder = makeBuilder();

        expect(() => triggerLayerLoaded(builder, {
            levelTemplate: [[]]
        })).toThrow(
            'levelTemplate row 0 is empty.'
        );
    });

    it('throws when levelTemplate is not rectangular', () => {
        const builder = makeBuilder();

        expect(() => triggerLayerLoaded(builder, {
            levelTemplate: [['start', 'end'], ['only-one']],
            levelPieces: {start: 'a', end: 'b', 'only-one': 'c'}
        })).toThrow(
            'levelTemplate is not rectangular: row 0 has 2 columns but row 1 has 1.'
        );
    });

    it('throws when a levelPieces mapping points to a missing level', () => {
        const builder = makeBuilder();

        expect(() => triggerLayerLoaded(builder, {
            levelTemplate: [['forest']],
            levelPieces: {forest: 'missing-map'}
        })).toThrow(
            'Level piece "missing-map" was not found in platypus.game.settings.levels.'
        );
    });

    it('throws when useUniques exhausts piece options', () => {
        const builder = makeBuilder();

        platypus.game.settings.levels['forest-1'] = makePiece({width: 1, height: 1, tile: 1});

        expect(() => triggerLayerLoaded(builder, {
            levelTemplate: ['forest', 'forest'],
            levelPieces: {forest: ['forest-1']},
            useUniques: true
        })).toThrow(
            'There are no MORE level pieces of type: forest'
        );
    });
});

function triggerLayerLoaded (builder, data = {}) {
    builder.owner.triggerEvent('layer-loaded', data);
}
