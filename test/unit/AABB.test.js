import { describe, it, expect } from 'vitest';
import AABB from '../../src/AABB.js';

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

    it('moves correctly', () => {
        const aabb = new AABB(0, 0, 10, 20);

        aabb.move(50, 100);

        expect(aabb.left).toBe(45);
        expect(aabb.right).toBe(55);

        expect(aabb.top).toBe(90);
        expect(aabb.bottom).toBe(110);
    });

    it('resizes correctly', () => {
        const aabb = new AABB(10, 10, 20, 20);

        aabb.resize(40, 10);

        expect(aabb.width).toBe(40);
        expect(aabb.height).toBe(10);

        expect(aabb.left).toBe(-10);
        expect(aabb.right).toBe(30);

        expect(aabb.top).toBe(5);
        expect(aabb.bottom).toBe(15);
    });

    it('detects intersections', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(5, 0, 10, 10);

        expect(a.intersects(b)).toBe(true);
        expect(a.collides(b)).toBe(true);
    });

    it('distinguishes touching from colliding', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(10, 0, 10, 10);

        expect(a.intersects(b)).toBe(true);
        expect(a.collides(b)).toBe(false);
    });

    it('contains points correctly', () => {
        const aabb = new AABB(0, 0, 10, 10);

        expect(aabb.containsPoint(0, 0)).toBe(true);
        expect(aabb.containsPoint(5, 5)).toBe(true);

        expect(aabb.containsPoint(6, 0)).toBe(false);
    });

    it('expands to include another AABB', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(20, 0, 10, 10);

        a.include(b);

        expect(a.left).toBe(-5);
        expect(a.right).toBe(25);

        expect(a.width).toBe(30);
        expect(a.x).toBe(10);
    });

    it('computes intersection area', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(5, 0, 10, 10);

        expect(a.getIntersectionArea(b)).toBe(50);
    });

    it('returns empty intersection when separated', () => {
        const a = new AABB(0, 0, 10, 10);
        const b = new AABB(100, 100, 10, 10);

        const intersection = a.getIntersection(b);

        expect(intersection.empty).toBe(true);

        intersection.recycle();
    });
});