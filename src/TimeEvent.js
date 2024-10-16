import recycle from 'recycle';

const
    TimeEvent = function (event = '', time = 0, message = null, entity = null, interruptable = true) {
        if (typeof event === 'object') {
            this.event = event.event ?? '';
            this.message = event.message ?? message;
            this.time = (event.time ?? 0) + time;
            this.entity = event.entity ?? entity;
            this.interruptable = event.interruptable ?? interruptable;
        } else {
            this.event = event;
            this.message = message;
            this.time = time;
            this.entity = entity;
            this.interruptable = interruptable;
        }
    },
    proto = TimeEvent.prototype;

proto.toJSON = function () {
    return {
        event: this.event,
        message: this.message,
        time: this.time,
        entity: entity.id ?? entity,
        interruptable: this.interruptable
    };
};

/**
 * Returns a TimeEvent from cache or creates a new one if none are available.
 *
 * @method platypus.TimeEvent.setUp
 * @return {platypus.TimeEvent} The instantiated TimeEvent.
 */
/**
 * Returns a TimeEvent back to the cache.
 *
 * @method platypus.TimeEvent.recycle
 * @param {platypus.TimeEvent} timeEvent The TimeEvent to be recycled.
 */
/**
 * Relinquishes properties of the TimeEvent and recycles it.
 *
 * @method platypus.TimeEvent#recycle
 */
recycle.add(TimeEvent, 'TimeEvent', TimeEvent, null, true);

export default TimeEvent;