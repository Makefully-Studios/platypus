import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for AudioSFX.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface AudioSFXContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-render": unknown;
    "mute-audio": unknown;
    "pause-audio": unknown;
    "set-pan": unknown;
    "set-speed": unknown;
    "set-volume": unknown;
    "state-changed": unknown;
    "stop-audio": unknown;
    "toggle-mute": unknown;
    "unmute-audio": unknown;
    "unpause-audio": unknown;
    };
    componentProps: {
    audioMap?: unknown;
    autoPan?: unknown;
    eventBased?: unknown;
    forcePlayThrough?: unknown;
    stateBased?: unknown;
    };
}

export type AudioSFXProps = AudioSFXContribution['props'];
export type AudioSFXEvents = AudioSFXContribution['events'];
