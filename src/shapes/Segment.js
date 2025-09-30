import Point from './Point';
import Vector from '../Vector';

const
    EPSILON = 1e-10;

export default class Segment extends Point {
    constructor (...args) {
        super(...args);
        this.type = 'segment';
        this._points = null;
        this._revolutions = 0;
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

    get revolutions () {
        return this._revolutions;
    }

    set revolutions (revolutions) {
        if (this._revolutions !== revolutions) {
            this._points = null; // need to recalculate if they exist.
            this._revolutions = revolutions;
        }
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

    getIntersection (segment, {intersectsLine = false, segmentIsLine = false}) {
        // Solve line intersection using determinants
        const
            {a, b} = this,
            {a: c, b: d} = segment,
            dabx = a.x - b.x,
            daby = a.y - b.y,
            dcdx = c.x - d.x,
            dcdy = c.y - d.y,
            det = dabx * dcdy - daby * dcdx;

        if (Math.abs(det) < EPSILON) {
            return null; // parallel or coincident
        } else {
            const
                projection = (a, b, v) => (a.x - b.x) * v.x + (a.y - b.y) * v.y,
                daxbyaybx = a.x * b.y - a.y * b.x,
                dcxdycydx = c.x * d.y - c.y * d.x,
                xy = new Point({
                    x: (daxbyaybx * dcdx - dabx * dcxdycydx) / det,
                    y: (daxbyaybx * dcdy - daby * dcxdycydx) / det
                });

            if (!intersectsLine) {
                const
                    v = this.getVector(),
                    proj = projection(xy, a, v),
                    min = Math.min(0, projection(b, a, v)),
                    max = Math.max(0, projection(b, a, v));

                v.recycle();

                if (proj < min - EPSILON || proj > max + EPSILON) {
                    return null;
                }
            }

            // Clamp against "segment" unless infinite
            if (!segmentIsLine) {
                const
                    v = segment.getVector(),
                    proj = projection(xy, c, v),
                    min = Math.min(0, projection(d, c, v)),
                    max = Math.max(0, projection(d, c, v));

                v.recycle();

                if (proj < min - EPSILON || proj > max + EPSILON) {
                    return null;
                }
            }

            return xy;
        }
    }

    getVector () {
        const
            {a, b} = this;

        return Vector.setUp(b.x - a.x, b.y - a.y);
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

    reflect (point) {
        const
            {a, b} = this,
            segment = Vector.setUp(b.x - a.x, b.y - a.y),
            aToPoint = Vector.setUp(point.x - a.x, point.y - a.y),
            dot = segment.x * aToPoint.x + segment.y * aToPoint.y,
            segmentSqr = segment.x * segment.x + segment.y * segment.y,
            projectionFactor = dot / segmentSqr,
            projectionOfPoint = Vector.setUp(a.x + projectionFactor * segment.x, a.y + projectionFactor * segment.y),
            reflection = new Point({
                x: 2 * projectionOfPoint.x - point.x,
                y: 2 * projectionOfPoint.y - point.y
            });

        segment.recycle();
        aToPoint.recycle();
        projectionOfPoint.recycle();

        return reflection;
    }

    isCollinear (segment, {epsilon = EPSILON} = {}) {
        const
            {a, b} = this,
            {a: c, b: d} = segment,
            orient = (p, q, r) => (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y),
            aOrient = orient(c, d, a),
            bOrient = orient(c, d, b);

        return Math.abs(aOrient) < epsilon && Math.abs(bOrient) < epsilon;
    }

    bisect (segment, options) {
        const
            {a, b} = this,
            {a: c, b: d} = segment,
            v = segment.getVector(),
            orient = (p, q, r) => (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y),
            aOrient = orient(c, d, a),
            bOrient = orient(c, d, b);

        if (Math.abs(aOrient) < EPSILON && Math.abs(bOrient) < EPSILON) {
            // collinear bisect
            const
                projection = (a) => (a.x - c.x) * v.x + (a.y - c.y) * v.y,
                magA = projection(a),
                magB = projection(b),
                magC = projection(c),
                magD = projection(d),
                segmentMin = Math.min(magC, magD),
                segmentMax = Math.max(magC, magD),
                myMin = Math.min(magA, magB),
                myMax = Math.max(magA, magB);

            if (myMax < segmentMin) {
                return [this, null];
            } else if (myMin > segmentMax) {
                return [null, this];
            } else if (myMin >= segmentMin && myMax <= segmentMax) {
                return [null, null]
            } else {
                // using unnormalized projection, so divide by |v|²
                const
                    len2 = v.x * v.x + v.y * v.y;

                return [
                    magA < segmentMin ? new Segment({
                        a,
                        b: {
                            x: c.x + (segmentMin / len2) * v.x,
                            y: c.y + (segmentMin / len2) * v.y
                        }
                    }) : null,
                    magB > segmentMax ? new Segment({
                        a: {
                            x: c.x + (segmentMax / len2) * v.x,
                            y: c.y + (segmentMax / len2) * v.y
                        },
                        b
                    }) : null
                ]
            }
        } else if (aOrient > -EPSILON && bOrient > -EPSILON) {
            return [this, null];
        } else if (aOrient < EPSILON && bOrient < EPSILON) {
            return [null, this];
        } else {
            const
                intersection = this.getIntersection(segment, options);

            if (!intersection) {
                 // no split, return identity
                if (aOrient > 0) {
                    return [this, null];
                } else {
                    return [null, this];
                }
            } else {
                const
                    left = new Segment({a, b: intersection}),
                    right = new Segment({a: intersection, b});

                return aOrient > 0 ? [left, right] : [right, left];
            }
        }
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