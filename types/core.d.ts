import type { Entity, EntityOf } from './entity-of';
import type { ComponentRegistry } from './components/registry';

export interface ComponentMeta {
    properties: string[];
    publicProperties: string[];
    publicMethods: string[];
    methods: string[];
    events: string[];
    hasGetAssetList: boolean;
}

export interface ComponentClass<TOwner = Entity> {
    new (owner: TOwner, definition?: object, callback?: (value?: unknown) => void): ComponentInstance;
    componentId?: string;
    componentMeta?: ComponentMeta;
    getAssetList?: (...args: unknown[]) => unknown[];
}

export interface ComponentInstance {
    type: string;
    owner: Entity;
    id: string;
    initialize?(definition?: object, callback?: (value?: unknown) => void): boolean | void;
    destroy(): void;
    toJSON?(propertiesDefinition?: object, debug?: boolean): object | null;
    toString(): string;
    addEventListener(event: string, callback: (...args: unknown[]) => void, priority?: number): unknown;
    removeEventListener(event: string, callback?: (...args: unknown[]) => void): void;
    addMethod?(name: string, method: (...args: unknown[]) => unknown): void;
    removeMethod?(name: string): void;
}

export interface CreateComponentClass {
    (componentDefinition?: object): ComponentClass;
}

export interface DefineEntityResult<Ids extends keyof ComponentRegistry = keyof ComponentRegistry> {
    id?: string;
    type?: string;
    components?: Array<{ type: Ids | string; [key: string]: unknown }>;
    properties?: Record<string, unknown>;
    preload?: unknown[];
    [key: string]: unknown;
}

export interface PlatypusNamespace {
    createComponentClass: CreateComponentClass;
    components: Record<string, ComponentClass>;
    supports?: Record<string, boolean>;
    version?: string;
    debug?: {
        warn: (...args: unknown[]) => void;
        log: (...args: unknown[]) => void;
        olive?: (...args: unknown[]) => void;
    };
    game?: unknown;
    assetCache?: unknown;
    [key: string]: unknown;
}

export type { Entity, EntityOf, ComponentRegistry };
