import castFromObject from "./castFromObject";

/* global platypus */
const
    castTo = {
        circle: (shape, {scale = 1}) => {
            const
                {radius, type, x, y} = shape;
                
            return {
                radius: radius * scale,
                type,
                x: x * scale,
                y: y * scale
            };
        },
        ellipse: (shape, {scale = 1}) => {
            const
                {halfHeight, halfWidth, type, x, y} = shape;
                
            return {
                height: halfHeight * 2 * scale,
                type,
                width: halfWidth * 2 * scale,
                x: x * scale,
                y: y * scale
            };
        },
        point: (shape, {scale = 1}) => {
            const
                {x, y} = shape;
                
            return {
                type: 'point',
                x: x * scale,
                y: y * scale
            };
        },
        polygon: (shape, {scale = 1}) => {
            const
                {closePath, points} = shape;
                
            return {
                type: closePath ? 'polygon' : 'polyline',
                points: points.map(({x, y}) => ({
                    x: x * scale,
                    y: y * scale
                }))
            };
        },
        rectangle: (shape, {scale = 1}) => {
            const
                {height, type, width, x, y} = shape;

            return {
                height: height * scale,
                type,
                width: width * scale,
                x: x * scale,
                y: y * scale
            };
        },
        roundedRectangle: (shape, {scale = 1}) => {
            const
                {height, radius, type, width, x, y} = shape;

            return {
                height: height * scale,
                radius: radius * scale,
                type,
                width: width * scale,
                x: x * scale,
                y: y * scale
            };
        }
    };

export default function castFromPixiShape (shape, options) {
    const
        {type} = shape,
        cast = typeof type === 'string' ? castTo[type] : castTo.point;

    if (cast) {
        return castFromObject(cast(shape, options));
    } else {
        platypus.debug.warn(`Unable to cast shape of type "${type}" from Box2D.`, shape);
        return null;
    }
}
