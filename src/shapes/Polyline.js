import Point from "./Point";
import Segment from "./Segment";

export default class Polyline extends Segment {
    constructor (...args) {
        super(...args);
        this.type = 'polyline';
        this._segments = null;
    }

    get loop () {
        return this._loop;
    }

    set loop (loop) {
        const
            newValue = !!loop;

        if (newValue !== this._loop) {
            this._loop = newValue;
            this._segments = null;
        }
    }

    get segments () {
        if (!this._segments) {
            const
                {points} = this,
                segments = [];

            for (let i = 0; i < points.length - 1; i++) {
                segments.push(new Segment({
                    a: points[i],
                    b: points[i + 1]
                }));
            }

            if (this.loop) {
                segments.push(new Segment({
                    a: points[points.length - 1],
                    b: points[0]
                }));
            }

            this._segments = segments;
        }

        return this._segments;
    }
    
    initialize (options) {
        super.initialize(options);
        this._loop = options.loop ?? false;
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
    
    toObject (options) {
        const
            {points, type} = this;

        return {
            points: points.map((point) => adjustedXY(point, options)),
            type
        };
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