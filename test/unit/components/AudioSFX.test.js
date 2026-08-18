import {beforeEach, describe, expect, it, vi} from 'vitest';
import Messenger from '../../../src/Messenger.js';

vi.mock('@pixi/sound', () => {
    class StereoFilter {
        constructor (pan = 0) {
            this.pan = pan;
            this.destroyed = false;
        }

        destroy () {
            this.destroyed = true;
        }
    }

    return {
        Sound: {
            on: vi.fn(),
            off: vi.fn()
        },
        filters: {
            StereoFilter
        }
    };
});

import AudioSFX from '../../../src/components/AudioSFX.js';

const
    createSound = () => ({
        filters: null,
        play (data) {
            const
                clip = {
                    volume: data.volume,
                    speed: 1,
                    filters: data.filters,
                    on (event, handler) {
                        this.handlers = this.handlers || {};
                        this.handlers[event] = handler;
                        return this;
                    },
                    set: vi.fn()
                };

            return clip;
        }
    }),
    createOwner = (x = 0) => {
        const
            owner = new Messenger();

        owner.x = x;
        owner.state = {
            includes: () => false
        };

        return owner;
    };

describe('AudioSFX pan instances', () => {
    let sound = null;

    beforeEach(() => {
        sound = createSound();
        globalThis.platypus = {
            debug: {
                warn: vi.fn()
            },
            assetCache: {
                getFileId: (id) => id,
                get: () => sound
            },
            game: {
                sfxPlayer: {
                    volume: 1,
                    play (asset, data) {
                        return asset.play(data);
                    },
                    stop: vi.fn()
                }
            }
        };
    });

    it('applies pan to each playing instance instead of the shared sound asset', () => {
        const
            left = new AudioSFX(createOwner(), {
                audioMap: {
                    'play-sfx': 'bounce'
                }
            }),
            right = new AudioSFX(createOwner(), {
                audioMap: {
                    'play-sfx': 'bounce'
                }
            });

        left.owner.triggerEvent('play-sfx', {pan: -0.8});
        right.owner.triggerEvent('play-sfx', {pan: 0.6});

        const
            leftClip = left.activeAudioClips[0],
            rightClip = right.activeAudioClips[0];

        expect(sound.filters).toBeNull();
        expect(leftClip.panFilter).not.toBe(rightClip.panFilter);
        expect(leftClip.panFilter.pan).toBe(-0.8);
        expect(rightClip.panFilter.pan).toBe(0.6);
        expect(leftClip.filters[0]).toBe(leftClip.panFilter);
        expect(rightClip.filters[0]).toBe(rightClip.panFilter);
    });

    it('updates every active instance when autoPan follows the camera', () => {
        const
            owner = createOwner(200),
            sfx = new AudioSFX(owner, {
                autoPan: {
                    range: 200,
                    buffer: 0
                },
                audioMap: {
                    'play-sfx': 'bounce'
                }
            });

        owner.triggerEvent('play-sfx');
        owner.triggerEvent('play-sfx');
        owner.triggerEvent('camera-update', {
            viewport: {
                x: 0,
                width: 400
            }
        });

        const
            [first, second] = sfx.activeAudioClips;

        expect(first.panFilter).not.toBe(second.panFilter);
        expect(first.panFilter.pan).toBe(1);
        expect(second.panFilter.pan).toBe(1);
        expect(sound.filters).toBeNull();
    });

    it('updates instance pan filters from set-pan', () => {
        const
            sfx = new AudioSFX(createOwner(), {
                audioMap: {
                    'play-sfx': 'bounce'
                }
            });

        sfx.owner.triggerEvent('play-sfx', {pan: -0.2});
        sfx.owner.triggerEvent('set-pan', 0.4);

        expect(sfx.activeAudioClips[0].panFilter.pan).toBe(0.4);
    });

    it('destroys the instance pan filter when the clip ends', () => {
        const
            sfx = new AudioSFX(createOwner(), {
                audioMap: {
                    'play-sfx': 'bounce'
                }
            });

        sfx.owner.triggerEvent('play-sfx', {pan: 0.5});

        const
            clip = sfx.activeAudioClips[0],
            panFilter = clip.panFilter;

        clip.handlers.end();

        expect(panFilter.destroyed).toBe(true);
        expect(sfx.activeAudioClips.length).toBe(0);
    });
});
