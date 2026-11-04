import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for AIChaser.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface AIChaserContribution extends ComponentContribution {
    props: {
    speed?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "handle-ai": unknown;
    "load": unknown;
    "set-target": unknown;
    "set-target-offset": unknown;
    "start-chasing": unknown;
    "stop-chasing": unknown;
    };
    componentProps: {
    accelerate?: unknown;
    chasing?: unknown;
    };
}

export type AIChaserProps = AIChaserContribution['props'];
export type AIChaserEvents = AIChaserContribution['events'];
