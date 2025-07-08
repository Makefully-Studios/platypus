/* global platypus */
import Capsule from './Capsule';
import Circle from './Circle';
import Ellipse from './Ellipse';
import Polygon from './Polygon';
import Polyline from './Polyline';
import Rectangle from './Rectangle';
import RoundedRectangle from './RoundedRectangle';
import Segment from './Segment';
import Point from './Point';

const
    SHAPES = {
        capsule: Capsule,
        circle: Circle,
        ellipse: Ellipse,
        polygon: Polygon,
        polyline: Polyline,
        rectangle: Rectangle,
        roundedRectangle: RoundedRectangle,
        segment: Segment,
        point: Point
    };

export default function createShape (shapeData, prioritizedShapeList = ['roundedRectangle', 'rectangle', 'capsule', 'ellipse', 'segment', 'polygon', 'polyline', 'circle', 'point']) {
    const
        {type} = shapeData;

    if (type && prioritizedShapeList.indexOf(type) >= 0) {
        const
            Shape = SHAPES[type];

        if (Shape?.validateDefinition(shapeData)) {
            return new Shape(shapeData);
        }
    } else {
        const
            {length} = prioritizedShapeList;
            
        for (let i = 0; i < length; i++) {
            const
                Shape = SHAPES[prioritizedShapeList[i]];

            if (Shape?.validateDefinition(shapeData)) {
                return new Shape(shapeData);
            }
        }
    }

    platypus.debug.warn('Unable to create a shape matching provided data.', shapeData);

    return null;
}