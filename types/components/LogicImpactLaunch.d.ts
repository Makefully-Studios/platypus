import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicImpactLaunch.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicImpactLaunchContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "component-added": unknown;
    "handle-logic": unknown;
    "hit-solid": unknown;
    "impact-launch": unknown;
    };
    componentProps: {
    accelerationX?: unknown;
    accelerationY?: unknown;
    flipX?: unknown;
    flipY?: unknown;
    state?: unknown;
    };
}

export type LogicImpactLaunchProps = LogicImpactLaunchContribution['props'];
export type LogicImpactLaunchEvents = LogicImpactLaunchContribution['events'];
