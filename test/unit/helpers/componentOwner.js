import {vi} from 'vitest';
import Messenger from '../../../src/Messenger.js';
import StateMap from '../../../src/StateMap.js';

/**
 * Minimal platypus global used by component smoke / contract tests.
 */
export const installPlatypusGlobal = (extra = {}) => {
    const assetCache = {
        get: vi.fn(() => null),
        has: vi.fn(() => false),
        load: vi.fn(async () => []),
        ...extra.assetCache
    };

    globalThis.platypus = {
        debug: {
            warn: vi.fn(),
            log: vi.fn(),
            olive: vi.fn()
        },
        game: {
            settings: {
                debug: false,
                entities: {},
                levels: {},
                rooms: {},
                scenes: {},
                audio: {}
            },
            canvas: {width: 800, height: 600},
            triggerOnChildren: vi.fn(),
            ...extra.game
        },
        assetCache,
        components: extra.components || {},
        ...extra
    };

    return globalThis.platypus;
};

const createMockDisplayObject = () => {
    const children = [];

    return {
        x: 0,
        y: 0,
        zIndex: 0,
        visible: true,
        alpha: 1,
        cursor: null,
        scale: {x: 1, y: 1, set (x, y) {
            this.x = x;
            this.y = y ?? x;
        }},
        pivot: {x: 0, y: 0, set () {}},
        anchor: {x: 0, y: 0, set () {}},
        position: {x: 0, y: 0, set () {}},
        rotation: 0,
        width: 32,
        height: 32,
        children,
        worldTransform: {a: 1, d: 1},
        parent: null,
        texture: {width: 32, height: 32, source: {width: 32, height: 32}},
        addChild (...kids) {
            for (const kid of kids) {
                kid.parent = this;
                children.push(kid);
            }
            return kids[0];
        },
        removeChild (...kids) {
            for (const kid of kids) {
                const i = children.indexOf(kid);

                if (i >= 0) {
                    children.splice(i, 1);
                }
                kid.parent = null;
            }
        },
        removeChildren () {
            children.length = 0;
        },
        destroy () {},
        updateTransform () {},
        // Pixi Graphics-ish stubs used by RenderProgress / RenderDebug
        f () {
            return this;
        },
        rect () {
            return this;
        },
        clear () {
            return this;
        },
        stroke () {
            return this;
        },
        fill () {
            return this;
        },
        circle () {
            return this;
        },
        poly () {
            return this;
        },
        moveTo () {
            return this;
        },
        lineTo () {
            return this;
        }
    };
};

/**
 * Owner fixture with Messenger + StateMap + common spatial / render fields.
 */
export const createComponentOwner = (overrides = {}) => {
    const worldContainer = createMockDisplayObject();
    const stage = createMockDisplayObject();
    const container = createMockDisplayObject();
    const owner = new Messenger();

    stage.addChild(worldContainer);

    owner.type = 'smoke-entity';
    owner.id = 'smoke-entity-0';
    owner.parent = {
        triggerEvent: vi.fn(),
        trigger: vi.fn(),
        addEntity: vi.fn(),
        removeEntity: vi.fn(),
        getEntityById: vi.fn(),
        worldWidth: 1000,
        worldHeight: 1000,
        worldContainer,
        worldCamera: {
            viewport: {left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600},
            width: 800,
            height: 600
        },
        container: worldContainer,
        stage
    };
    owner.state = StateMap.setUp({});
    owner.x = 0;
    owner.y = 0;
    owner.z = 0;
    owner.width = 32;
    owner.height = 32;
    owner.container = container;
    owner.stage = stage;
    owner.components = [];
    owner.collisionMap = [[[0, 0], [0, 1], [1, 1]]];
    owner.tileWidth = 16;
    owner.tileHeight = 16;
    owner.spriteSheet = {
        frames: [{x: 0, y: 0, w: 16, h: 16}],
        animations: {default: [0]},
        meta: {scale: 1}
    };
    owner.addComponent = (component) => {
        owner.components.push(component);
        return component;
    };
    owner.removeComponent = vi.fn();
    owner.getEntityById = vi.fn();
    owner.triggerEvent = owner.triggerEvent.bind(owner);

    Object.assign(owner, overrides);
    if (overrides.parent) {
        owner.parent = {...owner.parent, ...overrides.parent};
    }
    if (overrides.state && !(overrides.state instanceof StateMap) && typeof overrides.state.set !== 'function') {
        owner.state = StateMap.setUp(overrides.state);
    }

    return owner;
};

/**
 * Minimal per-component definition overrides for smoke construction.
 */
export const getSmokeDefinition = (componentId) => {
    switch (componentId) {
    case 'CollisionTiles':
        return {collisionMap: [[[0, 0], [1, 0], [1, 1]]]};
    case 'Mover':
        return {state: StateMap.setUp({})};
    case 'VoiceOver':
        return {voiceOverMap: {}};
    case 'RenderSpine':
        return {skeleton: 'smoke-skeleton', atlas: 'smoke-atlas'};
    case 'RenderSprite':
        return {
            spriteSheet: {
                frames: [{filename: 'a', frame: {x: 0, y: 0, w: 16, h: 16}}],
                animations: {default: {frames: [0]}},
                meta: {scale: '1'}
            },
            animation: 'default'
        };
    case 'RenderTiles':
        return {
            spriteSheet: {
                frames: [{filename: 'a', frame: {x: 0, y: 0, w: 16, h: 16}}],
                animations: {default: {frames: [0]}},
                meta: {scale: '1'}
            },
            imageMap: [[[0]]],
            tileWidth: 16,
            tileHeight: 16
        };
    case 'Render':
        return {image: null, spriteType: 'Sprite'};
    case 'HandlerCamera':
    case 'Camera':
        return {width: 400, height: 300, x: 200, y: 150, mode: 'static'};
    default:
        return {};
    }
};

/**
 * Whether an error is from a missing optional / peer dependency.
 */
export const isMissingModuleError = (error) => {
    const message = String(error && (error.message || error));

    return /Cannot find (package|module)|ERR_MODULE_NOT_FOUND|Failed to resolve|Cannot find package/i.test(message);
};
