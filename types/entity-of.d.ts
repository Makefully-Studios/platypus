import type { ComponentRegistry } from './components/registry';

/**
 * Shape each component contributes to its owning entity.
 * Games may author custom contributions and merge them into ComponentRegistry.
 */
export interface ComponentContribution {
    props?: object;
    methods?: object;
    events?: object;
    componentProps?: object;
}

type UnionToIntersection<U> =
    (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type ContributionOf<Id extends keyof ComponentRegistry> = ComponentRegistry[Id];

export type MergeProps<Ids extends keyof ComponentRegistry> =
    UnionToIntersection<ContributionOf<Ids>['props']>;

export type MergeMethods<Ids extends keyof ComponentRegistry> =
    UnionToIntersection<ContributionOf<Ids>['methods']>;

export type MergeEvents<Ids extends keyof ComponentRegistry> =
    UnionToIntersection<ContributionOf<Ids>['events']>;

export type EventMapOf<Ids extends keyof ComponentRegistry> =
    MergeEvents<Ids> & EntityLifecycleEvents;

/** Built-in entity lifecycle / peer-component events. */
export interface EntityLifecycleEvents {
    load: unknown;
    'component-added': unknown;
    'component-removed': unknown;
    'set-property': Record<string, unknown>;
    'child-entity-updated': unknown;
    'add-remove-component-complete': unknown;
}

/** Strict messenger: event names must be keys of Events. */
export interface TypedMessenger<Events extends object> {
    on<K extends keyof Events & string>(
        name: K,
        callback: (message: Events[K], ...rest: unknown[]) => void,
        context?: object | null,
        once?: boolean,
        priority?: number
    ): unknown;

    off(
        name?: keyof Events & string,
        callback?: (...args: unknown[]) => void,
        context?: object
    ): void;

    trigger<K extends keyof Events & string>(event: K, message?: Events[K], debug?: boolean): number;
    trigger(events: Array<keyof Events & string>, message?: unknown, debug?: boolean): number;
    trigger(
        events: { event: keyof Events & string; message?: unknown; debug?: boolean },
        message?: unknown,
        debug?: boolean
    ): number;

    triggerEvent<K extends keyof Events & string>(
        event: K,
        message?: Events[K],
        debug?: boolean
    ): number;
}

/** Loose messenger used by the wide Entity bag. */
export interface LooseMessenger {
    on(
        name: string,
        callback: (...args: unknown[]) => void,
        context?: object | null,
        once?: boolean,
        priority?: number
    ): unknown;
    off(name?: string, callback?: (...args: unknown[]) => void, context?: object): void;
    trigger(events: string | string[] | { event: string; message?: unknown; debug?: boolean }, message?: unknown, debug?: boolean): number;
    triggerEvent(event: string, message?: unknown, debug?: boolean): number;
}

/**
 * Base entity surface shared by all compositions (without messenger methods).
 * Index signature kept for this milestone so JSON `properties` bags stay assignable.
 * Next major may remove it in favor of EntityOf<Ids, Props>.
 */
export interface EntityBase {
    id: string;
    type: string;
    components: unknown[];
    state: unknown;
    lastState: unknown;
    parent?: unknown;
    loadingComponents?: Promise<void> | null;
    x?: number;
    y?: number;
    z?: number;
    width?: number;
    height?: number;

    addComponent(component: unknown): unknown;
    removeComponent(component: unknown): unknown;
    getComponentById(componentId: string): unknown;
    getComponentsByType(componentType: string): unknown[];
    get(path: string): unknown;
    setProperty(properties: Record<string, unknown>): void;
    destroy(): void;
    toJSON(includeComponents?: boolean): object;
    toString(): string;

    /** Open bag for JSON instance properties (non-breaking this milestone). */
    [key: string]: unknown;
}

/**
 * Entity composed from the listed component registry ids.
 */
export type EntityOf<Ids extends keyof ComponentRegistry = keyof ComponentRegistry> =
    EntityBase
    & MergeProps<Ids>
    & MergeMethods<Ids>
    & TypedMessenger<EventMapOf<Ids>>;

/** Wide entity used when composition is unknown (default export surface). */
export type Entity = EntityBase & LooseMessenger & MergeProps<keyof ComponentRegistry> & MergeMethods<keyof ComponentRegistry>;
