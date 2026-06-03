/* global platypus, window */
import EventHandlerList from './EventHandlerList.js';
import {arrayCache, greenSlice} from './utils/array.js';

const
    getPerfTools = () => typeof performance !== 'undefined' && performance.mark && performance.measure ? performance : null,
    runBoth = function (f1, f2) {
        return function () {
            f1.apply(this, arguments);
            f2.apply(this, arguments);
        };
    };

/**
 * Messenger provides prioritized event-based communication between
 * components, entities, and systems.
 *
 * Features include:
 * - prioritized listeners
 * - one-time listeners
 * - deterministic execution ordering
 * - safe listener mutation during dispatch
 * - pooled listener structures
 * - array/object event dispatch formats
 * - optional debug instrumentation
 *
 * Messenger is commonly mixed into entities and components to
 * provide lightweight pub/sub behavior without repeated allocations.
 *
 * @memberof platypus
 * @class Messenger
 */
class Messenger {
    /**
     * Creates a Messenger instance.
     *
     * @param {Object} [options]
     * Configuration options.
     *
     * @param {Boolean} [options.debug=false]
     * Enables nested-event debugging and performance instrumentation.
     */
    constructor ({debug} = {}) {
        this._listeners = {};
        this._destroyed = false;
        this.loopCheck = arrayCache.setUp();

        if (debug) {
            const
                triggerEvent = this.triggerEvent;

            this.triggerEvent = function (event, value) {
                const
                    debugLimit = 5,
                    debugLogging = value && value.debug;
                let debugCount = 0;
                
                // Debug logging.
                if (debugLogging || this.debug) {
                    const perfTools = getPerfTools();

                    for (let i = 0; i < this.loopCheck.length; i++) {
                        if (this.loopCheck[i] === event) {
                            debugCount += 1;
                            if (debugCount > debugLimit) {
                                throw "Endless loop detected for '" + event + "'.";
                            } else {
                                platypus.debug.warn("Event '" + event + "' is nested inside another '" + event + "' event.");
                            }
                        }
                    }
    
                    this.loopCheck.push(event);

                    if (perfTools) {
                        perfTools.mark("a");
                    }

                    const
                        count = triggerEvent.apply(this, arguments);

                    if (perfTools) {
                        perfTools.mark("b");
                        perfTools.measure(this.type + ":" + event, 'a', 'b');
                    }
                    this.loopCheck.length = this.loopCheck.length - 1;
                    if (debugLogging) {
                        if (count) {
                            platypus.debug.log('Entity "' + this.type + '": Event "' + event + '" has ' + count + ' subscriber' + ((count > 1) ? 's' : '') + '.', value);
                        } else {
                            platypus.debug.warn('Entity "' + this.type + '": Event "' + event + '" has no subscribers.', value);
                        }
                    }
                    return count;
                } else {
                    return triggerEvent.apply(this, arguments);
                }
            };
        }
    }

    /**
     * Registers an event listener.
     *
     * Listeners are executed in ascending priority order.
     * Lower priority values execute first.
     *
     * When priorities match, listeners execute in
     * registration order.
     *
     * If no context is supplied, the Messenger instance
     * becomes the callback context.
     *
     * @method on
     *
     * @param {String} name
     * Event name.
     *
     * @param {Function} callback
     * Function invoked when the event fires.
     *
     * @param {Object} [context=this]
     * Callback execution context.
     *
     * @param {Boolean} [once=false]
     * Whether the listener should automatically remove
     * itself after its first execution.
     *
     * @param {Number} [priority=MAX_SAFE_INTEGER]
     * Listener execution priority.
     *
     * Lower numbers execute first.
     */
    on (name, callback, context = null, once = false, priority = -1) {
        if (!this._destroyed) {
            const
                listenerList = this._listeners[name] = this._listeners[name] ?? EventHandlerList.setUp();

            return listenerList.add(callback, context ?? this, once, priority === -1 ? Number.MAX_SAFE_INTEGER : priority);
        }

        return null;
    }

