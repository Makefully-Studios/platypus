/* global platypus */
import {arrayCache, greenSplice} from '../utils/array.js';
import Data from '../Data.js';
import createComponentClass from '../factory.js';

const
    pause = function () {
        this.active--;
    },
    play = function () {
        this.active++;
    },
    updateLogic = function (tick) {
        const
            delta = tick.delta,
            instances = this.timelineInstances;
        let i = instances.length;
        
        while (i--) {
            const
                instance = instances[i];

            if (instance.remove) {
                greenSplice(instances, i);
                arrayCache.recycle(instance.timeline);
                instance.recycle();
            } else if (instance.active) {
                if (instance.timeline.length === 0) {
                    greenSplice(instances, i);
                    arrayCache.recycle(instance.timeline);
                    instance.recycle();
                } else {
                    this.progressTimeline(instance, delta);
                }
            }
        }

        if (instances.length) {
            this.owner.triggerEvent('timeline-progress', this.timelineInstances);
        }
    };

export default createComponentClass(/** @lends platypus.components.Timeline.prototype */{
    
    id: 'Timeline',
    
    properties: {
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
        "timelines": {}
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
            this.timelineInstances.forEach((timeline) => {
                if (!timeline.active) {
                    timeline.play();
                }
            });
        },

        /**
         * Stops all timelines.
         *
         * @event platypus.Entity#stop-active-timelines
         */
        "stop-active-timelines": function () {
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
        }
    },
    
    methods: {
        addTimeline: function (eventId, timeline) {
            this.addEventListener(eventId, () => {
                this.timelineInstances.push(this.createTimeStampedTimeline(timeline));
            });
        },
        createTimeStampedTimeline: function (timeline) {
            const
                timeStampedTimeline = arrayCache.setUp();
            let timeOffset = 0;
            
            for (let x = 0; x < timeline.length; x++) {
                const
                    entry = timeline[x];

                if (typeof entry === 'number') {
                    timeOffset += entry;
                } else {
                    timeStampedTimeline.push(Data.setUp(
                        "time", timeOffset,
                        "value", entry
                    ));
                }
            }
            timeStampedTimeline.reverse();

            return Data.setUp(
                "timeline", timeStampedTimeline,
                "time", 0,
                "total", timeOffset,
                "active", 1,
                "pause", pause,
                "play", play,
                "remove", false
            );
        },
        progressTimeline: function (instance, delta) {
            const
                timeline = instance.timeline;
            let i = timeline.length;
            
            instance.time += delta;
            
            //Go through the timeline playing events if the time has progressed far enough to trigger them.
            while (i--) {
                const
                    entry = timeline[i];
                let triggerOn = this.owner;

                if (entry.time <= instance.time) {
                    const
                        value = entry.value,
                        type = typeof value;

                    if (type === 'string') {
                        this.owner.triggerEvent(value);
                    } else if (typeof value === 'function') {
                        value(this.owner, instance);
                    } else {
                        if (value.entity) {
                            if (this.owner.getEntityById) {
                                triggerOn = this.owner.getEntityById(value.entity);
                            } else {
                                triggerOn = this.owner.parent.getEntityById(value.entity);
                            }
                            
                            if (!triggerOn) {
                                platypus.debug.warn('No entity of that id');
                                triggerOn = this.owner;
                            }
                        }
                        
                        if (value.message) {
                            triggerOn.triggerEvent(value.event, value.message);
                        } else {
                            triggerOn.trigger(value.event);
                        }
                    }
                    
                    entry.recycle();
                    timeline.pop(); //Remove the entry.
                    if (!instance.active) {
                        return; //We bail until the callback.
                    }
                } else {
                    return;
                }
            }
        },
        destroy: function () {
            const
                instances = this.timelineInstances;
            let i = instances.length;
            
            while (i--) {
                const
                    instance = instances[i];

                arrayCache.recycle(instance.timeline);
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
                this.timelineInstances.push(this.createTimeStampedTimeline([
                    time,
                    resolve
                ]));
            });
        }
    }
});
