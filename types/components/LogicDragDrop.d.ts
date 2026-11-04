import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicDragDrop.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicDragDropContribution extends ComponentContribution {
    props: {
    stayInViewport?: unknown;
    stickyClick?: unknown;
    };
    methods: {
        // none
    };
    events: {
    "camera-update": unknown;
    "disable-drag": unknown;
    "handle-logic": unknown;
    "input-off": unknown;
    "pointerdown": unknown;
    "pointermove": unknown;
    "prepare-logic": unknown;
    "pressmove": unknown;
    "pressup": unknown;
    };
    componentProps: {
    dragDisabled?: unknown;
    stickiness?: unknown;
    };
}

export type LogicDragDropProps = LogicDragDropContribution['props'];
export type LogicDragDropEvents = LogicDragDropContribution['events'];
