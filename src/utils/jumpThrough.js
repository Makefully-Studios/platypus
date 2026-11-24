/**
 * Default epsilon for jump-through side tests (matches HandlerCollision).
 */
export const JUMP_THROUGH_EPSILON = 0.000001;

/**
 * Whether a mover should ignore a one-way solid face.
 *
 * Both AABBs must share the same time base — typically each body's previous /
 * start-of-step AABB — so moving platforms are tested like fixed tile edges.
 *
 * @param {{left: number, right: number, top: number, bottom: number}} movingAABB
 * @param {{left: number, right: number, top: number, bottom: number}} platformAABB
 * @param {{x: number, y: number}} normal Solid-facing jump-through normal.
 * @param {number} [epsilon]
 * @return {boolean}
 */
export const shouldSkipJumpThroughFace = (movingAABB, platformAABB, normal, epsilon = JUMP_THROUGH_EPSILON) => {
    const
        absx = Math.abs(normal.x),
        absy = Math.abs(normal.y);

    if (absy >= absx) {
        return (
            (normal.y < -epsilon && movingAABB.bottom > platformAABB.top) ||
            (normal.y > epsilon && movingAABB.top < platformAABB.bottom)
        );
    }

    return (
        (normal.x < -epsilon && movingAABB.right > platformAABB.left) ||
        (normal.x > epsilon && movingAABB.left < platformAABB.right)
    );
};

/**
 * True when either entity currently carries the other in a CollisionGroup
 * (LogicCarrier / LogicPortable). Group sync rewrites the rider's previous
 * AABB mid-step, so jump-through side tests against those AABBs are invalid.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
export const entitiesShareCollisionGroup = (a, b) => {
    if (!a || !b || a === b) {
        return false;
    }

    const
        aSolids = a.collisionGroup?.getSolidEntities?.(),
        bSolids = b.collisionGroup?.getSolidEntities?.();

    return !!(
        (aSolids && aSolids.indexOf(b) >= 0) ||
        (bSolids && bSolids.indexOf(a) >= 0)
    );
};

const getLogicPortable = (entity) => entity?.getComponentsByType?.('LogicPortable')?.[0] ?? null;

/**
 * Active carry contact side on the rider (`up`/`down`/`left`/`right`), or null.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {string|null}
 */
export const getGroupedCarryDirection = (a, b) => {
    if (!a || !b || a === b) {
        return null;
    }

    const
        aPortable = getLogicPortable(a),
        bPortable = getLogicPortable(b);

    if (aPortable?.carrier === b && aPortable.carryDirection) {
        return aPortable.carryDirection;
    }
    if (bPortable?.carrier === a && bPortable.carryDirection) {
        return bPortable.carryDirection;
    }

    return null;
};

/**
 * Axis that must keep resolving solids for the carry pair (`x` or `y`).
 * Floor/ceiling → `y`; wall/side → `x`. Defaults to `y` (floor-carry world).
 *
 * @param {Object} a
 * @param {Object} b
 * @return {'x'|'y'}
 */
export const getCarrySupportAxis = (a, b) => {
    const direction = getGroupedCarryDirection(a, b);

    if (direction === 'left' || direction === 'right') {
        return 'x';
    }
    if (direction === 'up' || direction === 'down') {
        return 'y';
    }

    // No live direction yet: infer from portableDirections when unambiguous.
    const
        dirs = getLogicPortable(a)?.portableDirections
            || getLogicPortable(b)?.portableDirections
            || null,
        vertical = !!(dirs?.up || dirs?.down),
        horizontal = !!(dirs?.left || dirs?.right);

    if (horizontal && !vertical) {
        return 'x';
    }

    return 'y';
};

/**
 * Skip solid resolution on the free axis between a grouped carrier/rider pair
 * so the rider can move along the platform (walk on floors, climb on walls)
 * without side/end hits clamping velocity. Support-axis collisions still apply.
 *
 * @param {Object} a
 * @param {Object} b
 * @param {'x'|'y'} axis
 * @return {boolean}
 */
export const shouldSkipGroupedCarryAxis = (a, b, axis) => {
    if (!entitiesShareCollisionGroup(a, b)) {
        return false;
    }

    return axis !== getCarrySupportAxis(a, b);
};

/**
 * True when either entity's active collision types still appear in the other's
 * solid-collision map. Drop-through (`collide-off` on a typed CollisionBasic,
 * often via a component alias like Alma `no-ledge`) removes that type from
 * `collisionTypes` while CollisionGroup may still list the rider — keep-carry
 * must not treat that as supported.
 *
 * Returns `true` when maps are missing so callers only release on a positive
 * "no path" result.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
export const entitiesCanSolidCollide = (a, b) => {
    if (!a || !b || a === b) {
        return false;
    }

    const
        aTypes = a.getCollisionTypes?.() ?? a.collisionTypes,
        bTypes = b.getCollisionTypes?.() ?? b.collisionTypes,
        aSolids = a.getSolidCollisions?.() ?? a.solidCollisionMap,
        bSolids = b.getSolidCollisions?.() ?? b.solidCollisionMap;

    if (!aTypes || !bTypes || !aSolids || !bSolids) {
        return true;
    }

    for (let i = 0; i < aTypes.length; i++) {
        const aType = aTypes[i];

        for (let j = 0; j < bTypes.length; j++) {
            const
                bType = bTypes[j],
                bTargets = bSolids.get?.(bType) ?? bSolids[bType],
                aTargets = aSolids.get?.(aType) ?? aSolids[aType];

            if (bTargets && bTargets.indexOf(aType) >= 0) {
                return true;
            }
            if (aTargets && aTargets.indexOf(bType) >= 0) {
                return true;
            }
        }
    }

    return false;
};
