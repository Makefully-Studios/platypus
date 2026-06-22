import {describe, expect, it, vi} from 'vitest';
import AABB from '../../../src/AABB.js';
import RenderTiles from '../../../src/components/RenderTiles.js';

const
    convertCamera = RenderTiles.prototype.convertCamera,
    populateTiles = RenderTiles.prototype.populateTiles,
    alignCacheToCamera = RenderTiles.prototype.alignCacheToCamera;

function makeComponent (overrides = {}) {
    return {
        worldWidth: 800,
        worldHeight: 600,
        layerWidth: 800,
        layerHeight: 600,
        scaleX: 1,
        scaleY: 1,
        left: 0,
        top: 0,
        parallaxX: 1,
        parallaxY: 1,
        parallaxOriginX: 0,
        parallaxOriginY: 0,
        laxCam: AABB.setUp(),
        ...overrides
    };
}

function parallaxScreenOffset (component, camera) {
    convertCamera.call(component, camera);

    return {
        x: camera.left - component.laxCam.left,
        y: camera.top - component.laxCam.top
    };
}

describe('RenderTiles convertCamera parallax', () => {
    it('does not offset when parallax factors are 1', () => {
        const
            component = makeComponent(),
            camera = AABB.setUp(400, 300, 800, 600),
            offset = parallaxScreenOffset(component, camera);

        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);
    });

    it('scrolls slower than the camera when parallax factor is below 1', () => {
        const
            component = makeComponent({parallaxX: 0.5}),
            camera = AABB.setUp(400, 300, 800, 600),
            offset = parallaxScreenOffset(component, camera);

        expect(offset.x).toBe(-200);
        expect(offset.y).toBe(0);
    });

    it('stays fixed on screen when parallax factor is 0', () => {
        const
            component = makeComponent({parallaxX: 0, parallaxY: 0}),
            camera = AABB.setUp(400, 300, 800, 600),
            offset = parallaxScreenOffset(component, camera);

        expect(offset.x).toBe(-400);
        expect(offset.y).toBe(-300);
    });

    it('anchors parallax to the map origin', () => {
        const
            component = makeComponent({parallaxX: 0.5, parallaxOriginX: 200}),
            atOrigin = parallaxScreenOffset(component, AABB.setUp(200, 300, 800, 600)),
            displaced = parallaxScreenOffset(component, AABB.setUp(400, 300, 800, 600));

        expect(atOrigin.x).toBe(0);
        expect(displaced.x).toBe(-100);
    });
});

describe('RenderTiles populateTiles', () => {
    function makeMap (width, height) {
        const map = [];

        for (let x = 0; x < width; x++) {
            map[x] = [];
            for (let y = 0; y < height; y++) {
                map[x][y] = {
                    getNext: () => ({x: 0, y: 0, template: {clear: vi.fn()}})
                };
            }
        }

        return [map];
    }

    function makeTileComponent () {
        const tileContainer = {
            children: [],
            removeChildren () {
                this.children = [];
            },
            addChild (child) {
                this.children.push(child);
            }
        };

        return {
            tileWidth: 64,
            tileHeight: 64,
            left: 0,
            top: 0,
            imageMap: makeMap(32, 32),
            tileContainer
        };
    }

    it('skips every tile when new bounds match old bounds (incremental scroll only)', () => {
        const
            component = makeTileComponent(),
            bounds = AABB.setUp(),
            oldBounds = AABB.setUp();

        bounds.setBounds(5, 5, 16, 12);
        oldBounds.setBounds(5, 5, 16, 12);

        populateTiles.call(component, bounds, oldBounds);

        expect(component.tileContainer.children).toHaveLength(0);
    });

    it('repopulates every tile when old bounds are omitted (in-place refresh)', () => {
        const
            component = makeTileComponent(),
            bounds = AABB.setUp();

        bounds.setBounds(5, 5, 16, 12);

        populateTiles.call(component, bounds, null);

        expect(component.tileContainer.children).toHaveLength(12 * 8);
    });
});

describe('RenderTiles alignCacheToCamera', () => {
    it('centers the cache window on the camera and clamps to the map edges', () => {
        const
            component = makeComponent({
                tilesWidth: 60,
                tilesHeight: 20,
                tileWidth: 64,
                tileHeight: 64,
                cacheTilesWidth: 12,
                cacheTilesHeight: 8,
                laxCam: AABB.setUp(),
                convertCamera
            }),
            viewport = AABB.setUp(1920, 480, 768, 768),
            bounds = AABB.setUp();

        alignCacheToCamera.call(component, bounds, viewport);

        expect(bounds.empty).toBe(false);
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(59);
        expect(bounds.top).toBeGreaterThanOrEqual(0);
        expect(bounds.bottom).toBeLessThanOrEqual(19);
        expect(bounds.width).toBe(11);
        expect(bounds.height).toBe(7);
    });
});
