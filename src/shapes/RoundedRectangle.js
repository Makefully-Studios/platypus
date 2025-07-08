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

    static validateDefinition (definition) {
        return Circle.validateDefinition(definition) && Rectangle.validateDefinition(definition);
    }
}