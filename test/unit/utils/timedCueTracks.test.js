import {describe, expect, it} from 'vitest';
import {findCaptionsTrack, getTimedCueTracks} from '../../../src/utils/timedCueTracks.js';

describe('timedCueTracks', () => {
    it('normalizes ID3 SYLT frames', () => {
        const tracks = getTimedCueTracks({
            type: 'ID3',
            tags: {
                SYLT: {
                    data: {
                        descriptor: 'captions',
                        contentType: 'transcription',
                        language: 'eng',
                        synchronisedText: [{text: 'Hi', timeStamp: 0}]
                    }
                }
            }
        });

        expect(tracks).toHaveLength(1);
        expect(tracks[0].descriptor).toBe('captions');
        expect(findCaptionsTrack(tracks)?.synchronisedText[0].text).toBe('Hi');
    });

    it('normalizes WebM WEBVTT frames', () => {
        const tracks = getTimedCueTracks({
            type: 'WebM',
            tags: {
                WEBVTT: [{
                    id: 'WEBVTT',
                    description: 'lipsync',
                    data: {
                        kind: 'METADATA',
                        name: 'lipsync',
                        language: 'eng',
                        cues: [{text: 'A', timeStamp: 10}]
                    }
                }, {
                    id: 'WEBVTT',
                    description: 'captions',
                    data: {
                        kind: 'CAPTIONS',
                        name: 'captions',
                        cues: [{text: 'Hello', timeStamp: 0, end: 500}]
                    }
                }]
            }
        });

        expect(tracks.map((t) => t.descriptor)).toEqual(['lipsync', 'captions']);
        expect(findCaptionsTrack(tracks)?.descriptor).toBe('captions');
    });
});
