import adjustedXY from "./adjustedXY";
import Point from "./Point";

export default class Circle extends Point {
    constructor (...args) {
        super(...args);
        this.type = 'circle';
    }

    initialize (options) {
        super.initialize(options);
        this.radius = options.radius ?? 0;
    }

    duplicate () {
        return new Circle(this);
    }

    toObject (options) {
        const
            {radius, type} = this,
            {scale = 1} = options;

        return {
            radius: radius * scale,
            type,
            ...adjustedXY(this, options)
        };
    }

    static validateDefinition ({radius} = {}) {
        return typeof radius === 'number' && radius > 0;
    }
}