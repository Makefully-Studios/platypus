import recycle from 'recycle';

const
    /**
     * Defines an axis-aligned bounding box (AABB) used for collision checks,
     * containment tests, and spatial calculations.
     *
     * The AABB stores both center-based coordinates (`x`, `y`, `width`,
     * `height`) and edge-based coordinates (`left`, `top`, `right`, `bottom`)
     * for fast access during collision operations.
     *
     * Position values (`x`, `y`) always represent the center of the rectangle.
     *
     * Mutation Semantics:
     * - `move*` methods translate the AABB.
     * - `setWidth` and `setHeight` resize around the center.
     * - `setLeft`, `setRight`, `setTop`, and `setBottom` resize while
     *   preserving the opposite edge.
     * - `setBounds` reconstructs the rectangle from explicit bounds.
     *
     * AABBs are mutable and recyclable. Instances should not be retained after
     * calling `recycle`.
     *
     * @memberof platypus
     * @class AABB
     * @param x {number|platypus.AABB} The x position of the AABB center, or an
     * existing AABB to copy.
     * @param y {number} The y position of the AABB center.
     * @param width {number} The width of the AABB.
     * @param height {number} The height of the AABB.
     * @return {platypus.AABB} Returns the instantiated AABB.
     */
    AABB = function (x, y, width, height) {
        if (x instanceof AABB) {
            this.set(x);
        } else {
            this.empty = true;
            this.setAll(x, y, width, height);
        }
    },
    proto = AABB.prototype;

/**
 * Whether the AABB encloses a valid area.
 *
 * @property empty
 * @type boolean
 */

/**
 * The x position of the AABB center.
 *
 * @property x
 * @type number
 */

/**
 * The y position of the AABB center.
 *
 * @property y
 * @type number
 */

/**
 * The width of the AABB.
 *
 * @property width
 * @type number
 */

/**
 * The height of the AABB.
 *
 * @property height
 * @type number
 */

/**
 * Half the width of the AABB.
 *
 * @property halfWidth
 * @type number
 */

/**
 * Half the height of the AABB.
 *
 * @property halfHeight
 * @type number
 */

/**
 * The left edge of the AABB.
 *
 * @property left
 * @type number
 */

/**
 * The right edge of the AABB.
 *
 * @property right
 * @type number
 */

/**
 * The top edge of the AABB.
 *
 * @property top
 * @type number
 */

/**
 * The bottom edge of the AABB.
 *
 * @property bottom
 * @type number
 */

/**
 * Sets all of the properties of the AABB.
 *
 * @method platypus.AABB#setAll
 * @param x {number} The x position of the AABB center.
 * @param y {number} The y position of the AABB center.
 * @param width {number} The width of the AABB.
 * @param height {number} The height of the AABB.
 * @chainable
 */
proto.setAll = function (x, y, width, height) {
    this.empty = false;
    this.x = x;
    this.y = y;
    this.resize(width, height);

    return this;
};

/**
 * Sets all four bounds of the AABB directly.
 *
 * Unlike edge mutators such as `setLeft` or `setTop`, this method completely
 * reconstructs the rectangle from authoritative edge values.
 *
 * @method platypus.AABB#setBounds
 * @param left {number} The left edge.
 * @param top {number} The top edge.
 * @param right {number} The right edge.
 * @param bottom {number} The bottom edge.
 * @chainable
 */
proto.setBounds = function (left, top, right, bottom) {
    this.empty = false;

    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;

    this.width = right - left;
    this.height = bottom - top;

    this.halfWidth = this.width / 2;
    this.halfHeight = this.height / 2;

    this.x = left + this.halfWidth;
    this.y = top + this.halfHeight;

    return this;
};

/**
 * Copies values from another AABB.
 *
 * @method platypus.AABB#set
 * @param aabb {platypus.AABB} The AABB to copy values from.
 * @chainable
 */
proto.set = function (aabb) {
    this.empty = aabb.empty;

    this.x = aabb.x;
    this.y = aabb.y;

    this.width = aabb.width;
    this.height = aabb.height;

    this.halfWidth = aabb.halfWidth;
    this.halfHeight = aabb.halfHeight;

    this.left = aabb.left;
    this.right = aabb.right;

    this.top = aabb.top;
    this.bottom = aabb.bottom;

    return this;
};

/**
 * Returns a string representation of the AABB.
 *
 * @method platypus.AABB#toString
 * @return {string}
 */
proto.toString = function () {
    return '[AABB: ' + this.width + 'x' + this.height + ' (' + this.x + ', ' + this.y + ')]';
};

/**
 * Marks the AABB as empty so it may be reused or recycled.
 *
 * Existing positional values are retained internally for performance reasons
 * and should not be considered valid while `empty === true`.
 *
 * @method platypus.AABB#reset
 * @chainable
 */
proto.reset = function () {
    this.empty = true;

    return this;
};

/**
 * Resizes the AABB around its center position.
 *
 * @method platypus.AABB#resize
 * @param width {number} The new width.
 * @param height {number} The new height.
 * @chainable
 */
proto.resize = function (width = 0, height = 0) {
    this.setWidth(width);
    this.setHeight(height);

    return this;
};

