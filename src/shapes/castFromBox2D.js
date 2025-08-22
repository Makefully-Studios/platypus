import castFromObject from "./castFromObject";

/* global platypus */
const
    BOX2D_SHAPES = [
        'circle',
        'capsule',
        'segment',
        'polygon',
        'segment' // <-- unsure how to convert chain shape segment into its owning chain shape as a `polyline`, so it'll be converted to a segment. */
    ],
    castTo = {
        circle: (shapeId, {scale = 1} = {}) => {
            const
                {radius, center: {x, y}} = platypus.game.box2d.b2Shape_GetCircle(shapeId);

            return {
                radius: radius * scale,
                type: 'circle',
                x: x * scale,
                y: y * scale
            };
        },
        capsule: (shapeId, {scale = 1} = {}) => {
            const
                {radius, center1: {x: ax, y: ay}, center2: {x: bx, y: by}} = platypus.game.box2d.b2Shape_GetCapsule(shapeId);

            return {
                a: {
                    x: ax * scale,
                    y: ay * scale
                },
                b: {
                    x: bx * scale,
                    y: by * scale
                },
                radius: radius * scale,
                type: 'capsule'
            };
        },
        segment: (shapeId, {scale = 1} = {}) => {
            const
                {point1: {x: ax, y: ay}, point2: {x: bx, y: by}} = platypus.game.box2d.b2Shape_GetSegment(shapeId);

            return {
                a: {
                    x: ax * scale,
                    y: ay * scale
                },
                b: {
                    x: bx * scale,
                    y: by * scale
                },
                type: 'segment'
            };
        },
        polygon: (shapeId, {scale = 1} = {}) => {
            const
                poly = platypus.game.box2d.b2Shape_GetPolygon(shapeId),
                {count, radius} = poly,
                points = [];

            for (let i = 0; i < count; i++) {
                const
                    {x, y} = poly.GetVertex(i);

                points.push({
                    x: x * scale,
                    y: y * scale
                });
            }

            return {
                points,
                radius: radius * scale,
                type: 'polygon'
            };
        }
    };

export default function castFromBox2D (shapeId, options) {
    const
        {b2Shape_GetType} = platypus.game.box2d,
        shape = BOX2D_SHAPES[b2Shape_GetType(shapeId).value];

    if (shape) {
        return castFromObject(castTo[shape](shapeId, options));
    } else {
        platypus.debug.warn(`Unable to cast shape of type "${shape}" from Box2D.`, shape);
        return null;
    }
}
