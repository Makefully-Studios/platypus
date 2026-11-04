import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for EntityContainer.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface EntityContainerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
    addEntity?: (...args: never[]) => unknown;
    getEntitiesByType?: (...args: never[]) => unknown;
    getEntityById?: (...args: never[]) => unknown;
    removeEntity?: (...args: never[]) => unknown;
    triggerEventOnChildren?: (...args: never[]) => unknown;
    triggerOnChildren?: (...args: never[]) => unknown;
    };
    events: {
    "add-entity": unknown;
    "child-entity-updated": unknown;
    "handle-logic": unknown;
    "remove-entity": unknown;
    };
    componentProps: {
    childEvents?: unknown;
    };
}

export type EntityContainerProps = EntityContainerContribution['props'];
export type EntityContainerEvents = EntityContainerContribution['events'];
