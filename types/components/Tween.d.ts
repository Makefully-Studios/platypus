import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Tween.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface TweenContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-logic": unknown;
    "pause-tween": unknown;
    "stop-tween": unknown;
    "tween": unknown;
    "unpause-tween": unknown;
    };
    componentProps: {
    events?: unknown;
    };
}

export type TweenProps = TweenContribution['props'];
export type TweenEvents = TweenContribution['events'];
