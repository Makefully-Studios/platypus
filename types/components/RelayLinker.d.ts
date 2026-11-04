import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RelayLinker.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RelayLinkerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "load": unknown;
    };
    componentProps: {
    events?: unknown;
    linkId?: unknown;
    };
}

export type RelayLinkerProps = RelayLinkerContribution['props'];
export type RelayLinkerEvents = RelayLinkerContribution['events'];
