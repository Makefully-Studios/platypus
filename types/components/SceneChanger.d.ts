import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for SceneChanger.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface SceneChangerContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "new-scene": unknown;
    "set-persistent-scene-data": unknown;
    "set-scene": unknown;
    };
    componentProps: {
    loadLayers?: unknown;
    persistentData?: unknown;
    scene?: unknown;
    unloadLayers?: unknown;
    };
}

export type SceneChangerProps = SceneChangerContribution['props'];
export type SceneChangerEvents = SceneChangerContribution['events'];
