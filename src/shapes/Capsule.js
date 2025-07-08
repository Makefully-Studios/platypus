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
    
    static validateDefinition (definition) {
        return Circle.validateDefinition(definition) && Segment.validateDefinition(definition);
    }
}