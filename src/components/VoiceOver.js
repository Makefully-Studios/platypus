/* global platypus */
import {arrayCache, greenSlice} from '../utils/array.js';
import AudioVO from './AudioVO.js';
import createComponentClass from '../factory.js';

const
    getEventName = function (msg, VO) {
        if (VO === ' ') {
            return msg + 'default';
        } else {
            return msg + VO;
        }
    },
    createAudioDefinition = function (sound, events = [], message, frameLength) {
        const
            soundId = typeof sound === 'string' ? sound : typeof sound.sound === 'string' ? sound.sound : '',
            soundObj = soundId ? {} : sound.sound,
            definition = {
                sound: soundId,
                events: [...sound.events ?? []],
                ...soundObj
            },
            voice = sound.voice,
            mouthCues = sound.mouthCues ?? platypus.game.settings.mouthCues?.[definition.sound] ?? platypus.game.settings.mouthCues?.[definition.sound.substring(definition.sound.lastIndexOf('/') + 1)];

        if (voice) {
            let lastFrame = null,
                time = 0;

            voice += ' ';

            for (let i = 0; i < voice.length; i++) {
                const
                    thisFrame = voice[i];

                if (thisFrame !== lastFrame) {
                    lastFrame = thisFrame;
                    definition.events.push({
                        time,
                        event: getEventName(message, thisFrame)
                    });
                }
                time += frameLength;
            }
        } else if (mouthCues) {
            // if in condensed format
            if (typeof mouthCues[0] === 'number') {
                const
                    length = (mouthCues.length / 2) >> 0;

                for (let i = 0; i < length; i++) {
                    const
                        index = i * 2;
    
                    definition.events.push({
                        time: mouthCues[index] * 1000,
                        event: getEventName(message, mouthCues[index + 1])
                    });
                }
            } else {
                for (let i = 0; i < mouthCues.length; i++) {
                    const
                        thisFrame = mouthCues[i];
    
                    definition.events.push({
                        time: thisFrame.start * 1000,
                        event: getEventName(message, thisFrame.value)
                    });
                }
            }
        }

        return definition;
    },
    createVO = function (sound, events, message, frameLength) {
        if (!events[' ']) {
            events[' '] = events.default;
        }

        if (Array.isArray(sound)) {
            return sound.map((clip) => {
                if (typeof clip === 'number' || typeof clip === 'function') {
                    return clip;
                } else {
                    return createAudioDefinition(clip, events, message, frameLength);
                }
            });
        } else {
            return createAudioDefinition(sound, events, message, frameLength);
        }
    };

