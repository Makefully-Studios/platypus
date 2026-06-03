import {beforeEach, describe, expect, it, vi} from 'vitest';
import AABB from '../../../src/AABB.js';
import CollisionShape from '../../../src/CollisionShape.js';
import Messenger from '../../../src/Messenger.js';
import CollisionBasic from '../../../src/components/CollisionBasic.js';
import RenderDebug from '../../../src/components/RenderDebug.js';

const {MockContainer, MockGraphics} = vi.hoisted(() => {
    class MockGraphics {
        constructor () {
            this.drawn = [];
            this.z = 0;
        }

        circle (x, y, radius) {
            this.drawn.push({type: 'circle', x, y, radius});
        }

        rect (x, y, width, height) {
            this.drawn.push({type: 'rect', x, y, width, height});
        }

        poly () {}

        fill () {}

        stroke () {}
    }

    class MockContainer {
        constructor () {
            this.children = [];
            this.zIndex = 0;
            this.x = 0;
            this.y = 0;
        }

        addChild (child) {
            this.children.push(child);
        }

        removeChild (child) {
            const index = this.children.indexOf(child);

            if (index >= 0) {
                this.children.splice(index, 1);
            }
        }

        updateTransform ({x, y} = {}) {
            if (x !== undefined) {
                this.x = x;
            }
            if (y !== undefined) {
                this.y = y;
            }
        }
    }

    return {MockContainer, MockGraphics};
});

vi.mock('pixi.js', () => ({
    Container: MockContainer,
    Graphics: MockGraphics
}));

const
    getRects = (graphics) => graphics.drawn.filter((entry) => entry.type === 'rect'),
    getCircles = (graphics) => graphics.drawn.filter((entry) => entry.type === 'circle'),
    createOwner = (overrides = {}) => {
        const
            worldContainer = new MockContainer(),
            owner = new Messenger();

        Object.assign(owner, {
            x: 0,
            y: 0,
            z: 0,
            parent: {worldContainer},
            removeComponent: vi.fn()
        }, overrides);

        return owner;
    },
    createRenderDebug = (owner, definition = {}) => new RenderDebug(owner, definition),
    setupCollisionOwner = (owner, shapes, collisionType = 'hero') => {
        const
            combined = AABB.setUp();

        shapes.forEach((shape) => {
            shape.update(owner.x, owner.y);
            combined.include(shape.aABB);
        });

        owner.collisionTypes = [collisionType];
        owner.getAABB = (type) => (type === collisionType ? combined : null);
        owner.getShapes = (type) => (type === collisionType ? shapes : null);

        return combined;
    };

beforeEach(() => {
    globalThis.platypus = {
        debug: {
            warn: vi.fn(),
            log: vi.fn()
        },
        game: {
            settings: {
                debug: true
            }
        }
    };
});

