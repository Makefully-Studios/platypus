import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.hoisted(() => {
    globalThis.window = {
        devicePixelRatio: 1
    };
});

import Messenger from '../../../src/Messenger.js';
import HandlerCamera from '../../../src/components/HandlerCamera.js';

vi.mock('pixi.js', () => ({
    Container: class MockContainer {
        constructor () {
            this.x = 0;
            this.y = 0;
            this.scale = {x: 1, y: 1};
            this.rotation = 0;
            this.visible = false;
            this.zIndex = 0;
            this.children = [];
            this.worldTransform = {a: 1, d: 1};
        }

        addChild (child) {
            this.children.push(child);
        }

        removeChild () {}

        updateTransform ({x, y} = {}) {
            if (x !== undefined) {
                this.x = x;
            }
            if (y !== undefined) {
                this.y = y;
            }
        }
    }
}));

vi.mock('@tweenjs/tween.js', () => ({
    default: {
        Tween: class Tween {
            to () {
                return this;
            }

            easing () {
                return this;
            }

            onUpdate () {
                return this;
            }

            onStop () {
                return this;
            }

            start () {
                return this;
            }
        }
    }
}));

const
    MockContainer = vi.hoisted(() => class MockContainer {
        constructor () {
            this.x = 0;
            this.y = 0;
            this.scale = {x: 1, y: 1};
            this.rotation = 0;
            this.visible = false;
            this.zIndex = 0;
            this.children = [];
            this.worldTransform = {a: 1, d: 1};
        }

        addChild (child) {
            this.children.push(child);
        }

        removeChild () {}

        updateTransform ({x, y} = {}) {
            if (x !== undefined) {
                this.x = x;
            }
            if (y !== undefined) {
                this.y = y;
            }
        }
    }),
    createOwner = (overrides = {}) => {
        const owner = new Messenger();

        Object.assign(owner, {
            width: 800,
            height: 600,
            stage: new MockContainer(),
            triggerEventOnChildren: vi.fn(),
            addComponent: vi.fn(),
            components: []
        }, overrides);

        owner.triggerEvent = vi.fn(owner.triggerEvent.bind(owner));
        return owner;
    },
    createCamera = (definition = {}, ownerOverrides = {}) => {
        const
            owner = createOwner(ownerOverrides),
            world = new MockContainer();

        owner.stage.addChild(world);

        const
            camera = new HandlerCamera(owner, {
                width: 400,
                height: 300,
                x: 200,
                y: 150,
                mode: 'static',
                ...definition
            });

        camera.world = world;
        camera.windowPerWorldUnitWidth = 2;
        camera.windowPerWorldUnitHeight = 2;
        camera.worldPerWindowUnitWidth = 0.5;
        camera.worldPerWindowUnitHeight = 0.5;

        return {owner, camera, world};
    };

beforeEach(() => {
    globalThis.platypus = {
        debug: {
            warn: vi.fn(),
            log: vi.fn()
        },
        game: {
            canvas: {width: 800, height: 600}
        }
    };
});

describe('HandlerCamera mode resolution', () => {
    it('accepts valid camera modes', () => {
        const {camera} = createCamera();

        camera.follow({mode: 'mouse-pan', x: 10, y: 20});
        expect(camera.mode).toBe('mouse-pan');

        camera.follow({mode: 'static', x: 30, y: 40});
        expect(camera.mode).toBe('static');
    });

    it('maps deprecated modes to their replacements', () => {
        const {camera} = createCamera({mode: 'locked'});

        expect(camera.mode).toBe('following');
        expect(globalThis.platypus.debug.warn).toHaveBeenCalledWith(
            expect.stringContaining('locked')
        );
    });

    it('falls back to static for unknown modes', () => {
        const {camera} = createCamera({mode: 'following'});

        camera.follow({mode: 'not-a-mode'});
        expect(camera.mode).toBe('static');
    });
});

describe('HandlerCamera follow targets', () => {
    it('adds and removes follow targets', () => {
        const {camera} = createCamera();
        const entity = {cameraFocus: 1, addComponent: vi.fn()};

        expect(camera.addCamera(entity)).toBe(true);
        expect(camera.cameras).toContain(entity);
        expect(camera.mode).toBe('following');

        expect(camera.addCamera(entity)).toBe(false);

        expect(camera.removeCamera(entity)).toBe(true);
        expect(camera.cameras).not.toContain(entity);
        expect(camera.mode).toBe('static');
    });

    it('adds EntityCamera when the target has no cameraFocus', () => {
        const {camera} = createCamera();
        const entity = Object.assign(new Messenger(), {addComponent: vi.fn()});

        camera.addCamera(entity);

        expect(entity.addComponent).toHaveBeenCalledTimes(1);
    });
});

