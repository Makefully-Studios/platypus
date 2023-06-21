/* global platypus */
import {arrayCache, greenSplice} from '../utils/array.js';
import Data from '../Data.js';
import {Sound} from '@pixi/sound';
import StateMap from '../StateMap.js';
import createComponentClass from '../factory.js';

const
    formatPath = (path) => {
        if (path.indexOf('.mp3') === -1) {
            return `${path}.mp3`;
        } else {
            return path;
        }
    },
    defaultSettings = {
        interrupt: 0,
        delay: 0,
        start: 0,
        loop: 0,
        volume: 1,
        pan: 0,
        muted: false,
        speed: 1,
        playthrough: false
    },
    playSound = function (soundDefinition) {
        let sound = '',
            attributes = null;
        
        if (typeof soundDefinition === 'string') {
            sound      = soundDefinition;
            attributes = {};
        } else {
            sound      = soundDefinition.sound;
            attributes = {
                ...soundDefinition
            };
            delete attributes.sound;
        }

        sound = platypus.assetCache.getFileId(sound);

        return function (value) {
            const
                soundInstance = Sound.exists(sound) ? Sound.find(sound) : Sound.add(sound),
                data = Data.setUp({
                    ...defaultSettings,
                    ...attributes,
                    ...value
                });

            data.volume *= this.volume;

            if (data.pan) {
                if (soundInstance.panFilter) {
                    soundInstance.panFilter.pan = data.pan;
                } else {
                    soundInstance.panFilter = new Sound.filters.StereoFilter(data.pan);
                }
            }
            if (soundInstance.panFilter || this.autoPanFilter) {
                const
                    filters = [];
                
                if (soundInstance.panFilter) {
                    filters.push(soundInstance.panFilter);
                }
                if (this.autoPanFilter) {
                    filters.push(this.autoPanFilter);
                }
                soundInstance.filters = filters;
            }
            data.audio = this.player.play(soundInstance, data);
            //if (data.volume) {
            //    data.audio.volume = data.volume;
            //}
            if (data.speed) {
                data.audio.speed = data.speed;
            }
            if (data.playthrough && (data.loop !== -1)) {
                data.audio.playthrough = true;
            } else {
                data.audio.playthrough = false;
            }
            data.audio.on('end', () => {
                if (data.audio && !this.owner.destroyed && this.activeAudioClips) {
                    //clean up active clips
                    this.removeClip(data.audio);
                    
                    /**
                     * When a sound effect is finished playing, this event is triggered.
                     *
                     * @event platypus.Entity#clip-complete
                     */
                    this.owner.triggerEvent('clip-complete');
                }
                data.recycle();
            });
            
            data.audio.soundId = sound;
            this.activeAudioClips.push(data.audio);

            if (data.audio.playState === 'playFailed') {
                // Let's try again - maybe it was a loading issue.
                const
                    wait = function (event) {
                        if (event.id === sound) {
                            data.audio.play(data);
                            Sound.off('fileload', wait);
                        }
                    };

                Sound.on('fileload', wait);
            }
        };
    };

