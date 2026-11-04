import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RelayFamily.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RelayFamilyContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "entity-created": unknown;
    "link-family": unknown;
    };
    componentProps: {
    events?: unknown;
    };
}

export type RelayFamilyProps = RelayFamilyContribution['props'];
export type RelayFamilyEvents = RelayFamilyContribution['events'];
