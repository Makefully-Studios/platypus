import {describe, expect, it} from 'vitest';
import {entitiesCanSolidCollide, entitiesShareCollisionGroup, shouldSkipJumpThroughFace} from '../../../src/utils/jumpThrough.js';

const aabb = (left, top, right, bottom) => ({left, top, right, bottom});

describe('shouldSkipJumpThroughFace', () => {
    const topFace = {x: 0, y: -1};
    const bottomFace = {x: 0, y: 1};
    const leftFace = {x: -1, y: 0};
    const rightFace = {x: 1, y: 0};

    it('does not skip when mover is above / on a top face', () => {
        const platform = aabb(0, 100, 100, 112);
        const moverOnTop = aabb(10, 0, 30, 100);

        expect(shouldSkipJumpThroughFace(moverOnTop, platform, topFace)).toBe(false);
    });

    it('skips when mover is already below a top face', () => {
        const platform = aabb(0, 100, 100, 112);
        const moverBelow = aabb(10, 80, 30, 120);

        expect(shouldSkipJumpThroughFace(moverBelow, platform, topFace)).toBe(true);
    });

    it('does not skip a rising platform when both previous AABBs are used', () => {
        // Start of step: rider resting on platform top.
        const platformPrev = aabb(0, 100, 100, 112);
        const riderPrev = aabb(10, 0, 30, 100);

        // End of step: platform rose 8px (y decreases). Current top is 92.
        const platformCurr = aabb(0, 92, 100, 104);

        // Bug: riderPrev vs platformCurr would skip (100 > 92).
        expect(shouldSkipJumpThroughFace(riderPrev, platformCurr, topFace)).toBe(true);

        // Fix: riderPrev vs platformPrev must not skip.
        expect(shouldSkipJumpThroughFace(riderPrev, platformPrev, topFace)).toBe(false);
    });

    it('still skips jump-up-through against a rising platform previous top', () => {
        const platformPrev = aabb(0, 100, 100, 112);
        const riderComingFromBelow = aabb(10, 105, 30, 145);

        expect(shouldSkipJumpThroughFace(riderComingFromBelow, platformPrev, topFace)).toBe(true);
    });

    it('handles bottom-facing one-ways', () => {
        const platform = aabb(0, 100, 100, 112);
        const below = aabb(10, 112, 30, 140);
        const above = aabb(10, 60, 30, 90);

        expect(shouldSkipJumpThroughFace(below, platform, bottomFace)).toBe(false);
        expect(shouldSkipJumpThroughFace(above, platform, bottomFace)).toBe(true);
    });

    it('handles horizontal one-ways with the same previous-AABB rule', () => {
        const wall = aabb(100, 0, 112, 100);
        const leftOf = aabb(60, 10, 100, 40);
        const rightOf = aabb(112, 10, 150, 40);

        expect(shouldSkipJumpThroughFace(leftOf, wall, leftFace)).toBe(false);
        expect(shouldSkipJumpThroughFace(rightOf, wall, leftFace)).toBe(true);

        expect(shouldSkipJumpThroughFace(rightOf, wall, rightFace)).toBe(false);
        expect(shouldSkipJumpThroughFace(leftOf, wall, rightFace)).toBe(true);
    });

    it('treats swapped AABB roles as a different side test (HandlerCollision reciprocal call)', () => {
        const platformPrev = aabb(0, 100, 100, 112);
        const riderPrev = aabb(10, 0, 30, 100);

        // Primary: other is JT platform, mover is rider previous.
        expect(shouldSkipJumpThroughFace(riderPrev, platformPrev, topFace)).toBe(false);

        // Reciprocal feeds (otherPrev as moving, thisPrev as platform) when the mover is JT.
        // Same normal + swapped AABBs is a different geometric question by design.
        expect(shouldSkipJumpThroughFace(platformPrev, riderPrev, topFace)).not.toBe(
            shouldSkipJumpThroughFace(riderPrev, platformPrev, topFace)
        );
    });
});

describe('entitiesShareCollisionGroup', () => {
    it('detects rider membership on a carrier collision group', () => {
        const rider = {type: 'hero-alma'};
        const carrier = {
            type: 'platform-spider',
            collisionGroup: {
                getSolidEntities: () => [carrier, rider]
            }
        };

        expect(entitiesShareCollisionGroup(rider, carrier)).toBe(true);
        expect(entitiesShareCollisionGroup(carrier, rider)).toBe(true);
        expect(entitiesShareCollisionGroup(rider, {type: 'platform-bat'})).toBe(false);
    });
});

describe('entitiesCanSolidCollide', () => {
    it('is true while hero-on-ledge is active against a ledge carrier', () => {
        const rider = {
            collisionTypes: ['hero', 'hero-on-ledge'],
            solidCollisionMap: {
                get: (type) => (type === 'hero' ? ['terrain', 'boulder'] : ['ledge'])
            }
        };
        const carrier = {
            collisionTypes: ['ledge'],
            solidCollisionMap: {
                get: (type) => (type === 'ledge' ? ['hero-on-ledge'] : null)
            }
        };

        expect(entitiesCanSolidCollide(rider, carrier)).toBe(true);
    });

    it('is false after drop removes hero-on-ledge (Alma no-ledge path)', () => {
        const rider = {
            collisionTypes: ['hero'],
            solidCollisionMap: {
                get: (type) => (type === 'hero' ? ['terrain', 'boulder'] : null)
            }
        };
        const carrier = {
            collisionTypes: ['ledge'],
            solidCollisionMap: {
                get: (type) => (type === 'ledge' ? ['hero-on-ledge'] : null)
            }
        };

        expect(entitiesCanSolidCollide(rider, carrier)).toBe(false);
    });
});

