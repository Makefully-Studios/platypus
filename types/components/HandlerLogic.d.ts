import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for HandlerLogic.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface HandlerLogicContribution extends ComponentContribution {
    props: {
    buffer?: unknown;
    maxStepsPerTick?: unknown;
    stepLength?: unknown;
    timeMultiplier?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "camera-update": unknown;
    "child-entity-added": unknown;
    "child-entity-removed": unknown;
    "child-entity-updated": unknown;
    "pause-logic": unknown;
    "tick": unknown;
    "unpause-logic": unknown;
    };
    componentProps: {
    alwaysOn?: unknown;
    };
}

export type HandlerLogicProps = HandlerLogicContribution['props'];
export type HandlerLogicEvents = HandlerLogicContribution['events'];
