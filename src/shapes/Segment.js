import Point from './Point';
import Vector from '../Vector';

export default class Segment extends Point {
    constructor (...args) {
        super(...args);
        this.type = 'segment';
        this._points = null;
    }

    get a () {
        return this.points[0];
    }

    get b () {
        return this.points[this.points.length - 1];
    }

    get points () {
        if (!this._points) {
            const
                {revolutions, x: X, y: Y} = this;
                
            if (revolutions % 1) {
                const
                    {cos, sin} = this.getSinCos();

                this._points = this._vectors.map(({x, y}) => new Point({
                    x: X + x * cos - y * sin,
                    y: Y + x * sin + y * cos
                }));
            } else {
                this._points = this._vectors.map(({x, y}) => new Point({
                    x: X + x,
                    y: Y + y
                }));
            }
        }
        return this._points;
    }

    get vectors () {
        return this._vectors;
    }

    initialize (options) {
        const
            {a, b, points, revolutions = 0, x = 0, y = 0} = options;

        super.initialize(options);

        if (revolutions % 1) {
            const
                {cos, sin} = this.getSinCos();

            this._vectors = (points ?? [a, b]).map((point) => {
                if (Array.isArray(point)) {
                    return new Vector(point[0] * cos + point[1] * sin - x, -point[0] * sin + point[1] * cos - y);
                } else {
                    return new Vector(point.x * cos + point.y * sin - x, -point.x * sin + point.y * cos - y);
                }
            });
        } else {
            this._vectors = (points ?? [a, b]).map((point) => {
                if (Array.isArray(point)) {
                    return new Vector(point[0] - x, point[1] - y);
                } else {
                    return new Vector(point.x - x, point.y - y);
                }
            });
        }
    }

    getLength () {
        const
            {a, b} = this;

        return Math.hypot(b.x - a.x, b.y - a.y);
    }

    intersects ({a: c, b: d}) {
        const
            ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x),
            {a, b} = this;

        return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
    }

    duplicate () {
        return new Segment(this);
    }

    moveX (x) {
        super.moveX(x);
        this._points = null;
    }

    moveY (y) {
        super.moveY(y);
        this._points = null;
    }

    toArray (local = false) {
        if (local) {
            return this.vectors.map(({x, y}) => new Vector(x, y));
        } else {
            return this.points.map(({x, y}) => new Point({
                x,
                y
            }));
        }
    }

    toArray1D (local = false) {
        if (local) {
            return this.vectors.reduce((arr, {x, y}) => {
                arr.push(x, y);
                return arr
            }, []);
        } else {
            return this.points.reduce((arr, {x, y}) => {
                arr.push(x, y);
                return arr
            }, []);
        }
    }

    toArray2D (local = false) {
        if (local) {
            return this.vectors.map(({x, y}) => ([x, y]));
        } else {
            return this.points.map(({x, y}) => ([x, y]));
        }
    }

    toObject (options) {
        const
            {a, b, type} = this;

        return {
            a: adjustedXY(a, options),
            b: adjustedXY(b, options),
            type
        };
    }

    static validateDefinition ({a, b, points} = {}) {
        const
            ab = points ?? [a, b];

        if (ab.length !== 2) {
            return false;
        } else {
            const
                A = Array.isArray(ab[0]) ? {x: ab[0][0], y: ab[0][1]} : ab[0],
                B = Array.isArray(ab[1]) ? {x: ab[1][0], y: ab[1][1]} : ab[1];

            return Point.validateDefinition(A) && Point.validateDefinition(B) && (A.x !== B.x || A.y !== B.y);
        }
    }
}