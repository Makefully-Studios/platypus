/*global platypus */
import Data from '../Data.js';
import {arrayCache} from '../utils/array.js';
import createComponentClass from '../factory.js';
import TimeEventList from '../TimeEventList.js';

const
    formatPath = (path) => {
        if (path.indexOf('.mp3') === -1) {
            return `${path}.mp3`;
        } else {
            return path;
        }
    };

export default createComponentClass(/** @lends platypus.components.AudioVO.prototype */{
    id: 'AudioVO',
    
    properties: {
        /**
         * Use the audioMap property object to map messages triggered with audio clips to play. At least one audio mapping should be included for audio to play. Here is an example audioMap object:
         *
         *       {
         *           "message-triggered": "audio-id",
         *           // This simple form is useful to listen for "message-triggered" and play "audio-id" using default audio properties.
         *
         *           "another-message": {
         *           // To specify audio properties, instead of mapping the message to an audio id string, map it to an object with one or more of the properties shown below. Many of these properties directly correspond to SoundJS play parameters.
         *
         *               "sound": "another-audio-id",
         *               // Required. This is the audio clip to play when "another-message" is triggered.
         *
         *               "events": [{
         *                   "event": "walk-to-the-left",
         *                   "time": 1500,
         *                   "interruptable": true // If `false`, event will trigger immediately when VO is interrupted or otherwise ended before event's time is reached. If `true`, event is not triggered if VO stops before time is reached. Defaults to `false`.
         *               }]
         *               // Optional. Used to specify a list of events to play once the VO begins.
         *           }
         *       }
         *
         * @property audioMap
         * @type Object
         * @default null
         */
        audioMap: null,

        /**
         * Whether all audio should be preloaded. 'none' preloads no audio, 'events' preloads audio with events attached, and 'all' preloads all audio.
         * 
         * @property preloadAudio
         * @type Object
         * @default 'events'
         */
        preloadAudio: 'events'
    },
        
    /**
     * This component plays audio using the SpringRoll VOPlayer instance. Audio is played by triggering specific messages defined in the audio component definition.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#handle-render
     * @listens platypus.Entity#stop-audio
     * @fires platypus.Entity#sequence-complete
     */
    initialize: function () {
        const
            audioMap = this.audioMap;
    
        this.eventList = TimeEventList.setUp();

        this.playingAudio = false;
        this.player = platypus.game.voPlayer;

        if (audioMap) {
            const
                keys = Object.keys(audioMap),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    key = keys[i];

                // Listens for messages specified by the `audioMap` and on receiving them, begins playing corresponding audio clips.
                this.addEventListener(key, this.playSound.bind(this, audioMap[key]));
            }
        }
        
        this.paused = false;
    },

    events: {
        "handle-render": function () {
            if (!this.paused) {
                this.checkTimeEvents(false);
            }
        },

        /**
         * Plays voice-over directly without using a predefined mapping from `audioMap`. This event accepts the same syntax as individual items in the `audioMap`.
         *
         * @param {String|Array|Object} vo Voice-over track or tracks to play.
         */
        "play-voice-over": function (vo) {
            this.playSound(vo);
        },

        "stop-audio": function () {
            this.player.stop();
            this.player.voList = []; // Workaround to prevent a Springroll bug wherein stopping throws an error due to `voList` being `null`.
        }
    },
    
    methods: {
        checkTimeEvents: function (finished, completed) {
            const
                {eventList, owner} = this,
                currentTime = finished ? Infinity : this.player.getElapsed(),
                events = eventList.getEvents(currentTime);

            events.forEach((event) => {
                if (!finished || completed || !event.interruptable) {
                    owner.trigger(event);
                }
                event.recycle();
            });

            arrayCache.recycle(events);
        },

        destroy: function () {
            if (this.playingAudio) {
                this.player.stop();
                this.player.voList = []; // Workaround to prevent a Springroll bug wherein stopping throws an error due to `voList` being `null`.
            }
            this.eventList.recycle();
            this.eventList = null;
        },

        playSound: function (soundDefinition, value) {
            const
                {eventList, owner, player} = this,
                onComplete = (completed) => {
                    this.playingAudio = false;
                    if (!owner.destroyed) {
                        this.checkTimeEvents(true, completed);

                        /**
                         * When an audio sequence is finished playing, this event is triggered.
                         *
                         * @event platypus.Entity#sequence-complete
                         */
                        owner.triggerEvent('sequence-complete');
                    }
                    arrayCache.recycle(soundList);
                };
            let soundList = null;

            eventList.clear();

            if (typeof soundDefinition === 'string') {
                soundList = arrayCache.setUp(soundDefinition);
            } else if (Array.isArray(soundDefinition)) {
                soundList = this.setupEventList(soundDefinition, eventList);
            } else {
                if (soundDefinition.events) {
                    eventList.addEvents(soundDefinition.events);
                }
                if (Array.isArray(soundDefinition.sound)) {
                    soundList = this.setupEventList(soundDefinition.sound, eventList);
                } else {
                    soundList = arrayCache.setUp(soundDefinition.sound);
                }
            }
            
            if (value && value.events) {
                eventList.addEvents(value.events);
            }

            player.play(soundList, onComplete.bind(this, true), onComplete.bind(this, false));

            this.playingAudio = true;
        },

        setupEventList (sounds, eventList) { // This function merges events from individual sounds into a full list queued to sync with the SpringRoll voPlayer.
            const
                {owner, player} = this,
                soundList = arrayCache.setUp();
            
            // Create alias-only sound list.
            for (let i = 0; i < sounds.length; i++) {
                if (sounds[i].sound) {
                    const
                        events = sounds[i].events;
                    let timeEvents = null;
                    
                    if (events) {
                        // Add audio-segment events
                        soundList.push(() => timeEvents = eventList.addEvents(events, player.getElapsed()));
                    }
                    soundList.push(sounds[i].sound);
                    if (events) {
                        // Make sure audio-segment events not yet triggered are triggered.
                        soundList.push(() => eventList.clear(timeEvents).forEach((event) => {
                            owner.trigger(event);
                            event.recycle();
                        }));
                    }
                } else {
                    soundList.push(sounds[i]);
                }
            }
            return soundList;
        }
    },
    
    getAssetList: function (component, props, defaultProps) {
        const
            preloadAudio = component?.preloadAudio ?? props?.preloadAudio ?? defaultProps?.preloadAudio,
            audioMap = component?.audioMap ?? props?.audioMap ?? defaultProps?.audioMap;
        
        if (audioMap && preloadAudio !== 'none') {
            const
                preloadOptions = {
                    all: () => true,
                    events: (sound) => {
                        if (Array.isArray(sound)) {
                            for (let i = 0; i < sound.length; i++) {
                                if (shouldPreload(sound[i])) {
                                    return true;
                                }
                            }
                        } else if (sound) {
                            return shouldPreload(sound?.sound) || sound?.events?.length > 0;
                        } else {
                            return false;
                        }
                    }
                },
                shouldPreload = preloadOptions[preloadAudio] ?? preloadOptions.events,
                getTracks = (sound) => {
                    if (typeof sound === 'string') {
                        return {
                            [formatPath(sound)]: true
                        };
                    } else if (Array.isArray(sound)) {
                        return sound.reduce((obj, value) => ({
                            ...obj,
                            ...getTracks(value)
                        }), {});
                    } else if (sound.sound) {
                        return getTracks(sound.sound);
                    } else {
                        return {};
                    }
                };

            return Object.keys(Object.keys(audioMap).reduce((obj, key) => {
                const
                    audio = audioMap[key];

                if (shouldPreload(audio)) {
                    return {
                        ...obj,
                        ...getTracks(audio)
                    };
                } else {
                    return obj;
                }
            }, {}));
        } else {
            return [];
        }
    }
});