export default createComponentClass(/** @lends platypus.components.AudioSFX.prototype */{
    id: 'AudioSFX',
    
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
         *               "interrupt": "none",
         *               // Optional. Can be "any", "early", "late", or "none". Determines how to handle the audio when it's already playing but a new play request is received. Default is "any".
         *
         *               "delay": 500,
         *               // Optional. Time in milliseconds to wait before playing audio once the message is received. Default is 0.
         *
         *               "start": 1.5,
         *               // Optional. Time in seconds determining where in the audio clip to begin playback. Default is 0.
         *
         *               "length": 2500,
         *               // Optional. Time in milliseconds to play audio before stopping it. If 0 or not specified, play continues to the end of the audio clip.
         *
         *               "loop": 4,
         *               // Optional. Determines how many more times to play the audio clip once it finishes. Set to -1 for an infinite loop. Default is 0.
         *
         *               "muted": false,
         *               // Whether clip should start muted.
         *
         *               "volume": 0.75,
         *               // Optional. Used to specify how loud to play audio on a range from 0 (mute) to 1 (full volume). Default is 1.
         *
         *               "speed": 0.75,
         *               // Optional. Used to specify how fast to play audio. Default is 1 (100% speed).
         *
         *               "pan": -0.25,
         *               // Optional. Used to specify the pan of audio on a range of -1 (left) to 1 (right). Default is 0.
         *
         *               "playthrough": false
         *               // Whether SFX should force completion of sound even when stopped prematurely.
         *           }
         *       }
         *
         * @property audioMap
         * @type Object
         * @default null
         */
        audioMap: null,

        /**
         * Sets whether this component should track camera position to affect its playback.
         *
         * If set to `true`, will use default values. Otherwise specify as shown below:
         *
         *      {
         *          "minimum": 0, // Minimum volume
         *          "maximum": 1, // Maximum volume
         *          "range": cameraWidth, // Distance from pan -1 to pan 0 and pan 0 to pan 1
         *          "buffer": 0 // Distance on each side of entity before panning should begin.
         *      }
         *
         * @property autoPan
         * @type boolean|Object
         * @default false
         */
        autoPan: false,

        /**
         * Determines whether a sound that's started should play through completely regardless of entity state changes.
         *
         * @property forcePlayThrough
         * @type boolean
         * @default true
         */
        forcePlayThrough: true,

        /**
         * Optional. Specifies whether this component should listen to events matching the animationMap to animate. Set this to true if the component should animate for on events.
         *
         * @property eventBased
         * @type Boolean
         * @default true
         */
        eventBased: true,

        /**
         * Optional. Specifies whether this component should listen to changes in the entity's state that match the animationMap to animate. Set this to true if the component should animate based on this.owner.state.
         *
         * @property stateBased
         * @type Boolean
         * @default false
         */
        stateBased: false
    },

    /**
     * This component plays audio using the SpringRoll Sound instance. Audio is played in one of two ways, by triggering specific messages defined in the audio component definition or using an audio map which plays sounds when the entity enters specified states.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#camera-update
     * @listens platypus.Entity#handle-render
     * @listens platypus.Entity#mute-audio
     * @listens platypus.Entity#pause-audio
     * @listens platypus.Entity#set-pan
     * @listens platypus.Entity#set-volume
     * @listens platypus.Entity#set-speed
     * @listens platypus.Entity#state-changed
     * @listens platypus.Entity#stop-audio
     * @listens platypus.Entity#toggle-mute
     * @listens platypus.Entity#unmute-audio
     * @listens platypus.Entity#unpause-audio
     * @fires platypus.Entity#clip-complete
     * @fires platypus.Entity#set-volume
     */
    initialize: function () {
        const
            audioMap = this.audioMap;
        
        this.activeAudioClips = arrayCache.setUp();

        this.state = this.owner.state;
        this.stateChange = false;
        
        this.player = platypus.game.sfxPlayer;

        this.volume = 1;

        if (audioMap) {
            const
                keys = Object.keys(audioMap),
                {length} = keys;

            if (this.stateBased) {
                this.checkStates = arrayCache.setUp();
            }

            for (let i = 0; i < length; i++) {
                const
                    key = keys[i],
                    sound = audioMap[key],
                    playClip = playSound(sound);

                if (this.eventBased) {
                    this.addEventListener(key, playClip);
                }
                if (this.stateBased) {
                    this.addStateCheck(key, sound.sound ?? sound, playClip);
                }
            }
        }

        if (this.autoPan) {
            const
                autoPan = {
                    "minimum": this.autoPan.minimum || 0,
                    "maximum": this.autoPan.maximum || 1,
                    "range": this.autoPan.range || -1,
                    "buffer": this.autoPan.buffer || 0
                };
            let lastPan = 0;

            this.volume = autoPan.maximum;
            
            this.autoPanFilter = new Sound.filters.StereoFilter(lastPan);

            this.addEventListener("camera-update", function (camera) {
                const
                    delta = this.owner.x - camera.viewport.x,
                    distance = Math.abs(delta),
                    direction = delta / distance,
                    range = autoPan.range === -1 ? camera.viewport.width : autoPan.range;
                let pan = 0,
                    volume = 1;

                if (distance <= autoPan.buffer) {
                    pan = 0;
                    volume = autoPan.maximum;
                } else if (distance > autoPan.buffer + range) {
                    pan = direction;
                    volume = Math.max(autoPan.minimum, Math.min(autoPan.maximum, (autoPan.buffer + range * 2 - distance) / range));
                } else {
                    pan = direction * (distance - autoPan.buffer) / range;
                    volume = autoPan.maximum;
                }
                
                if (pan !== lastPan) {
                    this.autoPanFilter.pan = pan;
                    lastPan = pan;
                }
                if (volume !== this.volume) {
                    /**
                     * This message sets the volume of playing audio.
                     *
                     * @event platypus.Entity#set-volume
                     * @param volume {Number} A number from 0 to 1 that sets the volume.
                     * @param [soundId] {String} If an soundId is provided, that particular sound instance's volume is set. Otherwise all audio volume is changed.
                     */
                    this.owner.triggerEvent('set-volume', volume);
                }
            });
        }
        
        this.paused = false;
    },

    events: {
        "handle-render": function () {
            const
                state = this.state;
            
            if (this.paused) {
                return;
            }
            
            if (this.stateBased && this.stateChange) {
                const
                    cs = this.checkStates;
                let i = cs.length;

                while (i--) {
                    cs[i].check(state);
                }
                this.stateChange = false;
            }
        },

        "state-changed": function () {
            this.stateChange = true;
        },

        /**
         * On receiving this message, the audio will mute if unmuted, and unmute if muted.
         *
         * @event platypus.Entity#toggle-mute
         * @param audioId {String} If an audioId is provided, that particular sound instance is toggled. Otherwise all audio is toggled from mute to unmute or vice versa.
         */
        "toggle-mute": function (audioId) {
            this.handleClip(audioId, function (clip) {
                if (clip) {
                    if (clip.unmuted) {
                        clip.volume = clip.unmuted;
                        delete clip.unmuted;
                    } else {
                        clip.unmuted = clip.volume;
                        clip.volume = 0;
                    }
                }
            });
        },

        "stop-audio": function (audioId) {
            if (!audioId) {
                this.stopAudio();
            } else if (typeof audioId === 'string') {
                this.stopAudio(audioId);
            } else {
                this.stopAudio(audioId.audioId || false, audioId.playthrough || false);
            }
        },

        /**
         * On receiving this message all audio will mute, or a particular sound instance will mute if an id is specified.
         *
         * @event platypus.Entity#mute-audio
         * @param audioId {String} If an audioId is provided, that particular sound instance will mute. Otherwise all audio is muted.
         */
        "mute-audio": function (audioId) {
            this.handleClip(audioId, function (clip) {
                if (clip) {
                    clip.unmuted = clip.volume;
                    clip.volume = 0;
                }
            });
        },

        /**
         * On receiving this message all audio will unmute, or a particular sound instance will unmute if an id is specified.
         *
         * @event platypus.Entity#unmute-audio
         * @param audioId {String} If an audioId is provided, that particular sound instance will unmute. Otherwise all audio is unmuted.
         */
        "unmute-audio": function (audioId) {
            this.handleClip(audioId, function (clip) {
                if (clip) {
                    clip.volume = clip.unmuted;
                    delete clip.unmuted;
                }
            });
        },

        /**
         * On receiving this message all audio will pause, or a particular sound instance will pause if an id is specified.
         *
         * @event platypus.Entity#pause-audio
         * @param audioId {String} If an audioId is provided, that particular sound instance will pause. Otherwise all audio is paused.
         */
        "pause-audio": function (audioId) {
            this.handleClip(audioId, function (clip) {
                if (clip) {
                    clip.pause();
                }
            });
        },

        /**
         * On receiving this message all audio will unpause, or a particular sound instance will unpause if an id is specified.
         *
         * @event platypus.Entity#unpause-audio
         * @param audioId {String} If an audioId is provided, that particular sound instance will unpause. Otherwise all audio is unpaused.
         */
        "unpause-audio": function (audioId) {
            this.handleClip(audioId, function (clip) {
                if (clip) {
                    clip.unpause();
                }
            });
        },
            
        /**
         * This message sets the pan of playing audio.
         *
         * @event platypus.Entity#set-pan
         * @param pan {Number} A number from -1 to 1 that sets the pan.
         * @param [soundId] {String} If an soundId is provided, that particular sound instance's pan is set.
         */
        "set-pan": function (pan, soundId = '') {
            const
                handler = (clip) => {
                    if (clip) {
                        clip.pan = pan;
                    }
                };

            if (soundId) {
                this.handleClip(soundId, handler);
            } else {
                this.getAllClips(handler);
            }
        },
            
        "set-volume": function (volume, soundId = '') {
            const
                handler = (clip) => {
                    if (clip) {
                        clip.volume = volume * this.player.volume;
                    }
                };
            
            if (soundId) {
                this.handleClip(soundId, handler);
            } else {
                this.volume = volume;
                this.getAllClips(handler);
            }
        },

        /**
         * This message sets the speed of playing audio.
         *
         * @event platypus.Entity#set-speed
         * @param speed {Number} A number that sets the speed.
         * @param [soundId] {String} If an soundId is provided, that particular sound instance's speed is set. Otherwise all audio speed is changed.
         */
        "set-speed": function (speed, soundId = '') {
            const
                handler = function (clip) {
                    if (clip) {
                        clip.speed = speed;
                    }
                };

            if (soundId) {
                this.handleClip(soundId, handler);
            } else {
                this.getAllClips(handler);
            }
        }
    },
    
    methods: {
        handleClip: function (audioId, handler) {
            if (typeof audioId === 'string') {
                this.getClipById(audioId, handler);
            } else {
                this.getAllClips(handler);
            }
        },
        
        getClipById: function (id, onGet = () => {}) {
            const
                clips = this.activeAudioClips;
            
            for (let i = 0; i < clips.length; i++) {
                if (clips[i].soundId === id) {
                    onGet(clips[i]);
                    return clips[i];
                }
            }
            
            onGet(null);

            return null;
        },
        
        getAllClips: function (onGet = () => {}) {
            const
                clips = this.activeAudioClips;
        
            for (let i = 0; i < clips.length; i++) {
                onGet(clips[i]);
            }

            return clips;
        },
        
        stopAudio: function (audioId, playthrough) {
            const
                clips = this.activeAudioClips;
            let i = clips.length;
            
            if (audioId) {
                while (i--) {
                    if (clips[i].soundId === audioId) {
                        if (clips[i].playthrough ?? playthrough) {
                        } else {
                            this.player.stop(clips[i]);
                            greenSplice(clips, i);
                        }
                    }
                }
            } else {
                while (i--) {
                    if (clips[i].playthrough ?? playthrough) {
                    } else {
                        this.player.stop(clips[i]);
                    }
                }
                clips.length = 0;
            }
        },
        
        removeClip: function (audioClip) {
            const
                i = this.activeAudioClips.indexOf(audioClip);

            if (i >= 0) {
                greenSplice(this.activeAudioClips, i);
            }
        },
        
        addStateCheck: function (key, audioId, play) {
            const
                states = StateMap.setUp(key),
                checkData = Data.setUp(
                    "states", states,
                    "playing", false
                );
            
            checkData.check = (state) => {
                const
                    active = state.includes(checkData.states);
        
                if (active !== checkData.playing) {
                    if (active) {
                        play.call(this);
                    } else {
                        this.stopAudio(audioId, this.forcePlaythrough);
                    }
                    checkData.playing = active;
                }
            };
            this.checkStates.push(checkData);
        },
        
        destroy: function () {
            const
                c = this.checkStates;
            
            this.stopAudio();
            arrayCache.recycle(this.activeAudioClips);
            this.activeAudioClips = null;
            
            this.state = null;

            if (c) {
                let i = c.length;

                while (i--) {
                    const
                        ci = c[i];

                    ci.states.recycle();
                    ci.recycle();
                }
                arrayCache.recycle(c);
                this.checkStates = null;
            }
        }
    },
    
    getAssetList: function (component, props, defaultProps) {
        const
            preload = arrayCache.setUp(),
            audioMap = component?.audioMap ?? props?.audioMap ?? defaultProps?.audioMap;
        
        if (audioMap) {
            const
                keys = Object.keys(audioMap),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    audio = audioMap[keys[i]],
                    item = formatPath(audio.sound ?? audio);

                if (preload.indexOf(item) === -1) {
                    preload.push(item);
                }
            }
        }

        return preload;
    }
});
