import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for HandlerController.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface HandlerControllerContribution extends ComponentContribution {
    props: {
    inputPrecedence?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "blur-control": unknown;
    "invalid-input": unknown;
    "valid-input": unknown;
    };
    componentProps: {
    enableDefaultEvents?: unknown;
    upOnBlur?: unknown;
    useHandleLogic?: unknown;
    };
}

export type HandlerControllerProps = HandlerControllerContribution['props'];
export type HandlerControllerEvents = HandlerControllerContribution['events'];
