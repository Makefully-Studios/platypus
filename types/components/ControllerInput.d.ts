import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for ControllerInput.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface ControllerInputContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
        // none
    };
    componentProps: {
    code?: unknown;
    controllerType?: unknown;
    };
}

export type ControllerInputProps = ControllerInputContribution['props'];
export type ControllerInputEvents = ControllerInputContribution['events'];
