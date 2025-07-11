export default function adjustedXY (shape, {local = true, scale = 1}) {
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
}