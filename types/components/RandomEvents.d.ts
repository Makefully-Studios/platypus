import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RandomEvents.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RandomEventsContribution extends ComponentContribution {
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
    trueRandom?: unknown;
    };
}

export type RandomEventsProps = RandomEventsContribution['props'];
export type RandomEventsEvents = RandomEventsContribution['events'];
