import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for CollisionFilter.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface CollisionFilterContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
        // none
    };
    componentProps: {
    collisions?: unknown;
    state?: unknown;
    };
}

export type CollisionFilterProps = CollisionFilterContribution['props'];
export type CollisionFilterEvents = CollisionFilterContribution['events'];
