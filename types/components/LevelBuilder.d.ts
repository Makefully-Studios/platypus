import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LevelBuilder.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LevelBuilderContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
    mergeLevels?: (...args: never[]) => unknown;
    };
    events: {
    "layer-loaded": unknown;
    };
    componentProps: {
    levelPieces?: unknown;
    levelTemplate?: unknown;
    useUniques?: unknown;
    };
}

export type LevelBuilderProps = LevelBuilderContribution['props'];
export type LevelBuilderEvents = LevelBuilderContribution['events'];
