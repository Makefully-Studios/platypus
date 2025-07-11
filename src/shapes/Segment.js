import Point from './Point';

export default class Segment extends Point {
    constructor (...args) {
        super(...args);
        this.type = 'segment';
    }

    initialize (options) {
        const
            {a, b, points} = options;

        super.initialize(options);
        this.points = (points ?? [a, b]).map((point) => {
            if (Array.isArray(point)) {
                return new Point({
                    parent: this,
                    x: point[0],
                    y: point[1]
                });
            } else {
                return new Point({
                    parent: this,
                    x: point.x,
                    y: point.y
                });
            }
        });
        Object.defineProperties(this, {
            a: {
                get () {
                    return this.points[0];
                }
            },
            b: {
                get () {
                    return this.points[1];
                }
            }
        });
    }

    getLength () {
        const
            {a, b} = this;

        return Math.hypot(b.x - a.x, b.y - a.y);
    }

    duplicate () {
        return new Segment(this);
    }

    toArray () { // sets origin to 0, 0 on returned array
        return this.points.map(({x, y}) => new Point({
            x,
            y
        }));
    }

    toArray1D (local = false) {
        if (local) {
            return this.points.reduce((arr, {registration: {x, y}}) => {
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
        return this.points.map((point) => point.toArray(local));
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