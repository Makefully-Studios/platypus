import {Vector, default as platypus} from 'platypus';
import checkPointsMap from './checkPointsMap';
import castToBox2D from './castToBox2D';
import castToPixiGraphics from './castToPixiGraphics';
import castToPixiShape from './castToPixiShape';

const
    ORIGIN = {x: 0, y: 0},
    PI2 = Math.PI * 2;

export default class Point {
    constructor (options) {
        this.type = 'point';
        this.registration = new Vector();
        Object.defineProperties(this, {
            rotation: {
                get () {
                    return (this.revolutions * PI2) % PI2;
                }
            },
            x: {
                get () {
                    const
                        {parent, registration: {x, y}, revolutions = 0} = this;

                    if (revolutions) {
                        const
                            {cos, sin} = this.getSinCos();

                        return parent.x + x * cos - y * sin;
                    } else {
                        return parent.x + x;
                    }
                }
            },
            y: {
                get () {
                    const
                        {parent, registration: {x, y}, revolutions = 0} = this;

                    if (revolutions) {
                        const
                            {cos, sin} = this.getSinCos();

                        return parent.y + x * sin + y * cos;
                    } else {
                        return parent.y + y;
                    }
                }
            }
        });
        this.initialize(options);
    }

    initialize ({parent, revolutions, rotation, x = 0, y = 0}) {
        this.parent = parent ?? ORIGIN;
        this.registration.x = x;
        this.registration.y = y;
        this.revolutions = revolutions ?? (rotation / PI2);
    }

    castToBox2D (...args) {
        return castToBox2D(this, ...args);
    }

    castToPixiShape (...args) {
        return castToPixiShape(this, ...args);
    }

    castToPixiGraphics (...args) {
        return castToPixiGraphics(this, ...args);
    }

    move ({x, y}) {
        this.registration.x = x;
        this.registration.y = y;
    }

    getClosestPoints (shape, offset) {
        let
            closestPoints = null;

        if (offset?.x ?? offset?.y) {
            const
                offsetShape = shape.duplicate();

            offsetShape.move(offset);
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