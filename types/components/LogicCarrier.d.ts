import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicCarrier.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicCarrierContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "carry-me": { entity: unknown };
    "load": unknown;
    "release-me": { entity: unknown };
    };
    componentProps: {
        // none
    };
}

export type LogicCarrierProps = LogicCarrierContribution['props'];
export type LogicCarrierEvents = LogicCarrierContribution['events'];
