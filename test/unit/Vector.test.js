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
    it('creates from coordinates', () => {
        const vector = new Vector(3, 4, 5);

        expect(vector.x).toBe(3);
        expect(vector.y).toBe(4);
        expect(vector.z).toBe(5);
        expect(vector.toString()).toBe('[3,4,5]');
    });

    it('creates from arrays and other vectors', () => {
        const fromArray = new Vector([1, 2]);
        const source = new Vector(7, 8, 9);
        const fromVector = new Vector(source);

        expect(fromArray.x).toBe(1);
        expect(fromArray.y).toBe(2);
        expect(fromVector.x).toBe(7);
        expect(fromVector.y).toBe(8);
        expect(fromVector.z).toBe(9);
    });

    it('compares equality across formats', () => {
        const vector = new Vector(2, 3, 4);

        expect(vector.equals(2, 3, 4)).toBe(true);
        expect(vector.equals([2, 3, 4])).toBe(true);
        expect(vector.equals(new Vector(2, 3, 4))).toBe(true);
        expect(vector.equals(2, 3, 5)).toBe(false);
    });

    it('computes magnitude and normalization', () => {
        const vector = new Vector(3, 4);

        expect(vector.magnitude()).toBe(5);
        expect(vector.magnitudeSquared(2)).toBe(25);

        vector.normalize();

        expect(vector.x).toBeCloseTo(0.6);
        expect(vector.y).toBeCloseTo(0.8);
        expect(vector.magnitude()).toBeCloseTo(1);
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
        expect(a.y).toBe(2);
        expect(a.z).toBe(3);

        a.scale(2, 2);
        expect(a.x).toBe(2);
        expect(a.y).toBe(4);

        expect(a.dot(b)).toBe(46);
    });

    it('computes angles and cross products', () => {
        const a = new Vector(1, 0);
        const b = new Vector(0, 1);

        expect(a.getAngle()).toBeCloseTo(0);
        expect(b.getAngle()).toBeCloseTo(Math.PI / 2);
        expect(a.angleTo(b)).toBeCloseTo(Math.PI / 2);

        const cross = a.getCrossProduct(b);

        expect(cross.x).toBeCloseTo(0);
        expect(cross.y).toBeCloseTo(0);
        expect(cross.z).toBe(1);

        cross.recycle();
    });

    it('rotates about a point on the plane', () => {
        const point = new Vector(10, 10);
        const vector = new Vector(20, 10);

        vector.rotateAbout(point, Math.PI / 2);

        expect(vector.x).toBeCloseTo(10);
        expect(vector.y).toBeCloseTo(20);

        point.recycle();
    });

    it('assigns coordinate properties on host objects', () => {
        const host = {};

        Vector.assign(host, 'position', 'x', 'y');

        host.x = 12;
        host.y = 34;

        expect(host.position.x).toBe(12);
        expect(host.position.y).toBe(34);

        host.position.recycle();
    });

    it('supports setUp, copy, and recycle from the pool', () => {
        const first = Vector.setUp(1, 2, 3);
        const copy = first.copy();

        expect(copy.equals(first)).toBe(true);
        expect(copy).not.toBe(first);

        first.recycle();
        copy.recycle();

        const reused = Vector.setUp(9, 8, 7);

        expect(reused.x).toBe(9);
        expect(reused.y).toBe(8);
        expect(reused.z).toBe(7);

        reused.recycle();
    });
});