    /**
     * Removes listeners.
     *
     * Calling without arguments removes all listeners.
     *
     * Calling with only an event name removes all listeners
     * for that event.
     *
     * Calling with both name and callback removes matching
     * listeners for that callback.
     *
     * @method off
     *
     * @param {String} [name]
     * Event name.
     *
     * @param {Function} [callback]
     * Listener callback.
     */
    off (name, callback, context) {
        if (!this._destroyed) {
            // remove all
            if (typeof name === 'undefined') {
                this.getMessageIds().forEach((id) => this._listeners[id].recycle());
                this._listeners = {};
            } else {
                const
                    listenerList = this._listeners[name];

                if (listenerList) {
                    // remove all listeners for that event
                    if (typeof callback === 'undefined') {
                        listenerList.recycle();
                        delete this._listeners[name];
                    } else {
                        //remove single listener
                        listenerList.remove(callback, context);
                        if (!listenerList.handlers.length) {
                            listenerList.recycle();
                            delete this._listeners[name];
                        }
                    }
                }
            }
        }
    }

    /**
     * Returns a string describing the Messenger as "[Messenger object]".
     *
     * @return String
     */
    toString () {
        return "[Messenger Object]";
    }

    /**
     * Dispatches one or more events.
     *
     * Supported formats:
     *
     * String:
     * trigger('jump', value)
     *
     * Array:
     * trigger(['jump', 'land'], value)
     *
     * Object:
     * trigger({
     *     event: 'jump',
     *     message: value,
     *     debug: true
     * })
     *
     * @method trigger
     *
     * @param {String|Array|Object} events
     * Event descriptor.
     *
     * @param {*} [message]
     * Event payload.
     *
     * @param {Boolean} [debug]
     * Enables debug logging for this dispatch.
     *
     * @return {Number}
     * Total number of listeners triggered.
     */
    trigger (events, message, debug) {
        if (typeof events === 'string') {
            return this.triggerEvent.apply(this, arguments);
        } else if (Array.isArray(events)) {
            const
                args = greenSlice(arguments);
            let count = 0;

            for (let i = 0; i < events.length; i++) {
                args[0] = events[i];
                count += this.trigger.apply(this, args);
            }
            arrayCache.recycle(args);

            return count;
        } else if (events.event) {
            if (typeof events.debug !== 'undefined') {
                return this.triggerEvent(
                    events.event,
                    events.message ?? message,
                    events.debug
                );
            }

            return this.triggerEvent(
                events.event,
                events.message ?? message
            );
        } else {
            platypus.debug.warn('Event incorrectly formatted: must be string, array, or object containing an "event" property.', events);
            return 0;
        }
    }
    
    /**
     * Dispatches a single event directly.
     *
     * This bypasses trigger-format normalization and is
     * the fastest dispatch path.
     *
     * @method triggerEvent
     *
     * @param {String} type
     * Event name.
     *
     * @param {...*} args
     * Arguments forwarded to listeners.
     *
     * @return {Number}
     * Number of listeners triggered.
     */
    triggerEvent (type, ...args) {
        const
            {_listeners} = this;

        if (!this._destroyed && _listeners.hasOwnProperty(type) && (_listeners[type])) {
            return _listeners[type].trigger(args);
        }
        
        return 0;
    }
    
    /**
     * This method returns all the messages that this entity is concerned about.
     *
     * @return {Array} An array of strings listing all the messages for which this Messenger has handlers.
     */
    getMessageIds () {
        return Object.keys(this._listeners);
    }
    
    /**
     * This method relinguishes Messenger properties
     *
     */
    destroy () {
        arrayCache.recycle(this.loopCheck);
        this.loopCheck = null;
        this._destroyed = true;
        this.getMessageIds().forEach((id) => this._listeners[id].recycle());
        this._listeners = null;
    }

    /**
     * This read-only property shows whether this Messenger is destroyed.
     *
     * @property destroyed
     * @type Boolean
     * @default false
     */
    get destroyed () {
        return this._destroyed;
    }

    /**
     * Adds Messenger functionality to a Class.
     *
     * @param {Class|Function} ClassObject The class to add Messenger behavior to.
     */
    static mixin (ClassObject) {
        const
            fromProto = Messenger.prototype,
            toProto = ClassObject.prototype,
            methods = Object.getOwnPropertyNames(fromProto);
        let i = methods.length;

        while (i--) {
            const
                key = methods[i];

            if (key !== 'constructor') {
                if (toProto[key]) {
                    toProto[key] = runBoth(toProto[key], fromProto[key]);
                } else {
                    toProto[key] = fromProto[key];
                }
            }
        }
    }

    /**
     * Call this method in an Object's instantiation if `Messenger.mixin` has been called on its Class.
     *
     * @param {Object} object The object for which Messenger should be instantiated.
     */
    static initialize (object) {
        object._listeners = {};
        object._destroyed = false;
        object.loopCheck = arrayCache.setUp();
    }
}

export default Messenger;
