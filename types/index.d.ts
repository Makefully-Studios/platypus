import type { PlatypusNamespace } from './core';

export type {
    ComponentContribution,
    Entity,
    EntityBase,
    EntityLifecycleEvents,
    EntityOf,
    EventMapOf,
    MergeEvents,
    MergeMethods,
    MergeProps,
    TypedMessenger
} from './entity-of';

export type {
    BuiltinComponentId,
    ComponentRegistry
} from './components/registry';

export type * from './components/index';

export type {
    ComponentClass,
    ComponentInstance,
    ComponentMeta,
    CreateComponentClass,
    DefineEntityResult,
    PlatypusNamespace
} from './core';

export {
    defineEntity
} from './defineEntity';

export type {
    EntityDefinition,
    EntityFromDefinition
} from './defineEntity';

/**
 * Ambient typings for the Platypus runtime package.
 * Runtime values still come from src/index.js / lib/platypus.js.
 */
declare const platypus: PlatypusNamespace;

export default platypus;

declare global {
    // eslint-disable-next-line no-var
    var platypus: PlatypusNamespace;

    namespace platypus {
        type Entity = import('./entity-of').Entity;
        type EntityOf<Ids extends keyof import('./components/registry').ComponentRegistry> =
            import('./entity-of').EntityOf<Ids>;
    }
}
