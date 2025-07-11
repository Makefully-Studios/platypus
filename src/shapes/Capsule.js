import adjustedXY from "./adjustedXY";
import Circle from "./Circle";
import Segment from "./Segment";

export default class Capsule extends Segment {
    constructor (...args) {
        super(...args);
        this.type = 'capsule';
    }

    initialize (options) {
        super.initialize(options);
        this.radius = options.radius;
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
        return Circle.validateDefinition(definition) && Segment.validateDefinition(definition);
    }
}