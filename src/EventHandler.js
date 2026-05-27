import recycle from 'recycle';

/**
 * Represents a single event subscription entry used by the event system.
 *
 * EventHandler instances are stored inside event emitter structures and
 * sorted using `priority` and `order` to determine execution sequence.
 *
 * Higher priority values execute before lower ones. When priorities match,
 * `order` acts as a stable tie-breaker preserving insertion sequence.
 *
 * Instances are pooled through `recycle` to reduce GC pressure in hot loops.
 *
 * @memberof platypus
 * @class EventHandler
 *
 * @param {Function} callback Function invoked when the event fires.
 * @param {Object} context Value used as `this` inside callback execution.
 * @param {Number} priority Execution priority (higher runs first).
 * @param {Number} order Stable ordering index used when priorities match.
 *
 * @property {Function} callback
 * @property {Object} context
 * @property {Number} priority
 * @property {Number} order
 */
const EventHandler = function (callback, context = null, once = false, priority = 0, order = 0) {
    this.callback = callback;
    this.context = context;
    this.once = once;
    this.priority = priority;
    this.order = order;
};

const { prototype } = EventHandler;

/**
 * Comparator used for sorting event handlers.
 *
 * Returns a negative number if this handler should run before the other.
 * Returns a positive number if it should run after.
 * Returns 0 when equivalent.
 *
 * Sorting rule:
 * 1. higher priority runs first
 * 2. if equal, lower order runs first
 */
prototype.sortPriority = function (eventHandler) {
    return (this.priority - eventHandler.priority) || (this.order - eventHandler.order);
};

/**
 * Returns EventHandler from cache or creates a new one.
 *
 * @method platypus.EventHandler.setUp
 * @return {platypus.EventHandler}
 */

/**
 * Returns EventHandler back to cache. If the instance has
 * outstanding holds, the recycle is deferred until all holds
 * are released.
 *
 * Prefer calling `eventHandler.recycle()`
 * instead of direct pool access.
 *
 * @method platypus.EventHandler.recycle
 * @param {platypus.EventHandler} eventHandler
 */

/**
 * Increments the hold count on the instance, preventing recycling
 * until all holds are released. Returns the instance for chaining.
 *
 * @method platypus.EventHandler.recycleHold
 * @param {platypus.EventHandler} eventHandler
 * @return {platypus.EventHandler}
 */

/**
 * Decrements the hold count. When it reaches zero, any pending
 * recycle is flushed. Returns the instance for chaining.
 *
 * @method platypus.EventHandler.recycleRelease
 * @param {platypus.EventHandler} eventHandler
 * @return {platypus.EventHandler}
 */

/**
 * Clears internal references and recycles the instance. If the
 * instance has outstanding holds, the recycle is deferred until
 * all holds are released.
 *
 * @method platypus.EventHandler#recycle
 */

/**
 * Increments the hold count on the instance, preventing recycling
 * until all holds are released. Returns the instance for chaining.
 *
 * @method platypus.EventHandler#recycleHold
 * @return {platypus.EventHandler}
 */

/**
 * Decrements the hold count. When it reaches zero, any pending
 * recycle is flushed. Returns the instance for chaining.
 *
 * @method platypus.EventHandler#recycleRelease
 * @return {platypus.EventHandler}
 */

recycle.add(EventHandler, 'EventHandler', EventHandler, null, true);

export default EventHandler;