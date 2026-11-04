import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for VoiceOver.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface VoiceOverContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "play-voice-over-with-lip-sync": unknown;
    [event: string]: unknown;
    };
    componentProps: {
    acceptInput?: unknown;
    aliases?: unknown;
    animation?: unknown;
    animationMap?: unknown;
    flip?: unknown;
    frameLength?: unknown;
    generatedVoiceOverMaps?: unknown;
    hidden?: unknown;
    interactive?: unknown;
    mask?: unknown;
    messagePrefix?: unknown;
    mirror?: unknown;
    offsetZ?: unknown;
    regX?: unknown;
    regY?: unknown;
    renderComponent?: unknown;
    restart?: unknown;
    scaleX?: unknown;
    scaleY?: unknown;
    spriteSheet?: unknown;
    stateBased?: unknown;
    voiceOverMap?: unknown;
    };
}

export type VoiceOverProps = VoiceOverContribution['props'];
export type VoiceOverEvents = VoiceOverContribution['events'];
