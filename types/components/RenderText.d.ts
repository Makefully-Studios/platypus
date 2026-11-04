import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for RenderText.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface RenderTextContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "set-text": unknown;
    };
    componentProps: {
    offsetX?: unknown;
    offsetY?: unknown;
    offsetZ?: unknown;
    style?: unknown;
    text?: unknown;
    };
}

export type RenderTextProps = RenderTextContribution['props'];
export type RenderTextEvents = RenderTextContribution['events'];
