import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for AudioVO.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface AudioVOContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "handle-render": unknown;
    "play-voice-over": unknown;
    "stop-audio": unknown;
    };
    componentProps: {
    audioMap?: unknown;
    interrupt?: unknown;
    preloadAudio?: unknown;
    };
}

export type AudioVOProps = AudioVOContribution['props'];
export type AudioVOEvents = AudioVOContribution['events'];