describe('HandlerCamera coordinate conversion', () => {
    it('converts between window and world coordinates', () => {
        const {camera} = createCamera();

        camera.worldCamera.viewport.setAll(200, 150, 400, 300);
        camera.viewport.setAll(400, 300, 800, 600);

        const world = camera.windowToWorld({x: 100, y: 50});
        const window = camera.worldToWindow({x: world.x, y: world.y});

        expect(world.x).toBe(50);
        expect(world.y).toBe(25);
        expect(window.x).toBeCloseTo(100);
        expect(window.y).toBeCloseTo(50);

        world.recycle();
        window.recycle();
    });
});

describe('HandlerCamera event payloads', () => {
    it('preserves snapshot values across child-entity-updated events', () => {
        const {owner, camera} = createCamera();
        const child = new Messenger();
        const payloads = [];

        camera.worldIsLoaded = true;
        camera.worldCamera.viewport.setAll(100, 100, 400, 300);

        child.on('camera-update', (msg) => {
            payloads.push(msg.viewport.x);
        });

        owner.triggerEvent('child-entity-updated', child);
        camera.worldCamera.viewport.moveXBy(50);
        owner.triggerEvent('child-entity-updated', child);

        expect(payloads).toEqual([100, 150]);
    });

    it('preserves snapshot values across child-entity-added events', () => {
        const {owner, camera} = createCamera();
        const child = new Messenger();
        const payloads = [];

        camera.worldIsLoaded = true;
        camera.worldDimensions.setBounds(0, 0, 1000, 800);
        camera.worldCamera.viewport.setAll(200, 150, 400, 300);

        child.on('camera-loaded', (msg) => {
            payloads.push(msg.viewport.x);
        });

        owner.triggerEvent('child-entity-added', child);
        camera.worldCamera.viewport.moveXBy(25);
        owner.triggerEvent('child-entity-added', child);

        expect(payloads).toEqual([200, 225]);
    });

    it('preserves snapshot values across updateViewport calls', () => {
        const {owner, camera, world} = createCamera();
        const payloads = [];

        owner.on('camera-update', (msg) => {
            payloads.push(msg.viewport.x);
        });

        camera.worldDimensions.setBounds(0, 0, 1000, 800);
        camera.worldCamera.viewport.setAll(100, 100, 400, 300);
        camera.viewportUpdate = true;

        camera.updateViewport();
        camera.worldCamera.viewport.moveXBy(40);
        camera.viewportUpdate = true;
        camera.updateViewport();

        expect(payloads).toEqual([100, 140]);
        expect(world.x).toBe(-140);
        expect(world.y).toBe(-100);
    });

    it('includes scale and orientation in camera-update payloads', () => {
        const {owner, camera} = createCamera();

        camera.worldDimensions.setBounds(0, 0, 1000, 800);
        camera.worldCamera.viewport.setAll(100, 100, 400, 300);
        camera.worldCamera.orientation = 1.5;
        camera.windowPerWorldUnitWidth = 2;
        camera.windowPerWorldUnitHeight = 3;
        camera.viewportUpdate = true;

        let payload = null;

        owner.on('camera-update', (msg) => {
            payload = {
                scaleX: msg.scaleX,
                scaleY: msg.scaleY,
                orientation: msg.orientation,
                viewportX: msg.viewport.x
            };
        });

        camera.updateViewport();

        expect(payload.scaleX).toBe(2);
        expect(payload.scaleY).toBe(3);
        expect(payload.orientation).toBe(1.5);
        expect(payload.viewportX).toBe(100);
    });
});

describe('HandlerCamera world-loaded', () => {
    it('stores world bounds and broadcasts camera-loaded to children', () => {
        const {owner, camera} = createCamera();
        const payloads = [];

        owner.triggerEventOnChildren = vi.fn((event, msg) => {
            if (event === 'camera-loaded') {
                payloads.push(msg.viewport.x);
            }
        });

        owner.triggerEvent('world-loaded', {
            world: {left: 0, top: 0, width: 1200, height: 900},
            level: {infinite: false}
        });

        expect(camera.worldDimensions.width).toBe(1200);
        expect(camera.unbounded).toBe(false);
        expect(payloads).toEqual([200]);

        camera.worldCamera.viewport.moveXBy(10);

        owner.triggerEvent('world-loaded', {
            world: {left: 0, top: 0, width: 1200, height: 900},
            level: {infinite: true}
        });

        expect(camera.unbounded).toBe(true);
        expect(payloads).toEqual([200, 210]);
    });
});

describe('HandlerCamera destroy', () => {
    it('cleans up pooled objects without shared message fields', () => {
        const {owner, camera} = createCamera();

        expect(() => camera.destroy()).not.toThrow();
        expect(camera.parentContainer).toBe(null);
        expect(camera.container).toBe(null);
    });
});
