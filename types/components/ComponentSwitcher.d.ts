import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for ComponentSwitcher.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface ComponentSwitcherContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "prepare-logic": unknown;
    };
    componentProps: {
    componentMap?: unknown;
    };
}

export type ComponentSwitcherProps = ComponentSwitcherContribution['props'];
export type ComponentSwitcherEvents = ComponentSwitcherContribution['events'];
