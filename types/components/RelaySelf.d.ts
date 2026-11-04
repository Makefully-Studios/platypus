import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RelaySelf.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RelaySelfContribution extends ComponentContribution {
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

export type RelaySelfProps = RelaySelfContribution['props'];
export type RelaySelfEvents = RelaySelfContribution['events'];
