import {beforeEach, describe, expect, it, vi} from 'vitest';
import Vector from '../../src/Vector.js';

beforeEach(() => {
    globalThis.platypus = {
        debug: {
            warn: vi.fn()
        }
    };
});

describe('Vector', () => {
    it('reuses matrix storage from the object pool', () => {
        const pooled = Vector.setUp(1, 2, 3);

        pooled.recycle();

        const recycled = Vector.setUp(4, 5, 6);

        expect(recycled.x).toBe(4);
        recycled.recycle();
    });

    it('creates from coordinates', () => {
        const vector = new Vector(3, 4, 5);

        expect(vector.x).toBe(3);
        expect(vector.y).toBe(4);
        expect(vector.z).toBe(5);
        expect(vector.toString()).toBe('[3,4,5]');
    });

    it('creates from arrays, vectors, and vector-like objects', () => {
        const fromArray = new Vector([1, 2]);
        const source = new Vector(7, 8, 9);
        const fromVector = new Vector(source, 2);
        const fromObject = new Vector({x: 4, y: 5, z: 6});

        expect(fromArray.x).toBe(1);
        expect(fromArray.y).toBe(2);
        expect(fromVector.x).toBe(7);
        expect(fromVector.y).toBe(8);
        expect(fromObject.z).toBe(6);
    });

    it('sets coordinates through set helpers', () => {
        const vector = new Vector();

        vector.setXYZ(1, 2, 3);
        expect(vector.x).toBe(1);

        vector.setArray([9, 8, 7], 2);
        expect(vector.x).toBe(9);
        expect(vector.y).toBe(8);

        const other = new Vector(4, 5, 6);
        const copyTarget = new Vector();

        copyTarget.setVector(other, 2);
        expect(copyTarget.x).toBe(4);
        expect(copyTarget.y).toBe(5);
    });

    it('compares equality across formats', () => {
        const vector = new Vector(2, 3, 4);

        expect(vector.equals(2, 3, 4)).toBe(true);
        expect(vector.equals([2, 3, 4])).toBe(true);
        expect(vector.equals(new Vector(2, 3, 4))).toBe(true);
        expect(vector.equals(2, 3, 5)).toBe(false);
        expect(vector.equals([2, 3, 5])).toBe(false);
        expect(vector.equals(2)).toBe(true);
        expect(vector.equals(2, 99)).toBe(false);
    });

    it('computes magnitude, angle, and normalization', () => {
        const vector = new Vector(3, 4);
        const axis = new Vector(1, 0);

        expect(vector.magnitude()).toBe(5);
        expect(vector.magnitudeSquared(2)).toBe(25);
        expect(axis.getAngle()).toBeCloseTo(0);

        const up = new Vector(0, -1);

        expect(up.getAngle()).toBeCloseTo(Math.PI * 1.5, 1);

        vector.normalize();
        expect(vector.magnitude()).toBeCloseTo(1);

        const zero = new Vector(0, 0);

        expect(zero.getAngle()).toBe(0);
        zero.normalize();
        expect(zero.x).toBe(0);
    });

    it('returns unit, inverse, and copy vectors', () => {
        const source = new Vector(3, 0, 0);
        const unit = source.getUnit();
        const inverse = source.getInverse();
        const copy = source.copy();

        expect(unit.x).toBeCloseTo(1);
        expect(inverse.x).toBe(-3);
        expect(copy.equals(source)).toBe(true);

        unit.recycle();
        inverse.recycle();
        copy.recycle();
    });

    it('adds, subtracts, scales, and dots vectors', () => {
        const a = new Vector(1, 2, 3);
        const b = new Vector(4, 5, 6);

        a.add(b);
        expect(a.x).toBe(5);
        expect(a.y).toBe(7);
        expect(a.z).toBe(9);

        a.subtractVector(b);
        expect(a.x).toBe(1);

        expect(a.dot(b)).toBe(32);

        a.scale(3, 2);
        expect(a.x).toBe(3);
        expect(a.y).toBe(6);

        a.add(1, 1, 1);
        expect(a.x).toBe(4);

        a.add([10, 20, 30], 2);
        expect(a.x).toBe(14);

        a.add([1, 2, 3]);
        expect(a.z).toBe(7);

        const fresh = new Vector(1, 2, 3);

        fresh.add(0, 0, 0);
        expect(fresh.x).toBe(1);

        b.addVector(new Vector(1, 1, 1), 2);
        expect(b.x).toBe(5);

        const partner = new Vector(1, 0, 0);

        fresh.add(partner);
        expect(fresh.x).toBe(2);
        partner.recycle();
    });

    it('computes cross products and perpendicular vectors', () => {
        const a = new Vector(1, 0, 0);
        const b = new Vector(0, 1, 0);

        a.cross(b);
        expect(a.z).toBe(1);

        const perp = new Vector(1, 0);

        perp.perpendicular(true);
        expect(perp.x).toBe(0);
        expect(perp.y).toBe(-1);

        const flat = new Vector(2, 1);

        flat.perpendicular();
        expect(flat.x).toBe(-1);
        expect(flat.y).toBe(2);
    });

    it('rotates around axes and points', () => {
        const vector = new Vector(1, 0, 0);

        vector.rotate(Math.PI / 2, new Vector(0, 0, 1));
        expect(vector.x).toBeCloseTo(0, 5);
        expect(vector.y).toBeCloseTo(1, 5);

        const xSpin = new Vector(0, 1, 0);

        xSpin.rotate(Math.PI, 'x');
        expect(xSpin.y).toBeCloseTo(-1, 5);

        const ySpin = new Vector(1, 0, 0);

        ySpin.rotate(Math.PI / 2, 'y');
        expect(ySpin.z).not.toBe(0);

        const point = new Vector(10, 10);
        const about = new Vector(20, 10);

        about.rotateAbout(point, Math.PI);
        expect(about.x).toBeCloseTo(0, 5);
        expect(about.y).toBeCloseTo(10, 5);

        point.recycle();
    });

    it('multiplies by scalars and matrices', () => {
        const vector = new Vector(1, 2, 3);

        vector.multiply(2);
        expect(vector.x).toBe(2);

        vector.multiply([
            [0, 1],
            [1, 0]
        ]);
        expect(vector.x).toBe(4);
        expect(vector.y).toBe(2);

        const threeD = new Vector(1, 0, 0);

        threeD.multiply([
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0]
        ]);
        expect(threeD.z).toBe(1);

        const flat = new Vector(2, 3);

        flat.multiply([[2]]);
        expect(flat.x).toBe(2);
    });

    it('computes angles between vectors', () => {
        const a = new Vector(1, 0);
        const b = new Vector(0, 1);
        const normal = new Vector(0, 0, 1);

        expect(a.angleTo(b)).toBeCloseTo(Math.PI / 2);
        expect(a.signedAngleTo(b, normal)).toBeCloseTo(Math.PI / 2);
        expect(a.signedAngleTo(new Vector(1, 0), normal)).toBe(0);

        const zero = new Vector(0, 0);

        expect(Number.isNaN(zero.angleTo(b))).toBe(true);
        expect(globalThis.platypus.debug.warn).toHaveBeenCalled();

        const opposite = new Vector(-1, 0);

        expect(a.signedAngleTo(opposite, normal)).toBeCloseTo(Math.PI);

        const reverse = new Vector(-1, 0);

        expect(a.signedAngleTo(reverse, normal)).toBeCloseTo(Math.PI);
        reverse.recycle();

        const neg = new Vector(0, 1);
        const flipNormal = new Vector(0, 0, -1);

        expect(a.signedAngleTo(neg, flipNormal)).toBeCloseTo(-Math.PI / 2);
        flipNormal.recycle();
    });

    it('projects scalars onto vectors and angles', () => {
        const vector = new Vector(2, 0);
        const axis = new Vector(1, 0);

        expect(vector.scalarProjection(Math.PI / 3)).toBeCloseTo(1);
        expect(vector.scalarProjection(axis)).toBe(2);

        axis.recycle();
    });

    it('assigns coordinate properties on host objects', () => {
        const host = {};

        Vector.assign(host, 'position', 'x', 'y');

        host.x = 12;
        host.y = 34;

        expect(host.position.x).toBe(12);
        expect(host.position.y).toBe(34);

        const existing = Vector.assign(host, 'position');

        expect(existing).toBe(host.position);
        host.position.recycle();
    });

    it('preserves pre-existing host properties when aliasing coordinates', () => {
        const host = {label: 'spawn'};

        Vector.assign(host, 'offset', 'label', 'x');

        expect(host.label).toBe('spawn');
        host.offset.x = 7;
        expect(host.label).toBe(7);

        host.offset.recycle();
    });

    it('returns null from assign when arguments are missing', () => {
        expect(Vector.assign(null, 'position')).toBe(null);
        expect(Vector.assign({}, null)).toBe(null);
    });

    it('skips assigning a coordinate with the same name as the vector property', () => {
        const host = {};

        Vector.assign(host, 'motion', 'motion', 'x');
        host.motion.x = 3;

        expect(host.motion.x).toBe(3);
        host.motion.recycle();
    });

    it('supports setUp, copy, and recycle from the pool', () => {
        const first = Vector.setUp(1, 2, 3);
        const copy = first.copy();

        expect(copy.equals(first)).toBe(true);

        first.recycle();
        copy.recycle();

        const reused = Vector.setUp(9, 8, 7);

        expect(reused.x).toBe(9);
        reused.recycle();
    });
});
