import type { ComponentRegistry } from './components/registry';
import type { EntityOf } from './entity-of';

type ComponentDefType<T> = T extends { type: infer Id }
    ? Id extends keyof ComponentRegistry
        ? Id
        : never
    : never;

type IdsFromComponents<C> = C extends readonly (infer Item)[]
    ? ComponentDefType<Item>
    : never;

export interface EntityDefinition<
    Ids extends keyof ComponentRegistry = keyof ComponentRegistry
> {
    id?: string;
    type?: string;
    components?: Array<{ type: Ids | (string & {}); [key: string]: unknown }>;
    properties?: Record<string, unknown>;
    preload?: unknown[];
    [key: string]: unknown;
}

/**
 * Identity helper that preserves literal component `type` fields for EntityOf inference.
 */
export declare function defineEntity<
    const D extends EntityDefinition
>(definition: D): D & {
    __entityType?: EntityOf<IdsFromComponents<D['components']> & keyof ComponentRegistry>;
};

export type EntityFromDefinition<D> = D extends { __entityType?: infer E }
    ? E
    : D extends EntityDefinition<infer Ids>
        ? EntityOf<Ids>
        : EntityOf;
