import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for Tutorial.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface TutorialContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "child-entity-added": unknown;
    "child-entity-removed": unknown;
    "handle-logic": unknown;
    "peer-entity-added": unknown;
    "peer-entity-removed": unknown;
    "sequence-complete": unknown;
    };
    componentProps: {
    tutorialDefs?: unknown;
    };
}

export type TutorialProps = TutorialContribution['props'];
export type TutorialEvents = TutorialContribution['events'];
