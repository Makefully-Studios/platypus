import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for LogicPortable.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface LogicPortableContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "collide-off": unknown;
    "force-release": unknown;
    "handle-logic": unknown;
    "hit-solid": unknown;
    "carry-me": { entity: unknown };
    "release-me": { entity: unknown };
    };
    componentProps: {
    portableDirections?: unknown;
    };
}

export type LogicPortableProps = LogicPortableContribution['props'];
export type LogicPortableEvents = LogicPortableContribution['events'];
