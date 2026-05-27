import recycle from 'recycle';
import EventHandler from './EventHandler';
import { arrayCache, greenSlice, greenSplice } from './utils/array';

/**
 * Maintains an ordered list of event handlers for a single event type.
 *
 * EventHandlerList supports:
 * - listener priorities
 * - deterministic insertion ordering
 * - safe mutation during dispatch
 * - one-time listeners
 * - recyclable pooled handlers
 *
 * Handlers are lazily sorted on first dispatch after modification.
 *
 * @memberof platypus
 * @class EventHandlerList
 */
const EventHandlerList = function () {
    /**
     * Whether the handler list requires resorting.
     *
     * @property dirty
     * @type Boolean
     * @default false
     */
    this.dirty = false;

    /**
     * The ordered list of EventHandler objects.
     *
     * @property handlers
     * @type Array
     */
    this.handlers = arrayCache.setUp();

    /**
     * Incrementing insertion index used to preserve
     * deterministic ordering between equal priorities.
     *
     * @property orderIndex
     * @type Number
     * @default 0
     */
    this.orderIndex = 0;
};

const { prototype } = EventHandlerList;

/**
 * Adds a new handler to the list.
 *
 * Handlers are not immediately sorted. Sorting occurs lazily
 * during the next dispatch.
 *
 * @method add
 * @param callback {Function}
 * The listener callback function.
 *
 * @param [context=null] {Object}
 * The callback execution context.
 *
 * @param [priority=0] {Number}
 * Lower numbers execute first.
 *
 * @return {platypus.EventHandler}
 * Returns the created EventHandler instance.
 */
prototype.add = function (callback, context, once, priority) {
    for (let i = 0; i < this.handlers.length; i++) {
        const existing = this.handlers[i];

        if (
            existing.callback === callback &&
            existing.context === context
        ) {
            return null;
        }
    }
    
    const
        eventHandler = EventHandler.setUp(
            callback,
            context,
            once,
            priority,
            this.orderIndex++
        );

    this.handlers.push(eventHandler);
    this.dirty = true;

    return eventHandler;
};

/**
 * Removes all handlers matching the supplied callback.
 *
 * @method remove
 * @param callback {Function}
 * @param context {Object}
 * The callback function to remove.
 */
prototype.remove = function (callback, context) {
    const
        {handlers} = this;
    let i = handlers.length;

    while (i--) {
        const
            handler = handlers[i];

        if (
            handler.callback === callback &&
            (
                typeof context === 'undefined' ||
                handler.context === context
            )
        ) {
            handler.recycle();
            greenSplice(handlers, i);
        }
    }
};

/**
 * Dispatches the event to all registered handlers.
 *
 * The handler list is shallow-copied before iteration
 * so listeners may safely remove themselves during dispatch.
 *
 * @method trigger
 * @param [args] {Array}
 * The arguments passed to listener callbacks.
 *
 * @return {Number}
 * Returns the number of handlers triggered.
 */
prototype.trigger = function (args) {
    if (this.dirty) {
        this.handlers.sort((a, b) => a.sortPriority(b));
        this.dirty = false;
    }

    const
        handlers = greenSlice(this.handlers),
        {length} = handlers;

    // This prevents event handlers from getting recycled in the handlers copy.
    for (let i = 0; i < length; i++) {
        handlers[i].recycleHold();
    }

    for (let i = 0; i < length; i++) {
        const
            {callback, context, once} = handlers[i];

        if (once) {
            this.remove(callback);
        }

        callback.apply(context, args);
    }

    for (let i = 0; i < length; i++) {
        handlers[i].recycleRelease();
    }

    arrayCache.recycle(handlers);

    return length;
};

/**
 * Returns EventHandlerList from cache or creates a new one.
 *
 * @method platypus.EventHandlerList.setUp
 * @return {platypus.EventHandlerList}
 */

/**
 * Returns EventHandlerList back to cache. If the instance has
 * outstanding holds, the recycle is deferred until all holds
 * are released.
 *
 * Prefer calling `eventHandlerList.recycle()`
 * instead of direct pool access.
 *
 * @method platypus.EventHandlerList.recycle
 * @param {platypus.EventHandlerList} eventHandlerList
 */

/**
 * Increments the hold count on the instance, preventing recycling
 * until all holds are released. Returns the instance for chaining.
 *
 * @method platypus.EventHandlerList.recycleHold
 * @param {platypus.EventHandlerList} eventHandlerList
 * @return {platypus.EventHandlerList}
 */

/**
 * Decrements the hold count. When it reaches zero, any pending
 * recycle is flushed. Returns the instance for chaining.
 *
 * @method platypus.EventHandlerList.recycleRelease
 * @param {platypus.EventHandlerList} eventHandlerList
 * @return {platypus.EventHandlerList}
 */

/**
 * Clears internal references and recycles the instance. If the
 * instance has outstanding holds, the recycle is deferred until
 * all holds are released.
 *
 * @method platypus.EventHandlerList#recycle
 */

/**
 * Increments the hold count on the instance, preventing recycling
 * until all holds are released. Returns the instance for chaining.
 *
 * @method platypus.EventHandlerList#recycleHold
 * @return {platypus.EventHandlerList}
 */

/**
 * Decrements the hold count. When it reaches zero, any pending
 * recycle is flushed. Returns the instance for chaining.
 *
 * @method platypus.EventHandlerList#recycleRelease
 * @return {platypus.EventHandlerList}
 */
recycle.add(
    EventHandlerList,
    'EventHandlerList',
    EventHandlerList,
    function () {
        this.handlers.forEach((handler) => handler.recycle());

        arrayCache.recycle(this.handlers);

        this.handlers = null;
        this.dirty = false;
        this.orderIndex = 0;
    },
    true
);

export default EventHandlerList;