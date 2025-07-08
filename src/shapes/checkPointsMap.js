const
    dot = (a, b) => a.x * b.x + a.y * b.y,
    clamp01 = (val) => Math.max(0, Math.min(1, val)),
    swap = (response) => {
        if (response.list) {
            return {
                ...response,
                list: response.list.map((pair) => swap(pair)),
                a: response.b,
                b: response.a
            }
        } else {
            return {
                ...response,
                a: response.b,
                b: response.a
            }
        }
    },
    subtractRadiusB = ({a, b, distance, list, intersects = false}) => {
        const
            {radius} = b;

        if (radius >= distance) {
            return {a, b: a, distance: 0, intersects: true};
        } else {
            const
                outerDistance = distance - radius,
                r = outerDistance / distance;

            if (list) {
                const
                    offsetList = list.map(({a, b}) => ({a, b: {
                        x: a.x + (b.x - a.x) * r,
                        y: a.y + (b.y - a.y) * r
                    }}));

                return {
                    a,
                    b: offsetList[0],
                    distance: outerDistance,
                    list: offsetList,
                    intersects
                };
            } else {
                return {
                    a,
                    b: {
                        x: a.x + (b.x - a.x) * r,
                        y: a.y + (b.y - a.y) * r,
                    },
                    distance: outerDistance,
                    intersects
                };
            }
        }
    },
    subtractRadiusA = (resp) => swap(subtractRadiusB(swap(resp))),
    subtractRadii = (resp) => subtractRadiusA(subtractRadiusB(resp)),
    polySegmentLoop = (shape, poly, test) => {
        const closest = [];
        let min = Infinity;

        poly.forEach((segment) => {
            const res = test(shape, segment);
            if (res.distance < min) {
                closest.length = 0;
                closest.push(res);
                min = res.distance;
            } else if (res.distance === min) {
                closest.push(res);
            }
        });

        return {a: closest[0].a, b: closest[0].b, list: closest, distance: min};
    },
    pointToPoint = (a, b) => ({a, b, distance: Math.hypot(b.x - a.x, b.y - a.y)}),
    pointToSegment = (point, {a, b}) => {
        const
            ab = {x: b.x - a.x, y: b.y - a.y},
            denom = dot(ab, ab);

        if (denom === 0) {
            return pointToPoint(point, a);
        } else {
            const
                t = clamp01(dot({
                    x: point.x - a.x,
                    y: point.y - a.y
                }, ab) / denom);

            return pointToPoint(point, {
                x: a.x + ab.x * t,
                y: a.y + ab.y * t
            });
        }
    },
    pointToCapsule = (a, b) => subtractRadiusB(pointToSegment(a, b)),
    pointToCircle = (a, b) => subtractRadiusB(pointToPoint(a, b)),
    pointToPolyline = (point, polyline) => polySegmentLoop(point, polyline, pointToSegment),
    pointToPolygon = (point, polygon) => ({
        ...polySegmentLoop(point, polygon, pointToSegment),
        intersects: polygon.isPointInside(point)
    }),
    pointToRoundedPolygon = (a, b) => subtractRadiusB(pointToPolygon(a, b)),
    segmentToPoint = (a, b) => swap(pointToSegment(b, a)),
    segmentToSegment = (a, b) => {
        // Vector form of the segments
        const
            {a: a1, b: b1} = a,
            d1 = { x: b1.x - a1.x, y: b1.y - a1.y }, // Direction of a
            sqr1 = dot(d1, d1); // squared length of d1

        if (sqr1 === 0) {
            return pointToSegment(a1, b);
        } else {
            const
                {a: a2, b: b2} = b,
                d2 = { x: b2.x - a2.x, y: b2.y - a2.y }, // Direction of b
                sqr2 = dot(d2, d2); // squared length of d2

            if (sqr2 === 0) {
                return segmentToPoint(a, b1);
            } else {
                const
                    r = { x: a1.x - a2.x, y: a1.y - a2.y },
                    f = dot(d2, r),
                    c = dot(d1, r),
                    
                    g = dot(d1, d2),
                    denom = sqr1 * sqr2 - g * g,
                    s = Math.abs(denom) > 0 ? clamp01((g * f - c * sqr2) / denom) : 0, // Parallel lines
                    t = clamp01((g * s + f) / sqr2),
                    cs = t === 0 ? clamp01(-c / sqr1) : t === 1 ? clamp01((g - c) / sqr1) : s;

                return pointToPoint({
                    x: a1.x + d1.x * cs,
                    y: a1.y + d1.y * cs
                }, {
                    x: a2.x + d2.x * t,
                    y: a2.y + d2.y * t
                });
            }
        }
    },
    segmentToCapsule = (a, b) => subtractRadiusB(segmentToSegment(a, b)),
    segmentToPoly = (segment, poly) => polySegmentLoop(segment, poly, segmentToSegment),
    capsuleToPoint = (a, b) => swap(pointToCapsule(b, a)),
    capsuleToSegment = (a, b) => swap(segmentToCapsule(b, a)),
    capsuleToCapsule = (a, b) => subtractRadiusA(segmentToCapsule(a, b)),
    capsuleToCircle = (a, b) => swap(circleToCapsule(b, a)),
    capsuleToPoly = (a, b) => subtractRadiusA(segmentToPoly(a, b)),
    capsuleToRoundedPoly = (a, b) => subtractRadii(segmentToPoly(a, b)),
    circleToCapsule = (a, b) => subtractRadiusA(pointToCapsule(a, b)),
    circleToPolygon = (a, b) => subtractRadiusA(pointToPolygon(a, b)),
    ellipseToPoly = (a, b) => capsuleToPoly(a.toCapsule(), b),
    polyToSegment = (poly, segment) => swap(segmentToPoly(segment, poly)),
    polyToPoly = (a, b) => polySegmentLoop(a, b, polyToSegment),
    polygonToPoint = (a, b) => swap(pointToPolygon(b, a)),
    polyToCapsule = (a, b) => subtractRadiusB(polyToSegment(a, b)),
    polygonToCircle = (a, b) => subtractRadiusB(polygonToPoint(a, b)),
    polyToEllipse = (a, b) => polyToCapsule(a, b.toCapsule()),
    polyToRoundedPoly = (a, b) => subtractRadiusB(polyToPoly(a, b)),
    roundedPolyToCapsule = (a, b) => subtractRadii(polyToSegment(a, b)),
    roundedPolyToPoly = (a, b) => subtractRadiusA(polyToPoly(a, b)),
    point = {
        point: pointToPoint,
        segment: pointToSegment,
        capsule: pointToCapsule,
        circle: pointToCircle,
        ellipse: (a, b) => pointToCapsule(a, b.toCapsule()),
        polygon: pointToPolygon,
        polyline: pointToPolyline,
        rectangle: pointToPolygon,
        roundedRectangle: pointToRoundedPolygon
    },
    segment = {
        point: segmentToPoint,
        segment: segmentToSegment,
        capsule: segmentToCapsule,
        circle: (a, b) => subtractRadiusB(segmentToPoint(a, b)),
        ellipse: (a, b) => segmentToCapsule(a, b.toCapsule()),
        polygon: segmentToPoly,
        polyline: segmentToPoly,
        rectangle: segmentToPoly,
        roundedRectangle: (a, b) => subtractRadiusB(segmentToPoly(a, b))
    },
    capsule = {
        point: capsuleToPoint,
        segment: capsuleToSegment,
        capsule: capsuleToCapsule,
        circle: capsuleToCircle,
        ellipse: (a, b) => capsuleToCapsule(a, b.toCapsule()),
        polygon: capsuleToPoly,
        polyline: capsuleToPoly,
        rectangle: capsuleToPoly,
        roundedRectangle: capsuleToRoundedPoly
    },
    circle = {
        point: (a, b) => swap(pointToCircle(b, a)),
        segment: (a, b) => subtractRadiusA(pointToSegment(a, b)),
        capsule: circleToCapsule,
        circle: (a, b) => subtractRadiusA(pointToCircle(a, b)),
        ellipse: (a, b) => circleToCapsule(a, b.toCapsule()),
        polygon: circleToPolygon,
        polyline: (a, b) => subtractRadiusA(pointToPolyline(a, b)),
        rectangle: circleToPolygon,
        roundedRectangle: (a, b) => subtractRadii(pointToPolygon(a, b))
    },
    ellipse = {
        point: (a, b) => capsuleToPoint(a.toCapsule(), b),
        segment: (a, b) => capsuleToSegment(a.toCapsule(), b),
        capsule: (a, b) => capsuleToCapsule(a.toCapsule(), b),
        circle: (a, b) => capsuleToCircle(a.toCapsule(), b),
        ellipse: (a, b) => capsuleToCapsule(a.toCapsule(), b.toCapsule()),
        polygon: ellipseToPoly,
        polyline: ellipseToPoly,
        rectangle: ellipseToPoly,
        roundedRectangle: (a, b) => capsuleToRoundedPoly(a.toCapsule(), b)
    },
    polygon = {
        point: polygonToPoint,
        segment: polyToSegment,
        capsule: polyToCapsule,
        circle: polygonToCircle,
        ellipse: polyToEllipse,
        polygon: polyToPoly,
        polyline: polyToPoly,
        rectangle: polyToPoly,
        roundedRectangle: polyToRoundedPoly
    },
    polyline = {
        point: (a, b) => swap(pointToPolyline(b, a)),
        segment: polyToSegment,
        capsule: polyToCapsule,
        circle: (a, b) => subtractRadiusB(swap(pointToPolyline(b, a))),
        ellipse: polyToEllipse,
        polygon: polyToPoly,
        polyline: polyToPoly,
        rectangle: polyToPoly,
        roundedRectangle: polyToRoundedPoly
    },
    rectangle = {
        point: polygonToPoint,
        segment: polyToSegment,
        capsule: polyToCapsule,
        circle: polygonToCircle,
        ellipse: polyToEllipse,
        polygon: polyToPoly,
        polyline: polyToPoly,
        rectangle: polyToPoly,
        roundedRectangle: polyToRoundedPoly
    },
    roundedRectangle = {
        point: (a, b) => swap(pointToRoundedPolygon(b, a)),
        segment: (a, b) => subtractRadiusA(polyToSegment(a, b)),
        capsule: roundedPolyToCapsule,
        circle: (a, b) => subtractRadiusB(swap(subtractRadiusB(pointToPolygon(b, a)))),
        ellipse: (a, b) => roundedPolyToCapsule(a, b.toCapsule()),
        polygon: roundedPolyToPoly,
        polyline: roundedPolyToPoly,
        rectangle: roundedPolyToPoly,
        roundedRectangle: (a, b) => subtractRadii(polyToPoly(a, b))
    };

export default {
    capsule,
    circle,
    ellipse,
    polygon,
    polyline,
    point,
    rectangle,
    roundedRectangle,
    segment
};