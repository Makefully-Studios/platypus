import Circle from "./Circle";
import Rectangle from "./Rectangle";

export default class RoundedRectangle extends Rectangle {
    constructor (...args) {
        super(...args);
        this.type = 'roundedRectangle';
    }

    initialize (options) {
        super.initialize(options);
        this.radius = options.radius;
    }

    duplicate () {
        return new RoundedRectangle(this);
    }

    toObject (options) {
        const
            {radius} = this,
            {scale} = options;

        return {
            ...super.toObject(options),
            radius: radius * scale
        }
    }

    static validateDefinition (definition) {
        return Circle.validateDefinition(definition) && Rectangle.validateDefinition(definition);
    }
}