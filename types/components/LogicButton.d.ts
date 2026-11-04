import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicButton.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicButtonContribution extends ComponentContribution {
    props: {
    bottom?: unknown;
    left?: unknown;
    right?: unknown;
    top?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "camera-update": unknown;
    "disable": unknown;
    "enable": unknown;
    "handle-logic": unknown;
    "highlight": unknown;
    "pointerdown": unknown;
    "pointerout": unknown;
    "pointerover": unknown;
    "pressup": unknown;
    "toggle-disabled": unknown;
    "toggle-highlight": unknown;
    "unhighlight": unknown;
    };
    componentProps: {
    baton?: unknown;
    disabled?: unknown;
    onCancel?: unknown;
    onHover?: unknown;
    onPress?: unknown;
    onRelease?: unknown;
    pressed?: unknown;
    toggle?: unknown;
    useOnce?: unknown;
    validParentState?: unknown;
    validState?: unknown;
    };
}

export type LogicButtonProps = LogicButtonContribution['props'];
export type LogicButtonEvents = LogicButtonContribution['events'];
