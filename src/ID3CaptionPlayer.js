import {CaptionFactory, CaptionPlayer, HtmlRenderer} from 'springroll';
import {getAudioTags} from './utils/audioTags.js';
import {findCaptionsTrack, getTimedCueTracks} from './utils/timedCueTracks.js';

const
    nullCaption = [{
        content: "Prevent empty captions error.",
        start: 0,
        end: 1
    }],
    findAndFormatCaptionsFromTags = (tagResult, length) => {
        const
            captionsTrack = findCaptionsTrack(getTimedCueTracks(tagResult));

        if (captionsTrack) {
            return CaptionFactory.createCaption(captionsTrack.synchronisedText.map(({text: content, timeStamp: start, end}, index, arr) => {
                const
                    next = arr[index + 1];

                return {
                    content,
                    start: Math.max(start, 0.001), // Prevents CaptionPlayer from playing caption before the audio is loaded/playing.
                    end: end ?? (next ? next.timeStamp : length)
                };
            }));
        }

        return null;
    },
    ID3CaptionPlayer = class extends CaptionPlayer {
        constructor (captions = {nullCaption}, captionsElement, useCachedTags = false) {
            super(captions, new HtmlRenderer(captionsElement));

            if (useCachedTags) {
                this.getCaption = (audio, audioId) => {
                    const
                        tagResult = getAudioTags(audioId);

                    return tagResult ? findAndFormatCaptionsFromTags(tagResult, (audio.duration * 1000) >> 0) : null;
                };
            }
        }

        async start (audio, audioId, ...args) {
            if (this.getCaption && typeof this.captions[audioId] === 'undefined') {
                try {
                    this.captions[audioId] = this.getCaption(audio, audioId);
                } catch (e) {
                    this.captions[audioId] = null;
                    platypus.debug.warn(e.type, e.info);
                }
            }
            super.start(this.captions[audioId] ? audioId : (audio.url || audioId), ...args);
        }
    };

export default ID3CaptionPlayer;