export default createComponentClass(/** @lends platypus.components.VoiceOver.prototype */{
    id: 'VoiceOver',
    
    properties: {
        aliases: null,

        /**
         * Sets the pairing between letters in the voice-over strings and the animation frame to play.
         *
         *       "animationMap": {
         *         "default": "mouth-closed"
         *         // Required. Specifies animation of default position.
         *
         *         "w": "mouth-o",
         *         "a": "mouth-aah",
         *         "t": "mouth-t"
         *         // Optional. Also list single characters that should map to a given voice-over animation frame.
         *       }
         *
         * @property animationMap
         * @type Object
         * @default: {"default": "default"}
         */
        animationMap: {"default": "default"},

        /**
         * Specifies the type of component to add to handle VO lip-sync animation.
         *
         * @property renderComponent
         * @type String
         * @default 'RenderSprite'
         */
        renderComponent: 'RenderSprite',

        /**
         * Specifies how long a described voice-over frame should last in milliseconds.
         *
         * @property frameLength
         * @type Number
         * @default 100
         */
        frameLength: 100,

        /**
         * Specifies the prefix that messages between the render and Audio components should use. This will cause the audio to trigger events like "i-say-w" and "i-say-a" (characters listed in the animationMap), that the RenderSprite uses to show the proper frame.
         *
         * @property messagePrefix
         * @type String
         * @default ""
         */
        messagePrefix: "",

        /**
         * This maps events to audio clips and voice over strings.
         *
         *      "voiceOverMap": {
         *          "message-triggered": [{
         *              "sound": "audio-id",
         *              // Required. This is the audio clip to play when "message-triggered" is triggered. It may be a string as shown or an object of key/value pairs as described in an [[audio]] component definition.
         *              "voice": "waat"
         *              // Optional. This string defines the voice-over sequence according to the frames defined by animationMap. Each character lasts the length specified by "frameLength" above. If not specified, voice will be the default frame.
         *          }]
         *      }
         *
         * @property voiceOverMap
         * @type Object
         * @default null
         */
        voiceOverMap: null,

        /**
         * This generates voice over maps. An array of specifications for batches of voice maps to generate. Includes basic properties that can add a prefix to the event name, initial delay before the audio, and an onEnd event that fires when the voice over completes.
         *
         *      "generatedVoiceOverMap": [{
         *          "eventPrefix": "vo-" //Optional. Defaults to "vo-". Is prefixed to the audio file name to create the event to call to trigger to VO.
         *          "initialDelay": 0 //Optional. Defaults to 0. An intial audio delay before the VO starts. Useful to prevent audio from triggering as a scene is loading.
         *          "onEndEvent": "an-event" //Optional. Defaults to "". This event fires when the VO completes.
         *          "endEventTime": 500 //Optional. Defaults to 99999. When the onEnd event fires.
         *          "audio": ["audio-0", "audio-1", "audio-2"] //Required. An array of strings that coorespond to the audio files to create a VOMap for, or a key/value list of id to audio path pairings.
         *      }]
         * 
         *      A generated VO Map is equivalent to this structure:
         * 
         *      "prefix-audio-0": [
         *          500, //initialDelay
         *          {
         *              "sound": {
         *                  "sound": "audio-0", //the audio string
         *                  "events": [
         *                      {
         *                          "event": "on-end-event", //onEndEvent
         *                          "time": 99999
         *                      }
         *                  ]
         *              }
         *          }
         *      ],
         *
         * @property generatedVoiceOverMap
         * @type Object[]
         * @default null
         */
        generatedVoiceOverMaps: null,

        acceptInput: null,
        animation: null,
        flip: null,
        hidden: null,
        interactive: null,
        mask: null,
        mirror: null,
        offsetZ: null,
        regX: null,
        regY: null,
        restart: null,
        scaleX: null,
        scaleY: null,
        spriteSheet: null,
        stateBased: null,
    },

    /**
     * This component uses its definition to load an AudioVO component and a RenderSprite component. These work in an interconnected way to render animations corresponding to one or more audio tracks.
     *
     * In addition to its own properties, this component also accepts all properties accepted by [RenderSprite](platypus.components.RenderSprite.html) and [AudioVO](platypus.components.AudioVO.html) and passes them along when it creates those components.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @uses platypus.AudioVO
     * @uses platypus.RenderSprite
     * @constructs
     * @listens platypus.Entity#load
     */
    initialize: function (definition, callback) {
        const
            {aliases, acceptInput, animation, animationMap, flip, hidden, interactive, mask, messagePrefix, mirror, offsetZ, owner, regX, regY, renderComponent, restart, scaleX, scaleY, spriteSheet, stateBased, voiceOverMap = {}} = this,
            animationKeys = Object.keys(animationMap),
            {length: animationLength} = animationKeys,
            componentInit = (Component, definition) => new Promise((resolve) => owner.addComponent(new Component(owner, definition, resolve))),
            voMapKeys = Object.keys(voiceOverMap),
            {length: voMapLength} = voMapKeys,
            audioDefinition = {
                audioMap: {},
                aliases
            },
            animationDefinition = {
                acceptInput,
                aliases,
                animation,
                animationMap: {},
                eventBased: true, // VO triggers events for changing lip-sync frames.
                flip,
                hidden,
                interactive,
                mask,
                mirror,
                offsetZ,
                regX,
                regY,
                restart,
                scaleX,
                scaleY,
                spriteSheet,
                stateBased
            };

        if (messagePrefix) {
            this.message = `${messagePrefix}-`;
        } else {
            this.message = '';
        }

        for (let i = 0; i < animationLength; i++) {
            const
                key = animationKeys[i];

            animationDefinition.animationMap[getEventName(this.message, key)] = animationMap[key];
        }
        animationDefinition.animationMap.default = this.animationMap.default;

        if (this.generatedVoiceOverMaps) {
            const
                createMapping = (key, path, voBatch) => {
                    if (!this.voiceOverMap[key]) {
                        const
                            delay = voBatch.initialDelay || 0,
                            endEventTime = voBatch.endEventTime || 99999,
                            onEnd = voBatch.onEndEvent || "";

                        this.voiceOverMap[key] = [
                            delay,
                            {
                                "sound": {
                                    "sound": path,
                                    "events": [
                                        {
                                            "event": onEnd,
                                            "time": endEventTime
                                        }
                                    ]
                                }
                            }
                        ];
                    }
                };

            for (let y = 0; y < this.generatedVoiceOverMaps.length; y++) {
                const
                    voBatch = this.generatedVoiceOverMaps[y],
                    prefix = voBatch.eventPrefix || "vo-",
                    audios = voBatch.audio;

                if (Array.isArray(audios)) {
                    for (let x = 0; x < audios.length; x++) {
                        const
                            audio = audios[x];

                        createMapping(`${prefix}${audio}`, audio, voBatch);
                    }
                } else {
                    Object.keys(audios).forEach((key) => createMapping(`${prefix}${key}`, audios[key], voBatch));
                }
            }
        }

        for (let i = 0; i < voMapLength; i++) {
            const
                key = voMapKeys[i];

            audioDefinition.audioMap[key] = createVO(voiceOverMap[key], animationMap, this.message, this.frameLength);
        }
        
        Promise.all([componentInit(typeof this.renderComponent === 'string' ? platypus.components[this.renderComponent] : this.renderComponent, animationDefinition), componentInit(AudioVO, audioDefinition)]).then(callback);

        return true;
    },

    events: {
        "play-voice-over-with-lip-sync": function (vo) {
            this.owner.triggerEvent('play-voice-over', createVO(vo, this.animationMap, this.message, this.frameLength));
        }
    },
    
    getAssetList: function (component, props, defaultProps) {
        const
            ss = component?.spriteSheet ?? props?.spriteSheet ?? defaultProps?.spriteSheet,
            audioMap =  component?.voiceOverMap ?? props?.voiceOverMap ?? defaultProps?.voiceOverMap,
            voAssets = AudioVO.getAssetList({
                audioMap
            });
        
        if (typeof ss === 'string') {
            return [
                ...greenSlice(platypus.game.settings.spriteSheets[ss].images),
                ...voAssets
            ];
        } else if (ss) {
            return [
                ...greenSlice(ss.images),
                ...voAssets
            ];
        } else {
            return voAssets;
        }
    }
});