/**
 * Expands this AABB so that it encloses both its current area and the
 * provided AABB.
 *
 * @method platypus.AABB#include
 * @param aabb {platypus.AABB} The AABB to include.
 * @chainable
 */
proto.include = function (aabb) {
    if (this.empty) {
        this.set(aabb);
    } else {
        if (this.left > aabb.left) {
            this.setLeft(aabb.left);
        }

        if (this.right < aabb.right) {
            this.setRight(aabb.right);
        }

        if (this.top > aabb.top) {
            this.setTop(aabb.top);
        }

        if (this.bottom < aabb.bottom) {
            this.setBottom(aabb.bottom);
        }
    }

    return this;
};

/**
 * Expands this AABB so that it encloses the provided point or points.
 *
 * @method platypus.AABB#includeVector
 * @param {...platypus.Vector} vectors The vectors to include.
 * @chainable
 */
proto.includeVector = function (...args) {
    args.forEach(({x, y}) => {
        if (this.empty) {
            this.empty = false;

            this.x = x;
            this.y = y;

            this.resize();
        } else {
            if (this.left > x) {
                this.setLeft(x);
            }

            if (this.right < x) {
                this.setRight(x);
            }

            if (this.top > y) {
                this.setTop(y);
            }

            if (this.bottom < y) {
                this.setBottom(y);
            }
        }
    });

    return this;
};

/**
 * Moves the AABB to the specified location.
 *
 * @method platypus.AABB#move
 * @param x {number} The new x position.
 * @param y {number} The new y position.
 * @chainable
 */
proto.move = function (x, y) {
    this.moveX(x);
    this.moveY(y);

    return this;
};

/**
 * Moves the AABB horizontally.
 *
 * @method platypus.AABB#moveX
 * @param x {number} The new x position.
 * @chainable
 */
proto.moveX = function (x) {
    this.x = x;

    this.left = x - this.halfWidth;
    this.right = x + this.halfWidth;

    return this;
};

/**
 * Moves the AABB vertically.
 *
 * @method platypus.AABB#moveY
 * @param y {number} The new y position.
 * @chainable
 */
proto.moveY = function (y) {
    this.y = y;

    this.top = y - this.halfHeight;
    this.bottom = y + this.halfHeight;

    return this;
};

/**
 * Moves the AABB horizontally by a delta value.
 *
 * @method platypus.AABB#moveXBy
 * @param deltaX {number} The change in x position.
 * @chainable
 */
proto.moveXBy = function (deltaX) {
    return this.moveX(this.x + deltaX);
};

/**
 * Moves the AABB vertically by a delta value.
 *
 * @method platypus.AABB#moveYBy
 * @param deltaY {number} The change in y position.
 * @chainable
 */
proto.moveYBy = function (deltaY) {
    return this.moveY(this.y + deltaY);
};

/**
 * Sets the width of the AABB while preserving its center position.
 *
 * @method platypus.AABB#setWidth
 * @param width {number} The new width.
 * @chainable
 */
proto.setWidth = function (width) {
    const hw = width / 2;

    this.width = width;
    this.halfWidth = hw;

    if (typeof this.x === 'number') {
        this.left = this.x - hw;
        this.right = this.x + hw;
    } else {
        this.empty = true;
    }

    return this;
};

/**
 * Sets the height of the AABB while preserving its center position.
 *
 * @method platypus.AABB#setHeight
 * @param height {number} The new height.
 * @chainable
 */
proto.setHeight = function (height) {
    const hh = height / 2;

    this.height = height;
    this.halfHeight = hh;

    if (typeof this.y === 'number') {
        this.top = this.y - hh;
        this.bottom = this.y + hh;
    } else {
        this.empty = true;
    }

    return this;
};

/**
 * Sets the left edge of the AABB while preserving the right edge.
 *
 * This operation resizes the AABB horizontally.
 *
 * @method platypus.AABB#setLeft
 * @param left {number} The new left edge.
 * @chainable
 */
proto.setLeft = function (left) {
    const
        width = this.right - left,
        hw = width / 2;

    this.left = left;

    this.width = width;
    this.halfWidth = hw;

    this.x = left + hw;

    return this;
};

/**
 * Sets the right edge of the AABB while preserving the left edge.
 *
 * This operation resizes the AABB horizontally.
 *
 * @method platypus.AABB#setRight
 * @param right {number} The new right edge.
 * @chainable
 */
proto.setRight = function (right) {
    const
        width = right - this.left,
        hw = width / 2;

    this.right = right;

    this.width = width;
    this.halfWidth = hw;

    this.x = this.left + hw;

    return this;
};

/**
 * Sets the top edge of the AABB while preserving the bottom edge.
 *
 * This operation resizes the AABB vertically.
 *
 * @method platypus.AABB#setTop
 * @param top {number} The new top edge.
 * @chainable
 */
proto.setTop = function (top) {
    const
        height = this.bottom - top,
        hh = height / 2;

    this.top = top;

    this.height = height;
    this.halfHeight = hh;

    this.y = top + hh;

    return this;
};

