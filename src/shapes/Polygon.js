/* global platypus */
import Polyline from "./Polyline";
import Segment from "./Segment";

const
    MIN_VERTICES = 3,
    MAX_VERTICES = 8,
    SHARED_VERTICES = 2;

export default class Polygon extends Polyline {
    constructor (...args) {
        super(...args);
        this.type = 'polygon';
    }

    initialize (...args) {
        super.initialize(...args);
        this.segments.push(new Segment({
            a: this.points[this.points.length - 1],
            b: this.points[0]
        }));
    }

    isPointInside ({x, y}) {
        const
            {points} = this;
        let inside = false;

        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const
                a = points[i],
                b = points[j];

            if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) {
                inside = !inside;
            }
        }
        return inside;
    }

    duplicate () {
        return new Polygon(this);
    }

    decompose () {
        const
            decomp = platypus.game.options.modules?.['poly-decomp'],
            polygon = this.toArray2D(true);

        if (decomp?.isSimple(polygon)) {
            return decomp.quickDecomp(polygon).map((points) => new Polygon({
                points
            }));
        }

        return null;
    }

    split (min = MIN_VERTICES, max = MAX_VERTICES) {
        const
            breakAtMaxSize = min + max - SHARED_VERTICES,
            arr = [],
            convexPolygons = this.decompose() ?? [this]; // break into convex polygons if not already, since splitting a concave polygon could create polygon comprised of non-matching shapes.
        let altSide = -1;

        convexPolygons.forEach((polygon) => {
            const
                points = [...polygon.points];
            let {length} = points;
            
            while (length > max) {
                const
                    count = (length >= breakAtMaxSize) ? max : Math.ceil(length / 2),
                    breakOff = points.splice(altSide * (count - SHARED_VERTICES));

                breakOff.push(points[points.length - 1], points[0]);
                
                arr.push(new Polygon({
                    points: breakOff
                }));

                altSide = -altSide;
                length = points.length;
            }

            arr.push(new Polygon({
                points
            }));
        });

        return arr;
    }

    static validateDefinition (definition = {}) {
        const
            {points} = definition,
            {length = 0} = points ?? [];

        if (length < 3) {
            return false;
        } else {
            return Polyline.validateDefinition(definition);
        }
    }
}