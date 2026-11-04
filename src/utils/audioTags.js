/**
 * Cache of ID3 (and similar) tag read results keyed by asset alias.
 * Populated when audio is loaded with a tag reader before WebAudio decode.
 *
 * @module platypus/utils/audioTags
 */

const tagsByAlias = new Map();

/**
 * @param {string} alias
 * @param {Object|null} tagResult jsmediatags onSuccess payload (or null on failure / no tags)
 */
export const setAudioTags = (alias, tagResult) => {
    tagsByAlias.set(alias, tagResult);
};

/**
 * @param {string} alias
 * @return {Object|null}
 */
export const getAudioTags = (alias) => tagsByAlias.has(alias) ? tagsByAlias.get(alias) : null;

/**
 * @param {string} alias
 */
export const clearAudioTags = (alias) => {
    tagsByAlias.delete(alias);
};

/**
 * @param {Object} tagReader jsmediatags-compatible reader with a `read` method
 * @param {ArrayBuffer|Blob|string} data
 * @return {Promise} Resolves to the jsmediatags tag result object
 */
export const readTags = (tagReader, data) => new Promise((resolve, reject) => {
    tagReader.read(data, {
        onSuccess: resolve,
        onError: reject
    });
});
