/* global platypus */
import createComponentClass from '../factory.js';
import {greenSlice} from '../utils/array.js';

const
    entityAdded = function (entity) {
        if (entity.type in this.watchedEntities) {
            this.watchedEntities[entity.type].push(entity);
        }
    },
    entityRemoved = function (entity) {
        const
            watchedEntities = this.watchedEntities[entity.type];

        for (let x = watchedEntities.length - 1; x >= 0; x--) {
            if (watchedEntities[x] === entity) {
                watchedEntities.splice(x, 1);
                break;
            }
        }
    },
    updateLogic = function (tick) {
        const
            delta = tick.delta;
        let toPlay = null,
            toPlayIndex = -1;
        
        for (let x = 0; x < this.tutorials.length; x++) {
            const
                tut = this.tutorials[x];
            let keepChecking = false;

            if (!this.playing && this.theQueue.length === 0) {
                keepChecking = true;
            } else if ((!this.playing && this.theQueue.length > 0) && (tut.priority > this.theQueue[0].priority)) {
                keepChecking = true;
            } else if (this.playing && (this.playing.priority < tut.priority)) {
                keepChecking = true;
            } else if (tut.queue) {
                keepChecking = true;
            }

            if (!keepChecking) {
                continue;
            }

            if (this.checkRequirements(tut.requirements)) {
                if (tut.replayDelay && tut.replayDelayTimer > 0) {
                    tut.replayDelayTimer -= delta;
                    if (tut.replayDelayTimer > 0) {
                        continue;
                    }
                }
                
                if (!toPlay || toPlay.priority < tut.priority) {
                    //TML - If we only have one item we try to play, then we may prevent certain audio from playing if it's only valid for a single tick.
                    toPlay = tut;
                    toPlayIndex = x;
                }
            }
        }

        if (toPlay) {
            const
                tutorial = this.tutorials.splice(toPlayIndex, 1)[0];

            if (this.playing) {
                if (tutorial.priority > this.playing.priority) {
                    /**
                     * On receiving this message, audio will stop playing.
                     *
                     * @event platypus.Entity#stop-audio
                     * @param audioId {String} If an audioId is provided, that particular sound instance is stopped. Otherwise all audio is stopped.
                     */
                    this.owner.triggerEvent('stop-audio');
                    this.play(tutorial);
                } else {
                    this.queue(tutorial);
                }
            } else if (this.theQueue.length > 0) {
                if (tutorial.priority > this.theQueue[0].priority) {
                    this.play(tutorial);
                } else {
                    this.play(this.theQueue.splice(0, 1)[0]);
                    this.queue(tutorial);
                }
            } else {
                this.play(tutorial);
            }
        } else if (!this.playing && this.theQueue.length > 0) {
            this.play(this.theQueue.splice(0, 1)[0]);
        }
    };

