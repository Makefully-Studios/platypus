/**
 * Normalize timed cue tracks from jsmediatags ID3 SYLT or WebM WEBVTT results
 * into a shared shape for captions / lipsync / events.
 *
 * @module platypus/utils/timedCueTracks
 */

/**
 * @typedef {Object} TimedCue
 * @property {string} text
 * @property {number} timeStamp
 * @property {number} [end]
 */

/**
 * @typedef {Object} TimedCueTrack
 * @property {string} descriptor shortText / track name (captions, lipsync, events, …)
 * @property {string} [contentType] ID3 content type or WebM kind (lowercase)
 * @property {string} [language]
 * @property {Array.<TimedCue>} synchronisedText
 */

/**
 * @param {Object} [tagResult] jsmediatags onSuccess payload
 * @return {Array.<TimedCueTrack>}
 */
export const getTimedCueTracks = (tagResult) => {
    if (!tagResult?.tags) {
        return [];
    }

    const
        {type, tags} = tagResult;

    if (type === 'WebM' || tags.WEBVTT) {
        const
            raw = tags.WEBVTT,
            list = raw == null ? [] : (Array.isArray(raw) ? raw : [raw]);

        return list.map((frame) => {
            const
                data = frame?.data ?? frame;

            return {
                descriptor: data.name || frame?.description || '',
                contentType: String(data.kind || '').toLowerCase(),
                language: data.language,
                synchronisedText: (data.cues || []).map(({text, timeStamp, end}) => ({
                    text,
                    timeStamp,
                    end
                }))
            };
        }).filter((track) => track.synchronisedText.length);
    }

    const
        SYLT = tags.SYLT;

    if (!SYLT) {
        return [];
    }

    const
        list = Array.isArray(SYLT) ? SYLT : [SYLT];

    return list.map(({data}) => ({
        descriptor: data?.descriptor || '',
        contentType: data?.contentType,
        language: data?.language,
        synchronisedText: data?.synchronisedText || []
    })).filter((track) => track.synchronisedText.length);
};

/**
 * Prefer captions descriptor, then transcription/lyrics content types (ID3 fallbacks).
 * @param {Array.<TimedCueTrack>} tracks
 * @return {?TimedCueTrack}
 */
export const findCaptionsTrack = (tracks) => {
    if (!tracks?.length) {
        return null;
    }

    return tracks.find(({descriptor}) => descriptor === 'captions' || descriptor === 'words')
        ?? tracks.find(({contentType}) => contentType === 'transcription' || contentType === 'captions')
        ?? tracks.find(({contentType}) => contentType === 'lyrics' || contentType === 'subtitles')
        ?? null;
};
