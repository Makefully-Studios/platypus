import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for AIPacer.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface AIPacerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-ai": unknown;
    "turn-around": unknown;
    'go-up': unknown;
    'go-down': unknown;
    'go-left': unknown;
    'go-right': unknown;
    };
    componentProps: {
    direction?: unknown;
    movement?: unknown;
    };
}

export type AIPacerProps = AIPacerContribution['props'];
export type AIPacerEvents = AIPacerContribution['events'];