/**
 * Sets the bottom edge of the AABB while preserving the top edge.
 *
 * This operation resizes the AABB vertically.
 *
 * @method platypus.AABB#setBottom
 * @param bottom {number} The new bottom edge.
 * @chainable
 */
proto.setBottom = function (bottom) {
    const
        height = bottom - this.top,
        hh = height / 2;

    this.bottom = bottom;

    this.height = height;
    this.halfHeight = hh;

    this.y = this.top + hh;

    return this;
};

/**
 * Returns whether this AABB matches another AABB exactly.
 *
 * @method platypus.AABB#equals
 * @param aabb {platypus.AABB} The AABB to compare against.
 * @return {boolean}
 */
proto.equals = function (aabb) {
    return !this.empty &&
        !aabb.empty &&
        (this.left === aabb.left) &&
        (this.top === aabb.top) &&
        (this.right === aabb.right) &&
        (this.bottom === aabb.bottom);
};

/**
 * Returns whether this AABB completely contains another AABB.
 *
 * @method platypus.AABB#contains
 * @param aabb {platypus.AABB} The AABB to test.
 * @return {boolean}
 */
proto.contains = function (aabb) {
    return (aabb.top >= this.top) &&
        (aabb.bottom <= this.bottom) &&
        (aabb.left >= this.left) &&
        (aabb.right <= this.right);
};

/**
 * Returns whether this AABB contains the provided vector.
 *
 * @method platypus.AABB#containsVector
 * @param vector {platypus.Vector} The vector to test.
 * @return {boolean}
 */
proto.containsVector = function (vector) {
    return this.containsPoint(vector.x, vector.y);
};

/**
 * Returns whether this AABB contains the provided point.
 *
 * Edge-touching counts as containment.
 *
 * @method platypus.AABB#containsPoint
 * @param x {number} The x coordinate.
 * @param y {number} The y coordinate.
 * @return {boolean}
 */
proto.containsPoint = function (x, y) {
    return (y >= this.top) &&
        (y <= this.bottom) &&
        (x >= this.left) &&
        (x <= this.right);
};

/**
 * Returns whether this AABB overlaps another AABB.
 *
 * Edge-touching does not count as a collision.
 *
 * @method platypus.AABB#collides
 * @param aabb {platypus.AABB} The AABB to test.
 * @return {boolean}
 */
proto.collides = function (aabb) {
    return (aabb.bottom > this.top) &&
        (aabb.top < this.bottom) &&
        (aabb.right > this.left) &&
        (aabb.left < this.right);
};

/**
 * Returns whether this AABB overlaps the provided point.
 *
 * Edge-touching does not count as collision.
 *
 * @method platypus.AABB#collidesPoint
 * @param x {number} The x coordinate.
 * @param y {number} The y coordinate.
 * @return {boolean}
 */
proto.collidesPoint = function (x, y) {
    return (y > this.top) &&
        (y < this.bottom) &&
        (x > this.left) &&
        (x < this.right);
};

/**
 * Returns whether this AABB intersects another AABB.
 *
 * Edge-touching counts as an intersection.
 *
 * @method platypus.AABB#intersects
 * @param aabb {platypus.AABB} The AABB to test.
 * @return {boolean}
 */
proto.intersects = function (aabb) {
    return (aabb.bottom >= this.top) &&
        (aabb.top <= this.bottom) &&
        (aabb.right >= this.left) &&
        (aabb.left <= this.right);
};

/**
 * Returns a new AABB representing the overlapping area between two AABBs.
 *
 * If no overlap exists, an empty AABB is returned.
 *
 * The returned AABB is pooled and should be recycled when no longer needed.
 *
 * @method platypus.AABB#getIntersection
 * @param aabb {platypus.AABB} The AABB to intersect against.
 * @return {platypus.AABB}
 */
proto.getIntersection = function (aabb) {
    return this.intersects(aabb) ? AABB.setUp().setBounds(
        Math.max(this.left, aabb.left),
        Math.max(this.top, aabb.top),
        Math.min(this.right, aabb.right),
        Math.min(this.bottom, aabb.bottom)
    ) : AABB.setUp();
};

/**
 * Returns the overlapping area between two AABBs.
 *
 * Returns `0` if no overlap exists.
 *
 * @method platypus.AABB#getIntersectionArea
 * @param aabb {platypus.AABB} The AABB to intersect against.
 * @return {number}
 */
proto.getIntersectionArea = function (aabb) {
    return this.intersects(aabb) ? (
        (Math.min(this.bottom, aabb.bottom) - Math.max(this.top, aabb.top)) *
        (Math.min(this.right, aabb.right) - Math.max(this.left, aabb.left))
    ) : 0;
};

/**
 * Returns an AABB from cache or creates a new one if none are available.
 *
 * @method platypus.AABB.setUp
 * @return {platypus.AABB}
 */

/**
 * Returns an AABB to the cache.
 *
 * @method platypus.AABB.recycle
 * @param {platypus.AABB} aabb The AABB to recycle.
 */

/**
 * Relinquishes properties of the AABB and recycles it.
 *
 * @method platypus.AABB#recycle
 */
recycle.add(AABB, 'AABB', AABB, null, true);

export default AABB;