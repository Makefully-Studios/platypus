import recycle from 'recycle';
import { arrayCache } from './utils/array';
import TimeEvent from './TimeEvent';

const
    TimeEventList = function (list = [], time = 0) {
        if (!this.list) {
            this.list = arrayCache.setUp();
        }

        this.addEvents(list);
        this.time = time;
    },
    sortByTime = function (a, b) {
        return a.time - b.time;
    },
    proto = TimeEventList.prototype;

proto.clear = function (list) {
    return this.getEvents(Infinity, list);
};

proto.addEvents = function (list, time = 0) {
    const
        {list: timeList} = this,
        arr = arrayCache.setUp();

    list.forEach((entry) => {
        if (typeof entry === 'number') {
            time += entry;
        } else if (entry instanceof TimeEvent) {
            timeList.push(entry);
            arr.push(entry);
        } else {
            const
                event = TimeEvent.setUp(entry, time);

            timeList.push(event);
            arr.push(event);
        }
    });

    timeList.sort(sortByTime);

    return arr;
};

proto.getEvents = function (time, limitToThese) {
    const
        arr = arrayCache.setUp(),
        {list} = this;

    this.time = time;

    while (list.length && list[0].time <= time) {
        if (!limitToThese || limitToThese.indexOf(list[0]) >= 0) {
            arr.push(list.shift());
        }
    }

    return arr;
}

proto.getDuration = function () {
    return list.length ? list[list.length - 1].time : 0;
}

proto.update = function (delta) {
    return this.getEvents(this.time + delta);
};

proto.toJSON = function () {
    return this.list.map((entry) => entry.toJSON());
};

/**
 * Returns a TimeEventList from cache or creates a new one if none are available.
 *
 * @method platypus.TimeEventList.setUp
 * @return {platypus.TimeEventList} The instantiated TimeEventList.
 */
/**
 * Returns a TimeEventList back to the cache.
 *
 * @method platypus.TimeEventList.recycle
 * @param {platypus.TimeEventList} timeEvent The TimeEventList to be recycled.
 */
/**
 * Relinquishes properties of the TimeEventList and recycles it.
 *
 * @method platypus.TimeEventList#recycle
 */
recycle.add(TimeEventList, 'TimeEventList', TimeEventList, function () {
        this.list.length = 0;
    }, true);

export default TimeEventList;