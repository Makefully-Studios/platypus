import {arrayCache, greenSplice, union} from '../utils/array.js';
import AABB from '../AABB.js';
import CollisionData from '../CollisionData.js';
import CollisionDataContainer from '../CollisionDataContainer.js';
import Data from '../Data.js';
import DataMap from '../DataMap.js';
import Vector from '../Vector.js';
import createComponentClass from '../factory.js';

const
    BIT_16 = 0xffff,
    combine = function (x, y) {
        return (x << 16) | (y & BIT_16);
    },
    getBucketId = function (x, y, bits) {
        return combine(x >> bits, y >> bits);
    },
    triggerMessage = {
        entity: null,
        target: null,
        type: null,
        x: 0,
        y: 0,
        hitType: null,
        myType: null
    },
    groupSortBySize = function (a, b) {
        return a.collisionGroup.getAllEntities() - b.collisionGroup.getAllEntities();
    };

export default createComponentClass(/** @lends platypus.components.HandlerCollision.prototype */{
    id: 'HandlerCollision',
    
    properties: {
        /**
         *
         */
        gridBits: 8
    },
    
    /**
     * This component checks for collisions between entities which typically have either a [CollisionTiles](platypus.components.CollisionTiles.html) component for tile maps or a [CollisionBasic](platypus.components.CollisionBasic.html) component for other entities. It uses `EntityContainer` component messages if triggered to add to its collision list and also listens for explicit add/remove messages (useful in the absence of an `EntityContainer` component).
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#add-collision-entity
     * @listens platypus.Entity#check-collision-group
     * @listens platypus.Entity#child-entity-added
     * @listens platypus.Entity#child-entity-removed
     * @listens platypus.Entity#child-entity-updated
     * @listens platypus.Entity#remove-collision-entity
     * @fires platypus.Entity#hit-by-*
     * @fires platypus.Entity#relocate-entity
     */
    initialize: function () {
        this.againstGrid = Data.setUp();
        
        this.solidEntitiesLive = arrayCache.setUp();
        this.softEntitiesLive = arrayCache.setUp();
        this.allEntitiesLive = arrayCache.setUp();
        this.groupsLive = arrayCache.setUp();
        this.nonColliders = arrayCache.setUp();
        
        this.terrain = null;
        this.owner.previousX = this.owner.previousX || this.owner.x;
        this.owner.previousY = this.owner.previousY || this.owner.y;
        
        this.relocationMessage = Data.setUp(
            "position", Vector.setUp(),
            "relative", false
        );
    },
    
    events: {
        "child-entity-added": function (entity) {
            if (!entity.collideOff) {
                this.addCollisionEntity(entity);
            }
        },
        
        "add-collision-entity": function (entity) {
            this.addCollisionEntity(entity);
        },
        
        "child-entity-removed": function (entity) {
            this.removeCollisionEntity(entity);
        },
        
        "remove-collision-entity": function (entity) {
            this.removeCollisionEntity(entity);
        },
        
        "child-entity-updated": function (entity) {
            this.removeCollisionEntity(entity);
            this.addCollisionEntity(entity);
        },
        
        "check-collision-group": function (resp) {
            this.checkCamera(resp.camera, resp.entities);
            this.checkGroupCollisions();
            this.checkSolidCollisions();
            this.resolveNonCollisions();
            this.checkSoftCollisions(resp);
        }
    },
    
    methods: {
        mapDown (aabb2) {
            const
                aabb1 = AABB.setUp(),
                gb = this.gridBits;
            
            return aabb1.setBounds(aabb2.left >> gb, aabb2.top >> gb, aabb2.right >> gb, aabb2.bottom >> gb);
        },
        
        getAgainstGrid (entity, sweep, types) {
            const
                aabb = this.mapDown(sweep),
                data = Data.setUp(),
                thisAgainstGrid = this.againstGrid;
            
            if (entity && sweep.equals(entity.againstAABB)) {
                return this.getEntityAgainstGrid(entity, types);
            }

            for (let x = aabb.left; x <= aabb.right; x++) {
                for (let y = aabb.top; y <= aabb.bottom; y++) {
                    const
                        list = thisAgainstGrid[combine(x, y)];

                    if (list) {
                        this.mergeAGCell(list, data, types);
                    }
                }
            }
            
            aabb.recycle();
            return data;
        },
        
        getEntityAgainstGrid: function (entity, types) {
            const
                ag = entity.againstGrid,
                data = Data.setUp();
            let i = ag.length;

            while (i--) {
                this.mergeAGCell(ag[i], data, types);
            }
            
            return data;
        },

        mergeAGCell: function (list, data, types) {
            let i = types.length;

            while (i--) {
                const
                    type = types[i],
                    arr = list.get(type);

                if (arr && arr.length) {
                    const tList = data[type];
                    if (!tList) {
                        data[type] = union(arrayCache.setUp(), arr);
                    } else {
                        union(tList, arr);
                    }
                }
            }
        },
        
        removeAgainst (entity) {
            const
                {collisionTypes, againstGrid} = entity,
                len = collisionTypes.length;
            let i = againstGrid.length;
                
            while (i--) {
                const
                    list = againstGrid[i];
                let j = len;

                while (j--) {
                    const
                        arr = list.get(collisionTypes[j]);

                    if (arr) {
                        const
                            id = arr.indexOf(entity);

                        if (id >= 0) {
                            greenSplice(arr, id);
                        }
                    }
                }
            }
            againstGrid.length = 0;
        },
        
        updateAgainst (entity) {
            const
                {againstAABB, againstGrid: entityAgainstGrid, collisionTypes} = entity,
                aabb = this.mapDown(entity.getAABB()),
                {againstGrid} = this;
            
            if (!aabb.equals(againstAABB)) {
                againstAABB.set(aabb);
                this.removeAgainst(entity);

                for (let x = aabb.left; x <= aabb.right; x++) {
                    for (let y = aabb.top; y <= aabb.bottom; y++) {
                        const
                            id = combine(x, y);
                        let list = againstGrid[id],
                            i = collisionTypes.length;

                        if (!list) {
                            list = againstGrid[id] = DataMap.setUp();
                        }
                        while (i--) {
                            const
                                type = collisionTypes[i],
                                arr = list.get(type);

                            if (!arr) {
                                arr = list.set(type, arrayCache.setUp());
                            }
                            arr.push(entity);
                        }
                        entityAgainstGrid.push(list);
                    }
                }
            }
            
            aabb.recycle();
        },
        
        addCollisionEntity: function (entity) {
            if (entity.getTileShapes) { // Has a CollisionTiles component
                this.terrain = entity;
            } else if (entity.collisionTypes && !entity.againstGrid) {
                entity.againstGrid = arrayCache.setUp();
                entity.againstAABB = AABB.setUp();
                this.updateAgainst(entity);
            }
        },

        removeCollisionEntity: function (entity) {
            if (entity.againstGrid) {
                this.removeAgainst(entity);
                arrayCache.recycle(entity.againstGrid);
                entity.againstGrid = null;
                entity.againstAABB.recycle();
                entity.againstAABB = null;
            }
        },
        
        checkCamera: function (camera, all) {
            const
                {allEntitiesLive, solidEntitiesLive, softEntitiesLive, nonColliders, groupsLive} = this;
            let i = all.length;
            
            allEntitiesLive.length = 0;
            solidEntitiesLive.length = 0;
            softEntitiesLive.length = 0;
            nonColliders.length = 0;
            groupsLive.length = 0;

            while (i--) {
                const
                    entity = all[i],
                    {collisionTypes, immobile} = entity;

                if (!immobile && collisionTypes?.length) {
                    let collides = false,
                        j = collisionTypes.length;

                    allEntitiesLive.push(entity);

                    if (entity !== this.owner) {
                        let k = collisionTypes.length;

                        while (k--) {
                            if (entity.solidCollisionMap.get(collisionTypes[k]).length) {
                                solidEntitiesLive.push(entity);
                                collides = true;
                                break;
                            }
                        }
                    }

                    while (j--) {
                        if (entity.softCollisionMap.get(collisionTypes[j]).length) {
                            softEntitiesLive.push(entity);
                            break;
                        }
                    }

                    if (!collides) {
                        nonColliders.push(entity);
                    }

                    if (entity.collisionGroup) {
                        groupsLive.push(entity);
                    }
                }
            }
            
            groupsLive.sort(groupSortBySize);
        },
        
        resolveNonCollisions: function () {
            const
                msg = this.relocationMessage,
                nons = this.nonColliders;
            let i = nons.length;
            
            msg.relative = false;
            while (i--) {
                const
                    entity = nons[i];

                if ((entity.position.x !== entity.previousPosition.x) || (entity.position.y !== entity.previousPosition.y)) {
                    msg.position.setVector(entity.position);
                    entity.triggerEvent('relocate-entity', msg);
                    this.updateAgainst(entity);
                }
            }
        },
        
        checkGroupCollisions: (function () {
            /**
             * When an entity collides with an entity of a listed collision-type, this message is triggered on the entity. * is the other entity's collision-type.
             *
             * @event platypus.Entity#hit-by-*
             * @param collision {Object}
             * @param collision.entity {Entity} The entity with which the collision occurred.
             * @param collision.target {Entity} The entity that's receiving the collision event.
             * @param collision.type {String} The collision type of the other entity.
             * @param collision.shape {CollisionShape} This is the shape of the other entity that caused the collision.
             * @param collision.x {number} Returns -1, 0, or 1 indicating on which side of this entity the collision occurred: left, neither, or right respectively.
             * @param collision.y {number} Returns -1, 0, or 1 indicating on which side of this entity the collision occurred: top, neither, or bottom respectively.
             */
            const
                triggerCollisionMessages = function (entity, otherEntity, thisType, thatType, x, y, hitType, vector) {
                    const
                        msg = triggerMessage;
                    
                    msg.entity    = otherEntity;
                    msg.target    = entity;
                    msg.myType    = thisType;
                    msg.type      = thatType;
                    msg.x         = x;
                    msg.y         = y;
                    msg.direction = vector;
                    msg.hitType   = hitType;
                    entity.triggerEvent('hit-by-' + thatType, msg);
                    
                    if (otherEntity) {
                        msg.entity    = entity;
                        msg.target    = otherEntity;
                        msg.type      = thisType;
                        msg.myType    = thatType;
                        msg.x         = -x;
                        msg.y         = -y;
                        msg.direction = vector.getInverse();
                        msg.hitType   = hitType;
                        otherEntity.triggerEvent('hit-by-' + thisType, msg);
                        
                        msg.direction.recycle();
                    }
                };

            return function () {
                const
                    entities    = this.groupsLive;
                let i           = entities.length;
                
                while (i--) {
                    const
                        entity = entities[i];

                    if (entity.collisionGroup.getSize() > 1) {
                        const
                            entityCDC = this.checkSolidEntityCollision(entity, entity.collisionGroup),
                            {xData, yData} = entityCDC;
                        let x = xData.length,
                            y = yData.length
                        
                        while (x--) {
                            const
                                messageData = xData[x];
                            triggerCollisionMessages(messageData.thisShape.owner, messageData.thatShape.owner, messageData.thisShape.collisionType, messageData.thatShape.collisionType, messageData.direction, 0, 'solid', messageData.vector);
                        }
                        
                        while (y--) {
                            const
                                messageData = yData[y];

                                triggerCollisionMessages(messageData.thisShape.owner, messageData.thatShape.owner, messageData.thisShape.collisionType, messageData.thatShape.collisionType, 0, messageData.direction, 'solid', messageData.vector);
                        }
                        
                        entityCDC.recycle();
                    }
                }
            };
        }()),
        
        checkSolidCollisions: (function () {
            const
                triggerCollisionMessages = function (entity, otherEntity, thisType, thatType, x, y, hitType, vector) {
                    const
                        msg = triggerMessage;
                
                    msg.entity    = otherEntity;
                    msg.target    = entity;
                    msg.myType    = thisType;
                    msg.type      = thatType;
                    msg.x         = x;
                    msg.y         = y;
                    msg.direction = vector;
                    msg.hitType   = hitType;
                    entity.triggerEvent('hit-by-' + thatType, msg);
                    
                    if (otherEntity) {
                        msg.entity    = entity;
                        msg.target    = otherEntity;
                        msg.type      = thisType;
                        msg.myType    = thatType;
                        msg.x         = -x;
                        msg.y         = -y;
                        msg.direction = vector.getInverse();
                        msg.hitType   = hitType;
                        otherEntity.triggerEvent('hit-by-' + thisType, msg);
                        
                        msg.direction.recycle();
                    }
                };

            return function () {
                const
                    entities    = this.solidEntitiesLive;
                let i = entities.length;
                
                while (i--) {
                    const
                        entity = entities[i],
                        entityCDC = this.checkSolidEntityCollision(entity, entity),
                        {xData, yData} = entityCDC;
                    let x = xData.length,
                        y = yData.length
                    
                    while (x--) {
                        const
                            messageData = xData[x];

                        triggerCollisionMessages(messageData.thisShape.owner, messageData.thatShape.owner, messageData.thisShape.collisionType, messageData.thatShape.collisionType, messageData.direction, 0, 'solid', messageData.vector);
                    }
                    
                    while (y--) {
                        const
                            messageData = yData[y];

                        triggerCollisionMessages(messageData.thisShape.owner, messageData.thatShape.owner, messageData.thisShape.collisionType, messageData.thatShape.collisionType, 0, messageData.direction, 'solid', messageData.vector);
                    }
                    
                    entityCDC.recycle();
                }
            };
        }()),
        
        checkSolidEntityCollision: function (ent, entityOrGroup) {
            const
                {bullet, collisionDirty, previousX, previousY, x, y} = ent,
                collisionDataCollection = CollisionDataContainer.setUp(),
                dX                = x - previousX,
                dY                = y - previousY,
                collisionTypes    = entityOrGroup.getCollisionTypes(),
                ignoredEntities   = entityOrGroup.getSolidEntities?.() ?? false;
            let finalMovementInfo = Vector.setUp(ent.position);
            
            if (dX || dY || collisionDirty) {
                
                if (bullet) {
                    const
                        min = Math.min;
                    let sW = Infinity,
                        sH = Infinity,
                        i = collisionTypes.length;                        
    
                    while (i--) {
                        const
                            aabb = entityOrGroup.getAABB(collisionTypes[i]);

                        sW = min(sW, aabb.width);
                        sH = min(sH, aabb.height);
                    }

                    {
                        const
                            //Stepping to catch really fast entities - this is not perfect, but should prevent the majority of fallthrough cases.
                            steps = min(Math.ceil(Math.max(Math.abs(dX) / sW, Math.abs(dY) / sH)), 100), //Prevent memory overflow if things move exponentially far.
                            stepDX   = dX / steps,
                            stepDY   = dY / steps;
                        let step = steps;

                        while (step--) {
                            entityOrGroup.prepareCollision(ent.previousX + stepDX, ent.previousY + stepDY);

                            finalMovementInfo = this.processCollisionStep(ent, entityOrGroup, ignoredEntities, collisionDataCollection, finalMovementInfo.setVector(ent.position), stepDX, stepDY, collisionTypes);
                            
                            if ((finalMovementInfo.x === ent.previousX) && (finalMovementInfo.y === ent.previousY)) {
                                entityOrGroup.relocateEntity(finalMovementInfo, collisionDataCollection);
                                //No more movement so we bail!
                                break;
                            } else {
                                entityOrGroup.relocateEntity(finalMovementInfo, collisionDataCollection);
                            }
                        }
                    }
                } else {
                    entityOrGroup.prepareCollision(previousX + dX, previousY + dY);
                    finalMovementInfo = this.processCollisionStep(ent, entityOrGroup, ignoredEntities, collisionDataCollection, finalMovementInfo, dX, dY, collisionTypes);
                    entityOrGroup.relocateEntity(finalMovementInfo, collisionDataCollection);
                }

                if ((finalMovementInfo.x !== previousX) || (finalMovementInfo.y !== previousY)) {
                    this.updateAgainst(ent);
                }
            }
            
            finalMovementInfo.recycle();
            
            return collisionDataCollection;
        },
        
        processCollisionStep: (function () {
            const
                sweeper = AABB.setUp(),
                includeEntity = function (thisEntity, aabb, otherEntity, otherAABB, ignoredEntities, sweepAABB) {
                    //Chop out all the special case entities we don't want to check against.
                    if (otherEntity === thisEntity) {
                        return false;
                    } else if (otherEntity.jumpThrough && (aabb.bottom > otherAABB.top)) {
                        return false;
                    } else if (thisEntity.jumpThrough  && (otherAABB.bottom > aabb.top)) { // This will allow platforms to hit something solid sideways if it runs into them from the side even though originally they were above the top. - DDD
                        return false;
                    } else if (ignoredEntities) {
                        let i = ignoredEntities.length;

                        while (i--) {
                            if (otherEntity === ignoredEntities[i]) {
                                return false;
                            }
                        }
                    }
                    
                    return sweepAABB.collides(otherAABB);
                };

            return function (ent, entityOrGroup, ignoredEntities, collisionDataCollection, finalMovementInfo, entityDeltaX, entityDeltaY, collisionTypes) {
                const
                    potentialCollidingShapes = arrayCache.setUp(),
                    terrain                  = this.terrain,
                    solidCollisionMap        = entityOrGroup.getSolidCollisions(),
                    sweepAABB                = sweeper;
                let i = collisionTypes.length,
                    potentialCollision = false;
                
                while (i--) {
                    //Sweep the full movement of each collision type
                    const
                        pcsGroup = potentialCollidingShapes[i] = arrayCache.setUp(),
                        collisionType = collisionTypes[i],
                        previousAABB = entityOrGroup.getPreviousAABB(collisionType),
                        currentAABB = entityOrGroup.getAABB(collisionType),
                        collisionSubTypes = solidCollisionMap.get(collisionType);
                    let againstGrid = null,
                        j = collisionSubTypes.length;;

                    sweepAABB.set(currentAABB);
                    sweepAABB.include(previousAABB);
                    
                    againstGrid = this.getAgainstGrid(ent, sweepAABB, collisionSubTypes);
                    
                    while (j--) {
                        const
                            otherCollisionType = collisionSubTypes[j],
                            otherEntities = againstGrid[otherCollisionType];

                        if (otherEntities) {
                            let k = otherEntities.length;

                            while (k--) {
                                const
                                    otherEntity = otherEntities[k],
                                    otherAABB = otherEntity.getAABB(otherCollisionType);

                                //Do our sweep check against the AABB of the other object and add potentially colliding shapes to our list.
                                if (includeEntity(ent, previousAABB, otherEntity, otherAABB, ignoredEntities, sweepAABB)) {
                                    const
                                        otherShapes = otherEntity.getShapes(otherCollisionType);
                                    let l = otherShapes.length;

                                    while (l--) {
                                        //Push the shapes on the end!
                                        pcsGroup.push(otherShapes[l]);
                                    }
                                    potentialCollision = true;
                                }
                            }
                            arrayCache.recycle(otherEntities);
                        } else if (terrain) {
                            //Do our sweep check against the tiles and add potentially colliding shapes to our list.
                            const
                                otherShapes = terrain.getTileShapes(sweepAABB, previousAABB, otherCollisionType);
                            let k = otherShapes.length;

                            while (k--) {
                                //Push the shapes on the end!
                                pcsGroup.push(otherShapes[k]);
                                potentialCollision = true;
                            }
                        }
                    }
                    againstGrid.recycle();
                }

                if (potentialCollision) {
                    finalMovementInfo = this.resolveCollisionPosition(ent, entityOrGroup, finalMovementInfo, potentialCollidingShapes, collisionDataCollection, collisionTypes, entityDeltaX, entityDeltaY);
                }
                
                // Array recycling
                arrayCache.recycle(potentialCollidingShapes, 2);
                
                return finalMovementInfo;
            };
        }()),
        
        resolveCollisionPosition: function (ent, entityOrGroup, finalMovementInfo, potentialCollidingShapes, collisionDataCollection, collisionTypes, entityDeltaX, entityDeltaY) {
            if (entityDeltaX !== 0) {
                let j = collisionTypes.length;

                while (j--) {
                    //Move each collision type in X to find the min X movement
                    const
                        cd = this.findMinAxisMovement(ent, entityOrGroup, collisionTypes[j], 'x', potentialCollidingShapes[j]);
                    
                    if (!cd.occurred || !collisionDataCollection.tryToAddX(cd)) {
                        cd.recycle();
                    }
                }
            }
            
            {
                const
                    cd = collisionDataCollection.xData[0];
                if (cd) {
                    finalMovementInfo.x = ent.previousX + cd.deltaMovement * cd.direction;
                } else {
                    finalMovementInfo.x = ent.x;
                }
            }
            
            // This moves the previous position of everything so that the check in Y can begin.
            entityOrGroup.movePreviousX(finalMovementInfo.x);
            
            if (entityDeltaY !== 0) {
                let j = collisionTypes.length;

                while (j--) {
                    //Move each collision type in Y to find the min Y movement
                    const
                        cd = this.findMinAxisMovement(ent, entityOrGroup, collisionTypes[j], 'y', potentialCollidingShapes[j]);
                    
                    if (!cd.occurred || !collisionDataCollection.tryToAddY(cd)) {
                        cd.recycle();
                    }
                }
            }
            
            {
                const
                    cd = collisionDataCollection.yData[0];
                if (cd) {
                    finalMovementInfo.y = ent.previousY + cd.deltaMovement * cd.direction;
                } else {
                    finalMovementInfo.y = ent.y;
                }
            }
            
            return finalMovementInfo;
        },
        
        findMinAxisMovement: function (ent, entityOrGroup, collisionType, axis, potentialCollidingShapes) {
            //Loop through my shapes of this type vs the colliding shapes and do precise collision returning the shortest movement in axis direction
            const
                shapes = entityOrGroup.getShapes(collisionType),
                prevShapes = entityOrGroup.getPrevShapes(collisionType);
            let bestCD = CollisionData.setUp(),
                i = shapes.length;
            
            while (i--) {
                const
                    cd = this.findMinShapeMovementCollision(prevShapes[i], shapes[i], axis, potentialCollidingShapes);
                
                if (cd.occurred && (!bestCD.occurred //if a collision occurred and we haven't already had a collision.
                    || (cd.deltaMovement < bestCD.deltaMovement))) { //if a collision occurred and the diff is smaller than our best diff.
                    bestCD.recycle();
                    bestCD = cd;
                } else {
                    cd.recycle();
                }
            }
            
            return bestCD;
        },
        
        /**
         * Find the earliest point at which this shape collides with one of the potential colliding shapes along this axis.
         * For example, cycles through shapes a, b, and c to find the earliest position:
         *
         *    O---->   [b]  [a]     [c]
         *
         *    Returns collision location for:
         *
         *            O[b]
         *
         */
        findMinShapeMovementCollision: (function () {
            const
                returnInfo = {
                    position: 0,
                    contactVector: Vector.setUp()
                },
                getMovementDistance = function (currentDistance, minimumDistance) {
                    const
                        pow = Math.pow;
                    
                    return Math.sqrt(pow(minimumDistance, 2) - pow(currentDistance, 2));
                },
                getCorner = function (circlePos, rectanglePos, half) {
                    const
                        diff = circlePos - rectanglePos;
                    
                    return diff - (diff / Math.abs(diff)) * half;
                },
                getOffsetForCircleVsAABBX = function (circle, rect, moving, direction, v) {
                    const
                        aabb = rect.aABB,
                        hw = aabb.halfWidth,
                        {x, y} = circle;

                    if (y >= aabb.top && y <= aabb.bottom) {
                        return hw + circle.radius;
                    } else {
                        const
                            cornerY = getCorner(y, rect.y, aabb.halfHeight),
                            newAxisPosition = hw + getMovementDistance(cornerY, circle.radius);

                        if (moving === circle) {
                            v.x = -getCorner(x - direction * newAxisPosition, rect.x, hw) / 2;
                            v.y = -cornerY;
                        } else {
                            v.x = getCorner(x, rect.x - direction * newAxisPosition, hw) / 2;
                            v.y = cornerY;
                        }
                        v.normalize();
                        return newAxisPosition;
                    }
                },
                getOffsetForCircleVsAABBY = function (circle, rect, moving, direction, v) {
                    const
                        aabb = rect.aABB,
                        hh = aabb.halfHeight,
                        {x, y} = circle;

                    if (x >= aabb.left && x <= aabb.right) {
                        return hh + circle.radius;
                    } else {
                        const
                            cornerX = getCorner(x, rect.x, aabb.halfWidth),
                            newAxisPosition = hh + getMovementDistance(cornerX, circle.radius);

                        if (moving === circle) {
                            v.x = -cornerX;
                            v.y = -getCorner(y - direction * newAxisPosition, rect.y, hh) / 2;
                        } else {
                            v.x = cornerX;
                            v.y = getCorner(y, rect.y - direction * newAxisPosition, hh) / 2;
                        }
                        v.normalize();
                        return newAxisPosition;
                    }
                },
                findAxisCollisionPosition = { // Decision tree for quicker access, optimized for mobile devices.
                    x: {
                        rectangle: {
                            rectangle: function (direction, thisShape, thatShape) {
                                const
                                    ri = returnInfo;

                                ri.position = thatShape.x - direction * (thatShape.aABB.halfWidth + thisShape.aABB.halfWidth);
                                ri.contactVector.setXYZ(direction, 0);

                                return ri;
                            },
                            circle: function (direction, thisShape, thatShape) {
                                const
                                    ri = returnInfo;

                                ri.position = thatShape.x - direction * getOffsetForCircleVsAABBX(thatShape, thisShape, thisShape, direction, ri.contactVector.setXYZ(direction, 0));

                                return ri;
                            }
                        },
                        circle: {
                            rectangle: function (direction, thisShape, thatShape) {
                                const
                                    ri = returnInfo;

                                ri.position = thatShape.x - direction * getOffsetForCircleVsAABBX(thisShape, thatShape, thisShape, direction, ri.contactVector.setXYZ(direction, 0));

                                return ri;
                            },
                            circle: function (direction, thisShape, thatShape) {
                                const
                                    y = thatShape.y - thisShape.y,
                                    position = thatShape.x - direction * getMovementDistance(y, thisShape.radius + thatShape.radius),
                                    ri = returnInfo;
                                    
                                ri.contactVector.setXYZ(thatShape.x - position, y).normalize();
                                ri.position = position;

                                return ri;
                            }
                        }
                    },
                    y: {
                        rectangle: {
                            rectangle: function (direction, thisShape, thatShape) {
                                const
                                    ri = returnInfo;

                                ri.position = thatShape.y - direction * (thatShape.aABB.halfHeight + thisShape.aABB.halfHeight);
                                ri.contactVector.setXYZ(0, direction);
                                
                                return ri;
                            },
                            circle: function (direction, thisShape, thatShape) {
                                const
                                    ri = returnInfo;

                                ri.position = thatShape.y - direction * getOffsetForCircleVsAABBY(thatShape, thisShape, thisShape, direction, ri.contactVector.setXYZ(0, direction));

                                return ri;
                            }
                        },
                        circle: {
                            rectangle: function (direction, thisShape, thatShape) {
                                const
                                    ri = returnInfo;

                                ri.position = thatShape.y - direction * getOffsetForCircleVsAABBY(thisShape, thatShape, thisShape, direction, ri.contactVector.setXYZ(0, direction));

                                return ri;
                            },
                            circle: function (direction, thisShape, thatShape) {
                                const
                                    x = thatShape.x - thisShape.x,
                                    position = thatShape.y - direction * getMovementDistance(x, thisShape.radius + thatShape.radius),
                                    ri = returnInfo;
                                    
                                ri.contactVector.setXYZ(x, thatShape.y - position).normalize();
                                ri.position = position;

                                return ri;
                            }
                        }
                    }
                };
            
            return function (translatedShape, currentShape, axis, potentialCollidingShapes) {
                const
                    initialPoint    = translatedShape[axis],
                    goalPoint       = currentShape[axis],
                    direction       = ((initialPoint < goalPoint) ? 1 : -1),
                    cd              = CollisionData.setUp();
                let finalPosition = goalPoint;
                
                if (initialPoint !== goalPoint) {
                    const
                        findACP = findAxisCollisionPosition[axis][translatedShape.type];
                    let i = potentialCollidingShapes.length

                    if (axis === 'x') {
                        translatedShape.moveX(goalPoint);
                    } else if (axis === 'y') {
                        translatedShape.moveY(goalPoint);
                    }
                    
                    while (i--) {
                        const
                            pcShape = potentialCollidingShapes[i];

                        if (translatedShape.collides(pcShape)) {
                            const
                                collisionInfo = findACP[pcShape.type](direction, translatedShape, pcShape),
                                position = collisionInfo.position;

                            if (direction > 0) {
                                if (position < finalPosition) {
                                    finalPosition = position < initialPoint ? initialPoint : position;  // Reality check: I think this is necessary due to floating point inaccuracies. - DDD
                                    cd.set(true, direction, finalPosition, Math.abs(finalPosition - initialPoint), pcShape.aABB, currentShape, pcShape, collisionInfo.contactVector, 0);
                                }
                            } else if (position > finalPosition) {
                                finalPosition = position > initialPoint ? initialPoint : position; // Reality check: I think this is necessary due to floating point inaccuracies. - DDD
                                cd.set(true, direction, finalPosition, Math.abs(finalPosition - initialPoint), pcShape.aABB, currentShape, pcShape, collisionInfo.contactVector, 0);
                            }
                        }
                    }
                }
                
                return cd;
            };
        }()),
        
        checkSoftCollisions () {
            const
                softs = this.softEntitiesLive;
            let i = softs.length;
                
            while (i--) {
                const
                    entity = softs[i];

                this.checkEntityForSoftCollisions(entity, (collision) => {
                    entity.triggerEvent('hit-by-' + collision.type, collision);
                });
            }
        },
        
        checkEntityForSoftCollisions: function (ent, callback) {
            const
                message = triggerMessage;
            let i   = ent.collisionTypes.length;

            message.x = 0;
            message.y = 0;

            while (i--) {
                const
                    collisionType = ent.collisionTypes[i],
                    softCollisionMap = ent.softCollisionMap.get(collisionType),
                    againstGrid = this.getEntityAgainstGrid(ent, softCollisionMap);
                let j = softCollisionMap.length;

                while (j--) {
                    const
                        otherCollisionType = softCollisionMap[j],
                        otherEntities = againstGrid[otherCollisionType];

                    if (otherEntities) {
                        let k = otherEntities.length;

                        while (k--) {
                            const
                                otherEntity = otherEntities[k];

                            if ((otherEntity !== ent) && (ent.getAABB(collisionType).collides(otherEntity.getAABB(otherCollisionType)))) {
                                const
                                    shapes = ent.getShapes(collisionType),
                                    otherShapes = otherEntity.getShapes(otherCollisionType);
                                let collisionFound = false,
                                    l = shapes.length;

                                while (l--) {
                                    let m = otherShapes.length;

                                    while (m--) {
                                        if (shapes[l].collides(otherShapes[m])) {
                                            //TML - We're only reporting the first shape we hit even though there may be multiple that we could be hitting.
                                            message.entity  = otherEntity;
                                            message.target  = ent;
                                            message.type    = otherCollisionType;
                                            message.myType  = collisionType;
                                            message.shape   = otherShapes[m];
                                            message.hitType = 'soft';
                                            
                                            callback(message);
                                            
                                            collisionFound = true;
                                            break;
                                        }
                                    }
                                    if (collisionFound) {
                                        break;
                                    }
                                }
                            }
                        }
                        arrayCache.recycle(otherEntities);
                    }
                }
                againstGrid.recycle();
            }
        },


        checkShapeForCollisions: function (shape, softCollisionMap, callback) {
            const
                againstGrid = this.getAgainstGrid(null, shape.getAABB(), softCollisionMap),
                message = triggerMessage;
            let j = softCollisionMap.length;

            message.x = 0;
            message.y = 0;

            while (j--) {
                const
                    otherCollisionType = softCollisionMap[j],
                    otherEntities = againstGrid[otherCollisionType];

                if (otherEntities) {
                    let k = otherEntities.length;

                    while (k--) {
                        const
                            otherEntity = otherEntities[k];

                        if ((shape.getAABB().collides(otherEntity.getAABB(otherCollisionType)))) {
                            const
                                otherShapes = otherEntity.getShapes(otherCollisionType);
                            let m = otherShapes.length;

                            while (m--) {
                                if (shape.collides(otherShapes[m])) {
                                    //TML - We're only reporting the first shape we hit even though there may be multiple that we could be hitting.
                                    message.entity  = otherEntity;
                                    message.target  = null;
                                    message.type    = otherCollisionType;
                                    message.myType  = '';
                                    message.shape   = otherShapes[m];
                                    message.hitType = 'soft';
                                    
                                    callback(message);
                                    break;
                                }
                            }
                        }
                    }
                    arrayCache.recycle(otherEntities);
                }
            }
            againstGrid.recycle();
        },

        
        checkPointForCollisions: function (x, y, collisions, callback) {
            const
                gb = this.gridBits,
                againstGrid = this.againstGrid[getBucketId(x, y, gb)],
                message = triggerMessage;
            let j = collisions.length;

            message.x = 0;
            message.y = 0;

            if (!againstGrid) {
                return;
            }
            
            while (j--) {
                const
                    otherCollisionType = collisions[j],
                    otherEntities = againstGrid.get(otherCollisionType);

                if (otherEntities) {
                    let k = otherEntities.length;

                    while (k--) {
                        const
                            otherEntity = otherEntities[k];

                        if (otherEntity.getAABB(otherCollisionType).containsPoint(x, y)) {
                            const
                                otherShapes = otherEntity.getShapes(otherCollisionType);
                            let m = otherShapes.length;

                            while (m--) {
                                if (otherShapes[m].containsPoint(x, y)) {
                                    //TML - We're only reporting the first shape we hit even though there may be multiple that we could be hitting.
                                    message.entity  = otherEntity;
                                    message.target  = null;
                                    message.type    = otherCollisionType;
                                    message.myType  = '';
                                    message.shape   = otherShapes[m];
                                    message.hitType = 'soft';
                                    
                                    callback(message);
                                    
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        },
        
        destroy: function () {
            const
                ag = this.againstGrid,
                keys = Object.keys(ag),
                {length} = keys;
            
            arrayCache.recycle(this.groupsLive);
            arrayCache.recycle(this.nonColliders);
            arrayCache.recycle(this.allEntitiesLive);
            arrayCache.recycle(this.softEntitiesLive);
            arrayCache.recycle(this.solidEntitiesLive);
            this.relocationMessage.position.recycle();
            this.relocationMessage.recycle();

            for (let i = 0; i < length; i++) {
                const
                    data = ag[keys[i]],
                    dataKeys = data.keys;
                let j = dataKeys.length;

                while (j--) {
                    arrayCache.recycle(data.get(dataKeys[j]));
                }
                data.recycle();
            }
            ag.recycle();
            this.againstGrid = null;
        }
    },
    
    publicMethods: {
        /**
         * This method returns an object containing world entities.
         *
         * @method platypus.components.HandlerCollision#getWorldEntities
         * @return {Array} A list of all world collision entities.
         */
        getWorldEntities: function () {
            return this.allEntitiesLive;
        },
        
        /**
         * This method returns an entity representing the collision map of the world.
         *
         * @method platypus.components.HandlerCollision#getWorldTerrain
         * @return {Entity} - An entity describing the collision map of the world. This entity typically includes a `CollisionTiles` component.
         */
        getWorldTerrain: function () {
            return this.terrain;
        },
        
        /**
         * This method returns a list of collision objects describing soft collisions between an entity and a list of other entities.
         *
         * @method platypus.components.HandlerCollision#getEntityCollisions
         * @param entity {Entity} The entity to test against the world.
         * @return collisions {Array} This is a list of collision objects describing the soft collisions.
         */
        getEntityCollisions: function (entity) {
            const
                collisions = arrayCache.setUp();
            
            this.checkEntityForSoftCollisions(entity, (collision) => collisions.push(Data.setUp(collision)));
            
            return collisions;
        },
        
        /**
         * This method returns a list of collision objects describing collisions between a shape and a list of other entities.
         *
         * @method platypus.components.HandlerCollision#getShapeCollisions
         * @param shape {CollisionShape} The shape to check for collisions.
         * @param collisionTypes {String[]} The collision types to check against.
         * @return collisions {Array} This is a list of collision objects describing the soft collisions.
         */
        getShapeCollisions: function (shape, collisionTypes) {
            const
                collisions = arrayCache.setUp();
            
            this.checkShapeForCollisions(shape, collisionTypes, (collision) => collisions.push(Data.setUp(collision)));
            
            return collisions;
        },

        /**
         * This method returns a list of collision objects describing collisions between a point and a list of other entities.
         *
         * @method platypus.components.HandlerCollision#getPointCollisions
         * @param x {number} The x-axis value.
         * @param y {number} The y-axis value.
         * @param collisionTypes {String[]} The collision types to check against.
         * @return collisions {Array} This is a list of collision objects describing the soft collisions.
         */
        getPointCollisions: function (x, y, collisionTypes) {
            const
                collisions = arrayCache.setUp();
            
            this.checkPointForCollisions(x, y, collisionTypes, (collision) => collisions.push(Data.setUp(collision)));
            
            return collisions;
        }
    }
});
