import {describe, expect, it} from 'vitest';
import AABB from '../../src/AABB.js';
import Vector from '../../src/Vector.js';

describe('AABB', () => {
    it('creates from center and size', () => {
        const aabb = new AABB(10, 20, 30, 40);

        expect(aabb.x).toBe(10);
        expect(aabb.y).toBe(20);
        expect(aabb.width).toBe(30);
        expect(aabb.height).toBe(40);
        expect(aabb.halfWidth).toBe(15);
        expect(aabb.halfHeight).toBe(20);
        expect(aabb.left).toBe(-5);
        expect(aabb.right).toBe(25);
        expect(aabb.top).toBe(0);
        expect(aabb.bottom).toBe(40);
        expect(aabb.toString()).toBe('[AABB: 30x40 (10, 20)]');
    });

    it('copies from another AABB via constructor', () => {
        const source = new AABB(5, 5, 10, 10);
        const copy = new AABB(source);

        expect(copy.equals(source)).toBe(true);
        expect(copy).not.toBe(source);
    });

    it('sets bounds correctly', () => {
        const aabb = new AABB();

        aabb.setBounds(10, 20, 50, 80);

        expect(aabb.left).toBe(10);
        expect(aabb.top).toBe(20);
        expect(aabb.right).toBe(50);
        expect(aabb.bottom).toBe(80);
        expect(aabb.width).toBe(40);
        expect(aabb.height).toBe(60);
        expect(aabb.x).toBe(30);
        expect(aabb.y).toBe(50);
    });

    it('copies values with set', () => {
        const a = new AABB(1, 2, 10, 20);
        const b = new AABB();

        b.set(a);

        expect(b.equals(a)).toBe(true);
    });

    it('moves and moves by delta', () => {
        const aabb = new AABB(0, 0, 10, 20);

        aabb.move(50, 100);
        expect(aabb.x).toBe(50);
        expect(aabb.y).toBe(100);

        aabb.moveXBy(-10);
        aabb.moveYBy(5);

        expect(aabb.x).toBe(40);
        expect(aabb.y).toBe(105);
    });

    it('resizes and resets', () => {
        const aabb = new AABB(10, 10, 20, 20);

        aabb.resize(40, 10);

        expect(aabb.width).toBe(40);
        expect(aabb.height).toBe(10);

        aabb.reset();

        expect(aabb.empty).toBe(true);
    });

    it('resizes edges independently', () => {
        const aabb = new AABB(50, 50, 20, 20);

        aabb.setLeft(40);
        expect(aabb.left).toBe(40);

        aabb.setRight(80);
        expect(aabb.right).toBe(80);

        aabb.setTop(30);
        expect(aabb.top).toBe(30);

        aabb.setBottom(90);
        expect(aabb.bottom).toBe(90);
    });

    it('marks empty when resizing without center coordinates', () => {
        const aabb = new AABB();

        aabb.setWidth(10);
        expect(aabb.empty).toBe(true);

        aabb.setHeight(10);
        expect(aabb.empty).toBe(true);
    });

    it('includes another AABB and vectors', () => {
        const empty = new AABB();
        const other = new AABB(20, 0, 10, 10);

        empty.include(other);

        expect(empty.equals(other)).toBe(true);

        const seeded = new AABB();

        seeded.reset();
        seeded.includeVector({x: 5, y: 10});

        expect(seeded.empty).toBe(false);
        expect(seeded.x).toBe(5);
        expect(seeded.y).toBe(10);

        const box = new AABB(0, 0, 20, 20);

        box.includeVector({x: -12, y: 0});
        box.includeVector({x: 15, y: 5});
        box.includeVector({x: 5, y: -15});

        expect(box.left).toBe(-12);
        expect(box.right).toBe(15);
        expect(box.top).toBe(-15);
        expect(box.bottom).toBe(10);
    });

    it('detects intersections, collisions, and containment', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(5, 0, 10, 10);
        const touching = new AABB(10, 0, 10, 10);
        const inside = new AABB(2, 2, 4, 4);

        expect(a.intersects(b)).toBe(true);
        expect(a.collides(b)).toBe(true);
        expect(a.intersects(touching)).toBe(true);
        expect(a.collides(touching)).toBe(false);

        expect(a.contains(inside)).toBe(true);
        expect(a.containsPoint(0, 0)).toBe(true);
        expect(a.containsPoint(6, 0)).toBe(false);
        expect(a.collidesPoint(2, 2)).toBe(true);
        expect(a.collidesPoint(-5, 0)).toBe(false);

        const v = new Vector(5, 5);

        expect(a.containsVector(v)).toBe(true);
    });

    it('compares equality', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(0, 0, 10, 10);
        const empty = new AABB();

        empty.reset();

        expect(a.equals(b)).toBe(true);
        expect(a.equals(empty)).toBe(false);
    });

    it('computes intersections and areas', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(5, 0, 10, 10);
        const far = new AABB(100, 100, 10, 10);

        expect(a.getIntersectionArea(b)).toBe(50);
        expect(a.getIntersectionArea(far)).toBe(0);

        const overlap = a.getIntersection(b);

        expect(overlap.empty).toBe(false);
        expect(overlap.width).toBe(5);
        overlap.recycle();

        const separated = a.getIntersection(far);

        expect(separated.empty).toBe(true);
        separated.recycle();
    });

    it('expands to include distant AABBs', () => {
        const outer = new AABB(0, 0, 20, 20);

        outer.include(new AABB(30, 0, 10, 10));
        expect(outer.right).toBe(35);

        outer.include(new AABB(-30, 0, 10, 10));
        expect(outer.left).toBe(-35);

        outer.include(new AABB(0, -30, 10, 10));
        expect(outer.top).toBe(-35);

        outer.include(new AABB(0, 30, 10, 10));
        expect(outer.bottom).toBe(35);
    });

    it('extends only the bottom edge when including a low point', () => {
        const box = new AABB(0, 0, 10, 10);

        box.includeVector({x: 0, y: 20});

        expect(box.bottom).toBe(20);
        expect(box.top).toBe(-5);
    });

    it('supports setUp and recycle', () => {
        const aabb = AABB.setUp(1, 2, 3, 4);

        expect(aabb.width).toBe(3);

        aabb.recycle();

        const reused = AABB.setUp(0, 0, 5, 5);

        expect(reused.width).toBe(5);
        reused.recycle();
    });
});
