import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TextureSource} from 'pixi.js';
import PIXIAnimation from '../../src/PIXIAnimation.js';

function makeTextureSource () {
    return new TextureSource({});
}

describe('PIXIAnimation', () => {
    beforeEach(() => {
        globalThis.platypus = {
            assetCache: {
                getFileId (path) {
                    const match = path.match(/(?:([^\/?]+?)(?:\.(\w+))?)$/);

                    return match ? match[1] : path;
                },
                get (alias) {
                    if (this.assets?.[alias]) {
                        return this.assets[alias];
                    }

                    const fileId = this.getFileId(alias);

                    if (fileId !== alias && this.assets?.[fileId]) {
                        return this.assets[fileId];
                    }

                    return null;
                },
                assets: {}
            },
            debug: {
                warn: vi.fn()
            },
            game: {
                settings: {
                    spriteSheets: {}
                }
            }
        };
    });

    describe('formatSpriteSheet cache ids', () => {
        it('assigns distinct hashed ids to similarly-formed sprite sheets', () => {
            platypus.assetCache.assets = {
                'sheet-a': {source: makeTextureSource()}
            };

            const
                definitionA = {
                    images: ['sheet-a.png'],
                    frames: [[0, 0, 10, 10, 0, 5, 5]],
                    animations: {default: 0}
                },
                definitionB = {
                    images: ['sheet-a.png'],
                    frames: [[0, 0, 10, 10, 0, 5, 6]],
                    animations: {default: 0}
                },
                sheetA = PIXIAnimation.formatSpriteSheet(definitionA),
                sheetB = PIXIAnimation.formatSpriteSheet(definitionB);

            new PIXIAnimation(sheetA, 'default');
            new PIXIAnimation(sheetB, 'default');

            expect(sheetA.id).toBeFalsy();
            expect(sheetB.id).toBeFalsy();
            expect(sheetA).not.toEqual(sheetB);
        });

        it('preserves an explicit sprite sheet id', () => {
            platypus.assetCache.assets = {
                'sheet-a': {source: makeTextureSource()}
            };

            const sheet = PIXIAnimation.formatSpriteSheet({
                id: 'custom-sheet',
                images: ['sheet-a.png'],
                frames: [[0, 0, 10, 10, 0, 5, 5]],
                animations: {default: 0}
            });

            new PIXIAnimation(sheet, 'default');

            expect(sheet.id).toBe('custom-sheet');
        });
    });

    describe('invalidateTextureSources', () => {
        it('clears stale texture sources when an asset is unloaded', () => {
            const
                firstSource = makeTextureSource(),
                secondSource = makeTextureSource(),
                sheet = {
                    images: ['panel.png'],
                    frames: [[0, 0, 10, 10, 0, 5, 5]],
                    animations: {default: 0}
                };

            platypus.assetCache.assets = {
                panel: {source: firstSource}
            };

            PIXIAnimation.formatSpriteSheet(sheet);
            expect(platypus.debug.warn).not.toHaveBeenCalled();

            platypus.assetCache.assets.panel = {source: secondSource};

            PIXIAnimation.formatSpriteSheet({
                images: ['panel.png'],
                frames: [[0, 0, 10, 10, 0, 5, 5]],
                animations: {default: 0}
            });
            expect(platypus.debug.warn).not.toHaveBeenCalled();

            delete platypus.assetCache.assets.panel;
            PIXIAnimation.invalidateTextureSources('panel.png');

            platypus.assetCache.assets.panel = {source: secondSource};

            PIXIAnimation.formatSpriteSheet({
                images: ['panel.png'],
                frames: [[0, 0, 10, 10, 0, 5, 5]],
                animations: {default: 0}
            });
            expect(platypus.debug.warn).not.toHaveBeenCalled();
        });
    });
});
