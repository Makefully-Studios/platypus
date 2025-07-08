import {default as platypus} from 'platypus';
import {Graphics} from 'pixi.js';

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
    finish = (gfx, {fill, stroke}) => {
        if (fill) {
            gfx.fill(fill);
        }
        if (stroke) {
            gfx.stroke(stroke);
        }
        return gfx;
    },
    casts = {
        circle: (shape, options) => {
            const
                gfx = new Graphics(),
                {radius} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);

            gfx.circle(x, y, radius * scale);
            
            return finish(gfx, options);
        },
        ellipse: (shape, options) => {
            const
                gfx = new Graphics(),
                {halfHeight, halfWidth} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);
                
            gfx.ellipse(x, y, halfWidth * scale, halfHeight * scale);

            return finish(gfx, options);
        },
        point: (shape, options) => {
            const
                gfx = new Graphics(),
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);

            gfx.circle(x, y, scale);
            
            return finish(gfx, options);
        },
        polygon: (shape, options) => {
            const
                gfx = new Graphics();

            gfx.poly(shape.points.map((point) => adjustedXY(point, options)), true);

            return finish(gfx, options);
        },
        polyline: (shape, options) => {
            const
                gfx = new Graphics();

            gfx.poly(shape.points.map((point) => adjustedXY(point, options)), false);

            return finish(gfx, options);
        },
        rectangle: (shape, options) => {
            const
                gfx = new Graphics(),
                {height, width} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);

            gfx.rect(x, y, width * scale, height * scale);

            return finish(gfx, options);
        },
        roundedRectangle: (shape, options) => {
            const
                gfx = new Graphics(),
                {height, radius, width} = shape,
                {scale = 1} = options,
                {x, y} = adjustedXY(shape, options);

            gfx.filletRect(x, y, width * scale, height * scale, -radius * scale);

            return finish(gfx, options);
        }
    };

export default function castToPixiGraphics (shape, options) {
    const
        {type} = shape,
        cast = casts[type];

    if (cast) {
        return cast(shape, options);
    } else {
        platypus.debug.warn(`Unable to cast shape of type "${type}" to Pixi Graphics.`, shape);
        return null;
    }
}