describe('RenderDebug updateSprites', () => {
    it('draws each CollisionShape from its own aABB in owner-local space', () => {
        const
            owner = createOwner({x: 100, y: 50}),
            rectangle = CollisionShape.setUp(owner, {
                type: 'rectangle',
                width: 40,
                height: 20,
                regX: 20,
                regY: 10,
                offsetX: 25,
                offsetY: 5
            }, 'hero'),
            circle = CollisionShape.setUp(owner, {
                type: 'circle',
                radius: 10,
                offsetX: -30,
                offsetY: 0
            }, 'hero'),
            renderDebug = createRenderDebug(owner);

        setupCollisionOwner(owner, [rectangle, circle]);
        renderDebug.updateSprites();

        const
            [aabbGraphic, rectangleGraphic, circleGraphic, originGraphic] = renderDebug.shapes,
            [combinedRect] = getRects(aabbGraphic),
            [shapeRect] = getRects(rectangleGraphic),
            [shapeCircle] = getCircles(circleGraphic),
            [originCircle] = getCircles(originGraphic);

        expect(combinedRect).toEqual({
            type: 'rect',
            x: -40,
            y: -10,
            width: 85,
            height: 25
        });
        expect(shapeRect).toEqual({
            type: 'rect',
            x: 5,
            y: -5,
            width: 40,
            height: 20
        });
        expect(shapeCircle).toEqual({
            type: 'circle',
            x: -30,
            y: 0,
            radius: 10
        });
        expect(originCircle).toEqual({
            type: 'circle',
            x: 0,
            y: 0,
            radius: 1
        });
    });

    it('matches CollisionBasic geometry for a non-centered rectangle', () => {
        const
            owner = createOwner({x: 50, y: 50, width: 40, height: 40});

        new CollisionBasic(owner, {
            collisionType: 'hero',
            width: 40,
            height: 40,
            regX: 10,
            regY: 5
        });

        const
            renderDebug = createRenderDebug(owner),
            [collisionShape] = owner.getShapes('hero'),
            expected = {
                left: collisionShape.aABB.left - owner.x,
                top: collisionShape.aABB.top - owner.y,
                width: collisionShape.aABB.width,
                height: collisionShape.aABB.height
            };

        renderDebug.updateSprites();

        const
            collisionGraphic = renderDebug.shapes[1],
            [drawnRect] = getRects(collisionGraphic);

        expect(drawnRect).toEqual({
            type: 'rect',
            x: expected.left,
            y: expected.top,
            width: expected.width,
            height: expected.height
        });
    });

    it('draws a fallback entity rect when no collision API is present', () => {
        const
            owner = createOwner(),
            renderDebug = createRenderDebug(owner, {width: 80, height: 40});

        renderDebug.updateSprites();

        const
            [entityGraphic] = renderDebug.shapes,
            [entityRect] = getRects(entityGraphic);

        expect(entityRect).toEqual({
            type: 'rect',
            x: -40,
            y: -20,
            width: 80,
            height: 40
        });
    });
});

describe('RenderDebug events', () => {
    it('removes itself on load when debug mode is off', () => {
        globalThis.platypus.game.settings.debug = false;

        const
            owner = createOwner(),
            renderDebug = createRenderDebug(owner);

        owner.triggerEvent('load');

        expect(owner.removeComponent).toHaveBeenCalledWith(renderDebug);
    });

    it('rebuilds sprites after collide-on and handle-render', () => {
        const
            owner = createOwner({x: 0, y: 0}),
            rectangle = CollisionShape.setUp(owner, {
                type: 'rectangle',
                width: 20,
                height: 10
            }, 'hero'),
            renderDebug = createRenderDebug(owner);

        setupCollisionOwner(owner, [rectangle]);
        renderDebug.updateSprites();

        rectangle.update(50, 0);
        owner.getAABB('hero').reset();
        owner.getAABB('hero').include(rectangle.aABB);

        owner.triggerEvent('collide-on');
        owner.triggerEvent('handle-render');

        const
            [shapeRect] = getRects(renderDebug.shapes[1]);

        expect(shapeRect).toEqual({
            type: 'rect',
            x: 40,
            y: -5,
            width: 20,
            height: 10
        });
        expect(renderDebug.isOutdated).toBe(false);
    });

    it('follows the owner position on handle-render', () => {
        const
            owner = createOwner({x: 10, y: 20, z: 3}),
            renderDebug = createRenderDebug(owner);

        owner.triggerEvent('handle-render');

        expect(renderDebug.container.x).toBe(10);
        expect(renderDebug.container.y).toBe(20);
        expect(renderDebug.container.zIndex).toBeCloseTo(3.000001);
    });
});

describe('RenderDebug destroy', () => {
    it('cleans up graphics and detaches from the world container', () => {
        const
            owner = createOwner(),
            renderDebug = createRenderDebug(owner);

        renderDebug.updateSprites();
        renderDebug.destroy();

        expect(renderDebug.shapes.length).toBe(0);
        expect(renderDebug.container).toBe(null);
        expect(owner.parent.worldContainer.children).toEqual([]);
    });
});
