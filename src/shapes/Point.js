/* global platypus */
import Vector from '../Vector';
import checkPointsMap from './checkPointsMap';
import adjustedXY from './adjustedXY';
import castToPixiShape from './castToPixiShape';
import castToPixiGraphics from './castToPixiGraphics';
import castToBox2D from './castToBox2D';

const
    PI2 = Math.PI * 2;

export default class Point {
    constructor (options) {
        this.type = 'point';
        this.registration = new Vector();
        this.initialize(options);
    }

    get rotation () {
        return (this.revolutions * PI2) % PI2;
    }

    set rotation (rotation) {
        this.revolutions = rotation / PI2;
    }

    get x () {
        return this.registration.x;
    }

    set x (x) {
        this.moveX(x);
    }

    get y () {
        return this.registration.y;
    }

    set y (y) {
        this.moveY(y);
    }

    initialize ({revolutions, rotation = 0, x = 0, y = 0}) {
        this.moveX(x);
        this.moveY(y);
        this.revolutions = revolutions ?? (rotation / PI2);
    }

    // "to" castings (toObject must be defined by inheriting classes)

    toBox2D (...args) {
        return castToBox2D(this, ...args);
    }

    toJSON (options, ...args) {
        return JSON.stringify(this.toObject(options), ...args);
    }

    toObject (options) {
        const
            {type} = this;

        return {
            type,
            ...adjustedXY(this, options)
        };
    }

    toPixiShape (...args) {
        return castToPixiShape(this, ...args);
    }

    toPixiGraphics (...args) {
        return castToPixiGraphics(this, ...args);
    }

    move ({x, y}) {
        this.moveX(x);
        this.moveY(y);
    }

    moveX (x) {
        this.registration.x = x;
    }

    moveY (y) {
        this.registration.y = y;
    }

    shift ({x, y}) {
        this.shiftX(x);
        this.shiftY(y);
    }

    shiftX (x) {
        this.moveX(this.x + x);
    }

    shiftY (y) {
        this.moveY(this.y + y);
    }

    checkVisibility (shapes) {
        const
            segments = shapes.reduce((list, shape) => {
                const
                    {segments} = shape;

                if (segments) {
                    list.push(...segments);
                } else {
                    list.push(shape)
                }

                return list;
            }, []);

        return segments.filter((seg) => {
            // Midpoint of segment
            const
                mid = seg.a && seg.b ? {
                    x: (seg.a.x + seg.b.x) / 2,
                    y: (seg.a.y + seg.b.y) / 2
                } : seg;

            return !segments.some((blocker) => (seg !== blocker) && blocker.intersects?.({a: this, b: mid}));
        });
    }

    getClosestPoints (shape, offset) {
        let
            closestPoints = null;

        if (offset?.x ?? offset?.y) {
            const
                offsetShape = shape.duplicate();

            offsetShape.shift(offset);
            closestPoints = checkPointsMap[offsetShape.type]?.[this.type]?.(offsetShape, this) ?? null;
            //TODO: discard/recycle shape
        } else {
            closestPoints = checkPointsMap[shape.type]?.[this.type]?.(shape, this) ?? null;
        }

        if (!closestPoints) {
            platypus.debug.warn(`No closest point support for "${checkPointsMap[shape.type] ? this.type : shape.type}" shapes.`);
        }

        return closestPoints;
    }

    duplicate () {
        return new Point(this);
    }

    getRadians () {
        return this.revolutions * PI2;
    }

    getDegrees () {
        return this.revolutions * 360;
    }

    getSinCos () {
        const
            {rotation} = this;

        return {
            sin: Math.sin(rotation),
            cos: Math.cos(rotation)
        };
    }

    toArray (local = false) {
        if (local) {
            const
                {registration: {x, y}} = this;

            return [x, y];
        } else {
            const
                {x, y} = this;

            return [x, y];
        }
    }

    static validateDefinition ({x, y} = {}) {
        return typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y);
    }
}