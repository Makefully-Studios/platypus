/* global platypus */
import {arrayCache, greenSplice} from '../utils/array.js';
import Data from '../Data.js';
import createComponentClass from '../factory.js';
import TimeEventList from '../TimeEventList.js';

const
    pause = function () {
        this.active--;
    },
    play = function () {
        this.active++;
    },
    updateLogic = function (tick) {
        const
            {executionFlow, owner, timelineInstances} = this,
            delta = tick.delta;
        let i = timelineInstances.length,
            removalOccurred = false;
        
        while (i--) {
            const
                instance = timelineInstances[i];

            if (instance.remove) {
                greenSplice(timelineInstances, i);
                instance.timeline.recycle();
                instance.recycle();
                removalOccurred = true;
            } else if (instance.active) {
                if (instance.timeline.list.length === 0) {
                    greenSplice(timelineInstances, i);
                    instance.timeline.recycle();
                    instance.recycle();
                    removalOccurred = true;
                } else {
                    this.progressTimeline(instance, delta);
                }
            }
        }
        
        if (timelineInstances.length) {
            if (removalOccurred && executionFlow === 'serial') {
                const
                    timeline = timelineInstances[0];
                    
                if (!timeline.active) {
                    timeline.play();
                }
            }
            owner.triggerEvent('timeline-progress', timelineInstances);
        }
    };

