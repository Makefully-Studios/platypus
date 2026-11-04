import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicPortal.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicPortalContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "activate-portal": unknown;
    "handle-logic": unknown;
    "occupied-portal": unknown;
    };
    componentProps: {
        // none
    };
}

export type LogicPortalProps = LogicPortalContribution['props'];
export type LogicPortalEvents = LogicPortalContribution['events'];
