import {describe, expect, it} from 'vitest';
import AABB from '../../../src/AABB.js';
import RenderTiles from '../../../src/components/RenderTiles.js';

const convertCamera = RenderTiles.prototype.convertCamera;

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
