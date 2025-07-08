/* global platypus */

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
    formatChainSD = (box2d, shapeDefinition) => {
        const
            {b2DefaultChainDef} = box2d;

        if (shapeDefinition instanceof b2DefaultChainDef) {
            return shapeDefinition;
        } else {
            const
                {
                    enableSensorEvents = false,
                    filter,
                    isLoop = false,
                    materials,
                    points
                } = shapeDefinition,
                csd = new b2DefaultChainDef();

            if (filter) {
                csd.filter.categoryBits = filter.categoryBits ?? 0;
                csd.filter.groupIndex = filter.groupIndex ?? 0;
                csd.filter.maskBits = filter.maskBits ?? 0xffff;
            }

            csd.SetMaterials(materials);
            csd.SetPoints(points);

            csd.enableSensorEvents = enableSensorEvents;
            csd.isLoop = isLoop;
            
            return csd;
        }
    },
    formatSD = (box2d, shapeDefinition) => {
        const
            {b2DefaultShapeDef} = box2d;

        if (shapeDefinition instanceof b2DefaultShapeDef) {
            return shapeDefinition;
        } else {
            const
                {
                    density = 1,
                    enableContactEvents = false,
                    enableHitEvents = false,
                    enablePreSolveEvents = false,
                    enableSensorEvents = false,
                    filter,
                    invokeContactCreation = false,
                    isSensor = false,
                    material,
                    updateBodyMass = true
                } = shapeDefinition,
                sd = new b2DefaultShapeDef();

            if (filter) {
                sd.filter.categoryBits = filter.categoryBits ?? 0;
                sd.filter.groupIndex = filter.groupIndex ?? 0;
                sd.filter.maskBits = filter.maskBits ?? 0xffff;
            }

            if (material) {
                sd.material.customColor = material.customColor ?? 0;
                sd.material.friction = material.friction ?? 0.5;
                sd.material.restitution = material.restitution ?? 0.2;
                sd.material.rollingResistance = material.rollingResistance ?? 0;
                sd.material.tangentSpeed = material.tangentSpeed ?? 0;
                sd.material.userMaterialId = material.userMaterialId ?? 0;
            }

            sd.density = density;
            sd.enableContactEvents = enableContactEvents;
            sd.enableHitEvents = enableHitEvents;
            sd.enablePreSolveEvents = enablePreSolveEvents;
            sd.enableSensorEvents = enableSensorEvents;
            sd.invokeContactCreation = invokeContactCreation;
            sd.isSensor = isSensor;
            sd.updateBodyMass = updateBodyMass;

            return sd;
        }
    },
    createCapsule = (shape, options) => {
        const
            {bodyId, box2d, scale = 1, shapeDefinition} = options,
            {b2Capsule, b2CreateCapsuleShape} = box2d,
            {radius, a, b} = shape,
            {x: ax, y: ay} = adjustedXY(a, options),
            {x: bx, y: by} = adjustedXY(b, options),
            capsule = new b2Capsule();

        capsule.radius = radius * scale;
        capsule.center1.Set(ax, ay);
        capsule.center2.Set(bx, by);

        return b2CreateCapsuleShape(bodyId, formatSD(box2d, shapeDefinition), capsule);
    },
    createPoint = (shape, options) => {
        const
            {box2d} = options,
            v = new box2d.b2Vec2(),
            {x, y} = adjustedXY(shape, options);

        v.x = x;
        v.y = y;
    
        return v;
    },
    createPolygon = (shape, options) => {
        const
            {chain = false, shapeDefinition} = options;

        if (chain) {
            return createPolyline(shape, {
                ...options,
                shapeDefinition: {
                    ...shapeDefinition,
                    isLoop: true
                }
            });
        } else {
            const
                {bodyId, box2d, local = true, radius = 0, scale = 1, shapeDefinition} = options,
                {b2CreatePolygonShape, b2ComputeHull, b2MakePolygon} = box2d,
                polygons = shape.split(3, 8); // break down polygon to chunks equal to or smaller than 8 vertices and make sure these chunks are convex.
                
            return polygons.map(({points}) => b2CreatePolygonShape(bodyId, formatSD(box2d, shapeDefinition), b2MakePolygon(b2ComputeHull(points.map((point) => createPoint(point, {box2d, local, scale})), points.length), radius)));
        }
    },
    createPolyline = ({points}, {bodyId, box2d, local = true, scale = 1, shapeDefinition}) => {
        const
            {b2CreateChain} = box2d;
            
        return b2CreateChain(bodyId, formatChainSD(box2d, {
            ...shapeDefinition,
            points: points.map((point) => createPoint(point, {box2d, local, scale}))
        }));
    },
    casts = {
        capsule: createCapsule,
        circle: (shape, options) => {
            const
                {radius} = shape,
                {bodyId, box2d, scale = 1, shapeDefinition} = options,
                {b2Circle, b2CreateCircleShape} = box2d,
                {x, y} = adjustedXY(shape, options),
                circle = new b2Circle();

            circle.radius = radius * scale;
            circle.center.Set(x, y);

            return b2CreateCircleShape(bodyId, formatSD(box2d, shapeDefinition), circle);
        },
        ellipse: (shape, ...args) => {
            return createCapsule(shape.toCapsule(), ...args);
        },
        point: createPoint,
        polygon: createPolygon,
        polyline: createPolyline,
        rectangle: createPolygon,
        roundedRectangle: createPolygon,
        segment: ({a, b}, options) => {
            const
                {box2d} = options,
                s = new box2d.b2Segment(),
                {x: ax, y: ay} = adjustedXY(a, options),
                {x: bx, y: by} = adjustedXY(b, options);
            
            s.point1.x = ax;
            s.point1.y = ay;
            s.point2.x = bx;
            s.point2.y = by;
        
            return s;
        }
    };

export default function castToBox2D (shape, options) {
    const
        {type} = shape,
        cast = casts[type];

    if (cast) {
        return cast(shape, {
            box2d: platypus.game.box2d,
            options
        });
    } else {
        platypus.debug.warn(`Unable to cast shape of type "${type}" to Box2D.`, shape);
        return null;
    }
}