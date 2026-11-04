/**
 * Load a sound from a URL as an ArrayBuffer, optionally reading media tags
 * before WebAudio decode (so ID3 does not require a second fetch or a retained Blob).
 *
 * @module platypus/utils/loadSoundAsset
 */
/* global platypus */
import {DOMAdapter} from 'pixi.js';
import {Sound, sound} from '@pixi/sound';
import {readTags, setAudioTags} from './audioTags.js';

const AUDIO_EXT = /\.(ogg|oga|opus|m4a|mp3|mpeg|wav|aiff|wma|mid|caf|webm|weba)(\?.*)?$/i;

/**
 * @param {string} src
 * @return {boolean}
 */
export const isAudioSrc = (src) => typeof src === 'string' && AUDIO_EXT.test(src);

/**
 * @param {Object} options
 * @param {string} options.alias
 * @param {string} options.src
 * @param {{read: Function}|null} [options.tagReader]
 * @return {Promise<import('@pixi/sound').Sound>}
 */
export const loadSoundAsset = async ({alias, src, tagReader = null}) => {
    const
        response = await DOMAdapter.get().fetch(src),
        data = await response.arrayBuffer();

    if (tagReader) {
        try {
            setAudioTags(alias, await readTags(tagReader, data));
        } catch (e) {
            setAudioTags(alias, null);
            if (typeof platypus !== 'undefined') {
                platypus.debug.warn(e.type ?? 'Audio tag read failed', e.info ?? e);
            }
        }
    }

    const snd = await new Promise((resolve, reject) => {
        Sound.from({
            source: data,
            preload: true,
            loaded: (err, instance) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(instance);
                }
            }
        });
    });

    if (sound.exists(alias)) {
        sound.remove(alias);
    }
    sound.add(alias, snd);

    return snd;
};
