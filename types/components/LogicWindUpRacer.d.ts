import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicWindUpRacer.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicWindUpRacerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "hit-solid": unknown;
    "stop-racing": unknown;
    "wind-up": unknown;
    };
    componentProps: {
    raceTime?: unknown;
    speed?: unknown;
    windTime?: unknown;
    };
}

export type LogicWindUpRacerProps = LogicWindUpRacerContribution['props'];
export type LogicWindUpRacerEvents = LogicWindUpRacerContribution['events'];
