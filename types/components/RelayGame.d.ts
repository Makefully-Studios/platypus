import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RelayGame.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RelayGameContribution extends ComponentContribution {
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

export type RelayGameProps = RelayGameContribution['props'];
export type RelayGameEvents = RelayGameContribution['events'];
