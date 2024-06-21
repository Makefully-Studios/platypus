import {CaptionFactory, CaptionPlayer, TextRenderer} from 'springroll';

const
    nullCaption = [{
        content: "Prevent empty captions error.",
        start: 0,
        end: 1
    }],
    findAndFormatCaptionsFromTags = ({tags}, length) => {
        const
            {SYLT} = tags;

        if (SYLT) {
            const
                list = Array.isArray(SYLT) ? SYLT : [SYLT],
                captionsSYLT = list.filter(({data}) => data.descriptor === 'captions')[0] ?? list.filter(({data}) => data.contentType === 'transcription')[0] ?? list.filter(({data}) => data.contentType === 'lyrics')[0] ?? null;

            if (captionsSYLT) {
                return CaptionFactory.createCaption(captionsSYLT.data.synchronisedText.map(({text: content, timeStamp: start}, index, arr) => {
                    const
                        next = arr[index + 1];

                    return {
                        content,
                        start,
                        end: next ? next.timeStamp : length
                    };
                }));
            }
        }

        return null;
    },
    ID3CaptionPlayer = class extends CaptionPlayer {
        constructor (captions = {nullCaption}, captionsElement, tagReader = null) {
            super(captions, new TextRenderer(captionsElement));

            if (tagReader) {
                this.getCaption = (audio) => new Promise((resolve, reject) => {
                    tagReader.read(audio.url, {
                        onSuccess: (tags) => resolve(findAndFormatCaptionsFromTags(tags, (audio.duration * 1000) >> 0)),
                        onError: reject
                    });
                });
            }
        }

        async start (audio, audioId, ...args) {
            if (this.getCaption && typeof this.captions[audioId] === 'undefined') {
                try {
                    this.captions[audioId] = await this.getCaption(audio);
                } catch (e) {
                    this.captions[audioId] = null;
                    platypus.debug.warn(e.type, e.info);
                }
            }
            super.start(audioId, ...args);
        }
    };

export default ID3CaptionPlayer;