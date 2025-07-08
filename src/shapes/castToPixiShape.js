import {default as platypus} from 'platypus';
import {Circle, Ellipse, Point, Polygon, Rectangle, RoundedRectangle} from 'pixi.js';

const
    adjustedXY = (shape, {local = true, scale = 1}) => {
        if (local) {
            const
                {registration: {x, y}} = shape;

            return {
                x: x * scale,
                y: y * scale
            };
        } else {
            const
                {x, y} = shape;

            return {
                x: x * scale,
                y: y * scale
            };
        }
    },
    casts = {
        circle: (shape, options) => {
            const
                {radius} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);
                
            return new Circle(x, y, radius * scale);
        },
        ellipse: (shape, options) => {
            const
                {halfHeight, halfWidth} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);
                
            return new Ellipse(x, y, halfWidth * scale, halfHeight * scale);
        },
        point: (shape, options) => {
            const
                {x, y} = adjustedXY(shape, options);

            return new Point(x, y);
        },
        polygon: (shape, {local = true, scale = 1}) => {
            return new Polygon(shape.toArray1D(local).map((c) => c * scale));
        },
        rectangle: (shape, options) => {
            const
                {height, width} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);

            return new Rectangle(x, y, width * scale, height * scale);
        },
        roundedRectangle: (shape, options) => {
            const
                {height, radius, width} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);

            return new RoundedRectangle(x, y, width * scale, height * scale, radius * scale);
        }
    };

export default function castToPixiShape (shape, options) {
    const
        {type} = shape,
        cast = casts[type];

    if (cast) {
        return cast(shape, options);
    } else {
        platypus.debug.warn(`Unable to cast shape of type "${type}" to Pixi Shape.`, shape);
        return null;
    }
}