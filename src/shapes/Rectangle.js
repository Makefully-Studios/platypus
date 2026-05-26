import Polygon from "./Polygon";

const
    errDelta = 0.0001,
    isRectangle = ({x: ax, y: ay}, {x: bx, y: by}, {x: cx, y: cy}, {x: dx, y: dy}) => {
        const
            sqr = (a) => a * a,
            x = (ax + bx + cx + dx) / 4,
            y = (ay + by + cy + dy) / 4,
            asqr = sqr(x - ax) + sqr(y - ay),
            bsqr = sqr(x - bx) + sqr(y - by),
            csqr = sqr(x - cx) + sqr(y - cy),
            dsqr = sqr(x - dx) + sqr(y - dy);

      return Math.abs(asqr - bsqr) < errDelta &&
            Math.abs(asqr - csqr) < errDelta &&
            Math.abs(asqr - dsqr) < errDelta;
    };

export default class Rectangle extends Polygon {
    constructor (...args) {
        super(...args);
        this.type = 'rectangle';
    }

    get halfHeight () {
        return this.height / 2;
    }

    set halfHeight (hh) {
        this.height = hh * 2;
    }

    get halfWidth () {
        return this.width / 2;
    }
    
    set halfWidth (hw) {
        this.width = hw * 2;
    }

    initialize (options) {
        const
            {anchor: {x: ax, y: ay} = {x: 0, y: 0}, height, width, x = 0, y = 0} = options,
            left = x - ax * width,
            top = y - ay * height,
            right = x + (1 - ax) * width,
            bottom = y + (1 - ay) * height;

        this.width = width;
        this.height = height;

        super.initialize({
            ...options,
            points: [{
                x: left,
                y: top
            }, {
                x: right,
                y: top
            }, {
                x: right,
                y: bottom
            }, {
                x: left,
                y: bottom
            }]
        });
    }

    duplicate () {
        return new Rectangle(this);
    }

    static validateDefinition ({height, width, points} = {}) {
        return typeof height === 'number' && height > 0 && typeof width === 'number' && width > 0 && (!points || ((points.length === 4) && isRectangle(...points)));
    }
}