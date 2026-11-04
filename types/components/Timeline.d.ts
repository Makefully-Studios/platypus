import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Timeline.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface TimelineContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
    wait?: (...args: never[]) => unknown;
    };
    events: {
    "add-timeline": unknown;
    "handle-logic": unknown;
    "pause-timelines": unknown;
    "play-timelines": unknown;
    "start-timeline": unknown;
    "stop-active-timelines": unknown;
    "stop-all-timelines": unknown;
    };
    componentProps: {
    executionFlow?: unknown;
    timelines?: unknown;
    };
}

export type TimelineProps = TimelineContribution['props'];
export type TimelineEvents = TimelineContribution['events'];
