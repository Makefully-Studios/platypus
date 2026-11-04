import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for AudioMusic.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface AudioMusicContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "change-music-tracks": unknown;
    };
    componentProps: {
    fade?: unknown;
    tracks?: unknown;
    };
}

export type AudioMusicProps = AudioMusicContribution['props'];
export type AudioMusicEvents = AudioMusicContribution['events'];
