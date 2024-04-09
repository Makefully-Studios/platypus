/**
 * This component plays music or background ambiance.
 *
 * @memberof platypus.components
 * @class AudioMusic
 * @uses platypus.Component
 */
/* global platypus */
import {arrayCache, greenSplice} from '../utils/array.js';
import TweenJS from '@tweenjs/tween.js';
import createComponentClass from '../factory.js';

const
    formatPath = (path) => {
        if (path.indexOf('.mp3') === -1) {
            return `${path}.mp3`;
        } else {
            return path;
        }
    },
    Tween = TweenJS.Tween,
    activeTracks = {}; // List of actively-playing tracks.

export default createComponentClass(/** @lends platypus.components.AudioMusic.prototype */{
    id: 'AudioMusic',
    
    properties: {
        /**
         * Use the tracks property object to handle playing tracks or new tracks to load. Here is an example audioMap object:
         *       {
         *           "audio-1": "audio-id",
         *
         *           "audio-2": {
         *               "sound": "another-audio-id",
         *               // Required. This is the audio clip to loop.
         *
         *               "volume": 0.75,
         *               // Optional. Used to specify how loud to play audio on a range from 0 (mute) to 1 (full volume). Default is 1.
         *
         *               "fade": 1000,
         *               // Optional. How long to fade to selected volume.
         * 
         *               "autoStart": true
         *               // Optional. Whether the music should play as soon as the component loads.
         *           }
         *       }
         *
         * Any tracks already playing and not defined here will fade out.
         *
         * @property tracks
         * @type Object
         * @default null
         */
        tracks: null,

        /**
         * The default fade for music track volume changes.
         * 
         * @property fade
         * @type number
         * @default 1000
         */
        fade: 1000
    },
        
    initialize: function () {
        this.player = platypus.game.musicPlayer;
        this.changeMusicTracks(this.tracks);
    },

    events: {
        'change-music-tracks': function (tracks) {
            this.changeMusicTracks(tracks);
        }
    },

    methods: {
        changeMusicTracks (tracks) {
            const
                fadeOuts = Object.keys(activeTracks),
                {fade} = this;

            if (tracks) {
                const
                    keys = Object.keys(tracks),
                    {length} = keys;

                for (let j = 0; j < length; j++) {
                    const
                        key = keys[j],
                        fadeOut = fadeOuts.indexOf(key),
                        trackProperties = tracks[key];

                    if (trackProperties.autoStart !== false) {
                        let sound = activeTracks[key],
                            tween = null,
                            trackFade = trackProperties.fade ?? fade;

                        if (fadeOut >= 0) {
                            greenSplice(fadeOuts, fadeOut);
                        } else { // gotta load it because it's not there!
                            sound = activeTracks[key] = this.player.play(trackProperties.sound || trackProperties, {
                                loop: Infinity,
                                volume: trackFade ? 0 : (typeof trackProperties.volume === 'number' ? trackProperties.volume : 1),
                                initialVolume: typeof trackProperties.volume === 'number' ? trackProperties.volume : 1
                            });
                        }

                        if (trackFade) {
                            tween = new Tween(sound);
                            tween.to({
                                volume: (typeof trackProperties.volume === 'number' ? trackProperties.volume : 1) * this.player.volume
                            }, trackFade);
                            tween.start();
                        }
                    }
                }
            }

            fadeOuts.forEach((value) => {
                const sound = activeTracks[value],
                    tween = new Tween(sound);

                tween.to({
                    volume: 0
                }, fade);
                tween.onComplete(() => {
                    this.player.stop(sound);
                    //sound.unload();
                });
                delete activeTracks[value];
                tween.start();
            });
        }
    },

    getAssetList: function (component, props, defaultProps) {
        const
            preload = arrayCache.setUp(),
            tracks = component?.tracks ?? props?.tracks ?? defaultProps?.tracks;
        
        if (tracks) {
            const
                keys = Object.keys(tracks),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    track = tracks[keys[i]],
                    item = formatPath(track.sound ?? track);

                if (preload.indexOf(item) === -1) {
                    preload.push(item);
                }
            }
        }

        return preload;
    }
});
