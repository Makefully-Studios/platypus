import Point from "./Point";
import Segment from "./Segment";

export default class Polyline extends Segment {
    constructor (...args) {
        super(...args);
        this.type = 'polyline';
    }

    initialize (options) {
        super.initialize(options);
        this.segments = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            this.segments.push(new Segment({
                a: this.points[i],
                b: this.points[i + 1]
            }));
        }
    }

    forEach (func) {
        this.segments.forEach(func);
    }

    getLength () {
        return this.segments.reduce((sum, segment) => sum + segment.getLength(), 0);
    }

    duplicate () {
        return new Polyline(this);
    }

    static validateDefinition ({points} = {}) {
        const
            {length = 0} = points ?? [];

        if (length < 2) {
            return false;
        } else {
            for (let i = 0; i < length; i++) {
                const
                    point = points[i];

                if (!Point.validateDefinition(Array.isArray(point) ? {x: point[0], y: point[1]} : point)) {
                    return false;                    
                }
            }

            return true;
        }
    }
}