export default createComponentClass(/** @lends platypus.components.Tutorial.prototype */{
    
    id: 'Tutorial',
    
    properties: {
        
        /* An array of tutorial definition objects. These objects define what events will be called by the tutorial, the priority of the tutorial, how often and how many times it will fire, the required conditions for it to fire, and more.
            *
            * "tutorialDefs": [
            *      {
            *          "events": ["example-vo-event"],         //An Array of Strings. Defines the events to fire when all the conditions for this tutorial are met. If there are multiple events, one is chosen at random. All events in the array will play before any repeat.
            *          "priority": 5,                          //The priorioty of the tutorial. Higher numbered tutorials interrupt lower numbered. Default: 0.
            *          "queue": true,                          //Will the tutorial queue up if played while another tutorial is playing? Default: false.
            *          "timesToReplay": 3,                     //The number of times a tutorial will replay. Set to 0 to make a tutorial play only once. Default: Infinity.
            *          "replayDelay": 10000,                   //While the conditions are met, the tutorial will replay at this interval in milliseconds. If set to null, it will not repeat. Default: null.
            *          "level": "example-level",               //Tutorial will only play when this level is the currently loaded level.
            *          "requirements": {                       //The requirements is a collection of entities types that are watched by the tutorial to determine if the conditions to play this tutorial are true.
            *              "example-entity-type": ["example-entity-state"]     //The requirements is a set of key-value pairs. The keys are entity types that the tutorial will watch. The values are arrays of states of that entity type which must be true for the tutorial to play.
            *          }
            *      }
            * ]
            *
            * @property tutorialDefs
            * @type Array [Object]
            * @default []
            */
        "tutorialDefs": []
    },
        
    /**
     * Tutorial provides a framework for playing tutorials. It allows the user to define things such as under what conditions tutorials will play, how often they play, and which tutorials have priority.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#child-entity-added
     * @listens platypus.Entity#child-entity-removed
     * @listens platypus.Entity#handle-logic
     * @listens platypus.Entity#peer-entity-added
     * @listens platypus.Entity#peer-entity-removed
     * @listens platypus.Entity#sequence-complete
     * @fires platypus.Entity#stop-audio
     */
    initialize: function () {
        this.playing = null;
        this.theQueue = [];
        this.watchedEntities = {};
        this.tutorials = [];

            
        for (let x = 0; x < this.tutorialDefs.length; x++) {
            const
                tutDef = this.tutorialDefs[x];

            if (!tutDef.events) {
                platypus.debug.warn("Tutorial definition lacks events.");
            } else {
                const
                    tutorial = {
                        events: greenSlice(tutDef.events),
                        originalEvents: greenSlice(tutDef.events),
                        priority: tutDef.priority || 0,
                        queue: tutDef.queue || false,
                        timesToReplay: (typeof tutDef.timesToReplay === 'number') ? tutDef.timesToReplay : Infinity,
                        replayDelay: tutDef.replayDelay || null,
                        replayDelayTimer: tutDef.replayDelay || null,
                        level: tutDef.level,
                        requirements: {}
                    },
                    keys = Object.keys(tutDef.requirements),
                    {length} = keys;
    
                for (let i = 0; i < length; i++) {
                    const
                        entityType = keys[i];
    
                    tutorial.requirements[entityType] = greenSlice(tutDef.requirements[entityType]);
                    if (!this.watchedEntities[entityType]) {
                        this.watchedEntities[entityType] = [];
                    }
                }
                this.tutorials.push(tutorial);
            }
        }
    },

    events: {// These are messages that this component listens for
        "child-entity-added": entityAdded,

        "peer-entity-added": entityAdded,

        "child-entity-removed": entityRemoved,

        "peer-entity-removed": entityRemoved,
        
        "handle-logic": updateLogic,

        "sequence-complete": function () {
            if (this.playing.timesToReplay >= 0) {
                this.tutorials.push(this.playing);
            }
            this.playing = null;
        }
    },
    
    methods: {// These are internal methods that are invoked by this component.
        play: function (tutorial) {
            this.playing = tutorial;
            if (this.playing.events.length === 0) {
                this.playing.events = greenSlice(this.playing.originalEvents);
            }

            this.owner.triggerEvent(this.playing.events.splice(Math.floor(Math.random() * this.playing.events.length), 1)[0]);

            tutorial.timesToReplay -= 1;
            tutorial.replayDelayTimer = tutorial.replayDelay;
        },
        queue: function (tutorial) {
            let added = false;

            for (let x = 0; x < this.theQueue.length; x++) {
                if (this.theQueue[x].priority < tutorial.priority) {
                    this.theQueue.splice(x, 0, tutorial);
                    added = true;
                    break;
                }
            }
            
            if (!added) {
                this.theQueue.push(tutorial);
            }
        },
        checkRequirements: function (requirements) {
            const
                keys = Object.keys(requirements),
                {length} = keys;
    
            //Going through the types of entities
            for (let i = 0; i < length; i++) {
                const
                    entityType = keys[i],
                    states = requirements[entityType];
                let metRequirement = true;

                for (let y = this.watchedEntities[entityType].length - 1; y >= 0; y--) {  //Going through the instances of those entities
                    const
                        anEntity = this.watchedEntities[entityType][y];

                    metRequirement = true;
                    for (let x = 0; x < states.length; x++) {   //Going through the required states of an entity instance
                        if (!anEntity.state.get(states[x])) {
                            metRequirement = false;
                            break;
                        }
                    }
                    if (metRequirement) {
                        break;
                    }
                }
                if (!metRequirement) {
                    return false;
                }
            }
            return true;
        },
        destroy: function () {
            this.watchedEntities = null;
            this.theQueue = null;
            this.playing = null;
            this.tutorials = null;
        }
    }
});
