import Point from "./Point";

export default class Circle extends Point {
    constructor (...args) {
        super(...args);
        this.type = 'circle';
    }

    initialize (options) {
        super.initialize(options);
        this.radius = options.radius;
    }

    duplicate () {
        return new Circle(this);
    }
    
    static validateDefinition ({radius} = {}) {
        return typeof radius === 'number' && radius > 0;
    }
}