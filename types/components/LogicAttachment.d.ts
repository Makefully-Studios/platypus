import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicAttachment.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicAttachmentContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "attach": unknown;
    "change-attachment-offset": unknown;
    "detach": unknown;
    "handle-logic": unknown;
    };
    componentProps: {
    attachState?: unknown;
    attachment?: unknown;
    events?: unknown;
    offsetX?: unknown;
    offsetY?: unknown;
    offsetZ?: unknown;
    startAttached?: unknown;
    updateProperties?: unknown;
    };
}

export type LogicAttachmentProps = LogicAttachmentContribution['props'];
export type LogicAttachmentEvents = LogicAttachmentContribution['events'];