export default createComponentClass(/** @lends platypus.components.Timeline.prototype */{
    
    id: 'Timeline',
    
    properties: {
        /**
         * Sets the execution flow if multiple timelines are triggered.
         *     * "parallel" - Each timeline begins immediately when triggered and does not directly affect other timelines.
         *     * "serial" - A timeline doesn't start if another timeline is currently active: it will append itself to a queue of timelines and run eventually.
         *     * "exclusive" - Timeline begins immediately and will stop any other active timeline.
         *     * "tentative" - Timeline begins if no other timelines are active, otherwise it is ignored.
         */
        executionFlow: 'parallel',

        /**
         * Defines the set of timelines. Triggering the key for one of the events will run the timeline. A timeline can contain three different types integers >= 0, strings, and objects. Integers are interpreted as waits and define
         * pauses between events. Strings are intepreted as event calls. Objects can contain several parameters: entity, event, message. The entity is the id of the entity that
         * the event will be fired on. The event can be a string or array. If a string, it will call that event on the entity or owner. If an array, the value will be passed
         * to the event handling system.
         *
         *  "timelines": {
         *      "sample-timeline-1": [
         *          500,
         *          "sample-event",
         *          {"event": "sample-event", "message": "sample-message"},
         *          {"entity": "entity-id-to-trigger-event-on", "event": "sample-event"},
         *          {"event": ["sample-event", "sample-event-2", {"event": "sample-event-3", "message": "sample-message"}]},
         *      ],
         *      "sample-timeline-2": [
         *          200,
         *          "sample-event"
         *      ]
         * }
         *
         * @property timelines
         * @type Object
         * @default {}
         */
        timelines: {}
    },
    
    /**
     * Timeline enables the scheduling of events based on a linear timeline
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#handle-logic
     * @listens platypus.Entity#stop-active-timelines
     */
    initialize: function () {
        const
            keys = Object.keys(this.timelines),
            {length} = keys;

        this.timelineInstances = arrayCache.setUp();

        for (let i = 0; i < length; i++) {
            const
                timelineId = keys[i];

            this.addTimeline(timelineId, this.timelines[timelineId]);
        }
    },

    events: {
        "handle-logic": updateLogic,

        "pause-timelines": function () {
            this.timelineInstances.forEach((timeline) => {
                if (timeline.active) {
                    timeline.pause();
                }
            });
        },

        "play-timelines": function () {
            const
                {executionFlow, timelineInstances} = this;

            if (executionFlow === 'serial') {
                if (timelineInstances.length) { 
                    const
                        timeline = timelineInstances[0];
                        
                    if (!timeline.active) {
                        timeline.play();
                    }
                }
            } else {
                timelineInstances.forEach((timeline) => {
                    if (!timeline.active) {
                        timeline.play();
                    }
                });
            }
        },

        /**
         * Stops active timelines.
         *
         * @event platypus.Entity#stop-active-timelines
         */
        "stop-active-timelines": function () {
            const
                instances = this.timelineInstances;
            let i = instances.length;

            while (i--) {
                if (instances[i].active) {
                    instances[i].remove = true;
                }
            }
        },

        /**
         * Stops all timelines.
         *
         * @event platypus.Entity#stop-all-timelines
         */
        "stop-all-timelines": function () {
            const
                instances = this.timelineInstances;
            let i = instances.length;

            while (i--) {
                instances[i].remove = true;
            }
        },

        /**
         * Add a timeline dynamically.
         *
         * @event platypus.Entity#add-timeline
         * @param eventId {String} The event to listen for to trigger the timeline.
         * @param timeline {Array} The array of timeline data.
         */
        "add-timeline": function (eventId, timeline) {
            this.addTimeline(eventId, timeline);
        },

        /**
         * Play a timeline dynamically.
         *
         * @event platypus.Entity#start-timeline
         * @param timeline {Array} The array of timeline data.
         */
        "start-timeline": function (timeline) {
            this.startTimeline(timeline);
        }
    },
    
    methods: {
        addTimeline: function (eventId, timeline) {
            this.addEventListener(eventId, () => this.startTimeline(timeline));
        },
        createTimeStampedTimeline: function (timeline, active = 1) {
            const
                timeStampedTimeline = TimeEventList.setUp(timeline);

            return Data.setUp(
                "timeline", timeStampedTimeline,
                "time", 0,
                "total", timeStampedTimeline.getDuration(),
                "active", 1,
                "pause", pause,
                "play", play,
                "remove", false
            );
        },
        startTimeline (timeline) {
            const
                {executionFlow, timelineInstances} = this;

            switch (executionFlow) {
            case 'serial':
                timelineInstances.push(this.createTimeStampedTimeline(timeline), timelineInstances.some(({active}) => active) ? 0 : 1);
                return true;
            case 'exclusive':
                timelineInstances.forEach((instance) => instance.remove = true);
                timelineInstances.push(this.createTimeStampedTimeline(timeline));
                return true;
            case 'tentative':
                if (!timelineInstances.some(({active}) => active)) {
                    timelineInstances.push(this.createTimeStampedTimeline(timeline));
                    return true;
                }
                return false;
            default:
                timelineInstances.push(this.createTimeStampedTimeline(timeline));
                return true;
            }
        },
        progressTimeline (instance, delta) {
            const
                timeline = instance.timeline;
            
            instance.time += delta;
            
            //Go through the timeline playing events if the time has progressed far enough to trigger them.
            timeline.getEvents(instance.time).forEach((entry) => {
                const
                    {event, entity} = entry;

                if (typeof event === 'function') {
                    event(this.owner, instance);
                } else {
                    let triggerOn = this.owner;

                    if (entity) {
                        if (typeof entity === 'string') {
                            if (this.owner.getEntityById) {
                                triggerOn = this.owner.getEntityById(entity);
                            } else {
                                triggerOn = this.owner.parent.getEntityById(entity);
                            }
                        } else {
                            triggerOn = entity; // Maybe it's an Entity.
                        }
                        
                        if (!triggerOn) {
                            platypus.debug.warn('No entity of that id');
                            triggerOn = this.owner;
                        }
                    }
                    
                    triggerOn.trigger(entry);
                }
                
                entry.recycle();
            });
        },
        destroy: function () {
            const
                instances = this.timelineInstances;
            let i = instances.length;
            
            while (i--) {
                const
                    instance = instances[i];

                instance.timeline.recycle();
                instance.recycle();
            }
            arrayCache.recycle(instances);
            this.timelineInstances = null;
        }
    },

    publicMethods: {
        // asynchronous wait that incorporates ticker pauses.
        wait (time) {
            return new Promise ((resolve, reject) => {
                if (!this.startTimeline([time, resolve])) {
                    reject();
                }
            });
        }
    }
});
