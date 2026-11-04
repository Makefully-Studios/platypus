import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RelayParent.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RelayParentContribution extends ComponentContribution {
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
    events?: unknown;
    };
}

export type RelayParentProps = RelayParentContribution['props'];
export type RelayParentEvents = RelayParentContribution['events'];
