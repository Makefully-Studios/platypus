import adjustedXY from "./adjustedXY";
import Circle from "./Circle";
import Rectangle from "./Rectangle";
import Segment from "./Segment";

const
    axisInfo = {
        x: {
            axis: 'x',
            alt: 'y',
            length: 'width',
            breadth: 'height'
        },
        y: {
            axis: 'y',
            alt: 'x',
            length: 'height',
            breadth: 'width' 
        }
    };

export default class Capsule extends Segment {
    constructor (...args) {
        super(...args);
        this.type = 'capsule';
    }

    initialize (options) {
        if (!options.points && (!options.a || !options.b) && options.width && options.height) {
            const
                {alt, axis, breadth, length} = axisInfo[options.width > options.height ? 'x' : 'y'],
                radius = options[breadth] / 2,
                len = options[length] - 2 * radius,
                hl = len / 2;

            super.initialize({
                ...options,
                a: {
                    [axis]: -hl,
                    [alt]: 0
                },
                b: {
                    [axis]: hl,
                    [alt]: 0
                }
            });
            this.radius = radius;
        } else {
            super.initialize(options);
            this.radius = options.radius ?? 0;
        }
    }

    duplicate () {
        return new Capsule(this);
    }

    toObject (options) {
        const
            {a, b, radius, type} = this,
            {scale = 1} = options;

        return {
            a: adjustedXY(a, options),
            b: adjustedXY(b, options),
            radius: radius * scale,
            type
        };
    }

    static validateDefinition (definition) {
        return Rectangle.validateDefinition(definition) || (Circle.validateDefinition(definition) && Segment.validateDefinition(definition));
    }
}