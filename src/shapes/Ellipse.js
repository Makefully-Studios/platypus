import Capsule from "./Capsule";
import Rectangle from "./Rectangle";
import Segment from "./Segment";

export default class Ellipse extends Segment {
    constructor (...args) {
        super(...args);
        this.type = 'ellipse';
        Object.defineProperties(this, {
            halfHeight: {
                get () {
                    return this.height / 2;
                },
                set (hh) {
                    this.height = hh * 2;
                }
            },
            halfWidth: {
                get () {
                    return this.width / 2;
                },
                set (hw) {
                    this.width = hw * 2;
                }
            }
        });
    }

    initialize (options) {
        const
            {a, b, height, points, width} = options;

        if (!points && !(a && b)) {
            const
                hw = width / 2,
                hh = height / 2;
                
            if (width > height) {
                const
                    c = Math.sqrt(hw * hw - hh * hh);

                super.initialize({
                    ...options,
                    a: {x: -c, y: 0},
                    b: {x: c, y: 0}
                });
            } else {
                const
                    c = Math.sqrt(hh * hh - hw * hw);

                super.initialize({
                    ...options,
                    a: {x: 0, y: -c},
                    b: {x: 0, y: c}
                });
            }
        } else {
            super.initialize(options);
        }
        this.height = height;
        this.width = width;
        Object.defineProperties(this, {
            constantSumOfDistances: {
                get () {
                    return Math.max(this.width, this.height);
                }
            }
        });

        //TODO: accept rotation
    }

    toCapsule () {
        const
            {a, b, constantSumOfDistances, width, height} = this,
            hw = width / 2,
            hh = height / 2,
            radius = (width > height) ? hh : hw,
            eOffset = this.getLength(),
            cOffset = constantSumOfDistances - radius - radius,
            ratio = cOffset / eOffset;

        return new Capsule({
            a: {
                x: a.x * ratio,
                y: a.y * ratio
            },
            b: {
                x: b.x * ratio,
                y: b.y * ratio
            },
            radius
        });
    }

    duplicate () {
        return new Ellipse(this);
    }

    static validateDefinition (definition) {
        return Rectangle.validateDefinition(definition);
    }
}