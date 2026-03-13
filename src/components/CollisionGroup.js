import {arrayCache, greenSplice, union} from '../utils/array.js';
import AABB from '../AABB.js';
import DataMap from '../DataMap.js';
import Vector from '../Vector.js';
import createComponentClass from '../factory.js';

export default (function () {
    return createComponentClass(/** @lends platypus.components.CollisionGroup.prototype */{
        id: 'CollisionGroup',
        
        /**
         * This component groups other entities with this entity for collision checking. This is useful for carrying and moving platforms. It uses `EntityContainer` component messages if triggered to add to its collision list and also listens for explicit add/remove messages (useful in the absence of an `EntityContainer` component).
         *
         * @memberof platypus.components
         * @uses platypus.Component
         * @constructs
         * @listens platypus.Entity#add-collision-entity
         * @listens platypus.Entity#child-entity-added
         * @listens platypus.Entity#child-entity-removed
         * @listens platypus.Entity#relocate-entity
         * @listens platypus.Entity#remove-collision-entity
         */
        initialize: function () {
            this.solidEntities = arrayCache.setUp();
            
            // These are used as return values for methods, but are instantiated here for recycling later.
            this.collisionTypes = arrayCache.setUp();
            this.shapes = arrayCache.setUp();
            this.prevShapes = arrayCache.setUp();
            
            this.terrain  = null;
            this.aabb     = AABB.setUp(this.owner.x, this.owner.y);
            this.prevAABB = AABB.setUp(this.owner.x, this.owner.y);
            this.filteredAABB = AABB.setUp();

            Vector.assign(this.owner, 'position', 'x', 'y', 'z');
            Vector.assign(this.owner, 'previousPosition', 'previousX', 'previousY', 'previousZ');
            this.owner.previousX = this.owner.previousX || this.owner.x;
            this.owner.previousY = this.owner.previousY || this.owner.y;
            
            this.collisionGroup = this.owner.collisionGroup = {
                getAllEntities: function () {
                    let count = 0;
                    
                    for (let x = 0; x < this.solidEntities.length; x++) {
                        const
                            childEntity = this.solidEntities[x];

                        if ((childEntity !== this.owner) && childEntity.collisionGroup) {
                            count += childEntity.collisionGroup.getAllEntities();
                        } else {
                            count += 1;
                        }
                    }

                    return count;
                }.bind(this),
                getSize: function () {
                    return this.solidEntities.length;
                }.bind(this),
                getCollisionTypes: function () {
                    return this.getCollisionTypes();
                }.bind(this),
                getSolidCollisions: function () {
                    return this.getSolidCollisions();
                }.bind(this),
                getAABB: function (collisionType) {
                    return this.getAABB(collisionType);
                }.bind(this),
                getPreviousAABB: function (collisionType) {
                    return this.getPreviousAABB(collisionType);
                }.bind(this),
                getShapes: function (collisionType) {
                    return this.getShapes(collisionType);
                }.bind(this),
                getPrevShapes: function (collisionType) {
                    return this.getPrevShapes(collisionType);
                }.bind(this),
                prepareCollision: function (x, y) {
                    return this.prepareCollision(x, y);
                }.bind(this),
                relocateEntity: function (vector, collisionData) {
                    return this.relocateEntity(vector, collisionData);
                }.bind(this),
                movePreviousX: function (x) {
                    return this.movePreviousX(x);
                }.bind(this),
                getSolidEntities: function () {
                    return this.solidEntities;
                }.bind(this),
                jumpThrough: false //TODO: this introduces odd behavior - not sure how to resolve yet. - DDD
            };
        },
        
        events: {
            "child-entity-added": function (entity) {
                this.addCollisionEntity(entity);
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
            
            "relocate-entity": function () {
                this.owner.previousPosition.setVector(this.owner.position);
                this.updateAABB();
            }
        },
        
        methods: {
            addCollisionEntity: function (entity) {
                const
                    {collisionTypes: types} = entity;
                
                if (types) {
                    let i = types.length;
                    while (i--) {
                        if (entity.solidCollisionMap.get(types[i]).length && !entity.immobile) {
                            const
                                j = this.solidEntities.indexOf(entity);

                            if (j === -1) {
                                this.solidEntities[this.solidEntities.length] = entity;
                            }
                        }
                    }
                    this.updateAABB();
                }
            },
            
            removeCollisionEntity: function (entity) {
                const
                    {collisionTypes: types} = entity;

                if (types) {
                    let i = types.length;
                    while (i--) {
                        if (entity.solidCollisionMap.get(types[i]).length) {
                            const
                                j = this.solidEntities.indexOf(entity);

                            if (j >= 0) {
                                greenSplice(this.solidEntities, j);
                            }
                        }
                    }
                    this.updateAABB();
                }
            },
            
            getCollisionTypes: function () {
                const
                    {collisionTypes, owner, solidEntities} = this;
                let i = solidEntities.length;
                
                collisionTypes.length = 0;
                
                while (i--) {
                    const
                        childEntity = solidEntities[i];

                    if ((childEntity !== owner) && childEntity.collisionGroup) {
                        childEntity = childEntity.collisionGroup;
                    }
                    union(collisionTypes, childEntity.getCollisionTypes());
                }
                
                return collisionTypes;
            },

            getSolidCollisions: function () {
                const
                    {owner, solidEntities} = this,
                    compiledList = DataMap.setUp();
                
                for (let x = 0; x < solidEntities.length; x++) {
                    const
                        solidEntity = solidEntities[x],
                        {collisionGroup} = solidEntity,
                        useGC = (solidEntity !== owner) && collisionGroup,
                        childEntity = useGC ? collisionGroup : solidEntity,
                        entityList = childEntity.getSolidCollisions(),
                        keys = entityList.keys;
                    let i = keys.length;

                    while (i--) {
                        const
                            key = keys[i],
                            toList = compiledList.get(key) || compiledList.set(key, arrayCache.setUp()),
                            fromList = entityList.get(key);
                            
                        union(toList, fromList);

                        if (useGC) {
                            fromList.recycle();
                        }
                    }
                    if (useGC) {
                        entityList.recycle();
                    }
                }
                
                return compiledList; // TODO: Track down where this is used and make sure the arrays are recycled. - DDD 2/1/2016
            },
            
            getAABB: function (collisionType) {
                if (!collisionType) {
                    return this.aabb;
                } else {
                    const
                        {filteredAABB, owner, solidEntities} = this;
                    let i = solidEntities.length;
                    
                    filteredAABB.reset();

                    while (i--) {
                        const
                            solidEntity = solidEntities[i],
                            {collisionGroup} = solidEntity,
                            useGC = (solidEntity !== owner) && collisionGroup,
                            childEntity = useGC ? collisionGroup : solidEntity,
                            incAABB = childEntity.getAABB(collisionType);

                        if (incAABB) {
                            filteredAABB.include(incAABB);
                        }
                    }
                    return filteredAABB;
                }
            },

            getPreviousAABB: function (collisionType) {
                if (!collisionType) {
                    return this.prevAABB;
                } else {
                    const
                        {filteredAABB, owner, solidEntities} = this;
                    let i = solidEntities.length;
                    
                    filteredAABB.reset();

                    while (i--) {
                        const
                            solidEntity = solidEntities[i],
                            {collisionGroup} = solidEntity,
                            useGC = (solidEntity !== owner) && collisionGroup,
                            childEntity = useGC ? collisionGroup : solidEntity,
                            incAABB = childEntity.getPreviousAABB(collisionType);

                        if (incAABB) {
                            filteredAABB.include(incAABB);
                        }
                    }
                    return filteredAABB;
                }
            },
            
            updateAABB: function () {
                const
                    {aabb, owner, solidEntities} = this;
                let i = solidEntities.length;
                
                aabb.reset();
                while (i--) {
                    const
                        entity = solidEntities[i];

                    aabb.include(((entity !== owner) && entity.getCollisionGroupAABB) ? entity.getCollisionGroupAABB() : entity.getAABB());
                }
            },
            
            getShapes: function (collisionType) {
                const
                    {owner, shapes, solidEntities} = this;
                    
                shapes.length = 0;
                
                for (let i = 0; i < solidEntities.length; i++) {
                    const
                        solidEntity = solidEntities[i],
                        {collisionGroup} = solidEntity,
                        useGC = (solidEntity !== owner) && collisionGroup,
                        childEntity = useGC ? collisionGroup : solidEntity,
                        newShapes = childEntity.getShapes(collisionType);

                    if (newShapes) {
                        union(shapes, newShapes);
                    }
                }
                return shapes;
            },

            getPrevShapes: function (collisionType) {
                const
                    {owner, prevShapes: shapes, solidEntities} = this;
                    
                shapes.length = 0;
                
                for (let i = 0; i < solidEntities.length; i++) {
                    const
                        solidEntity = solidEntities[i],
                        {collisionGroup} = solidEntity,
                        useGC = (solidEntity !== owner) && collisionGroup,
                        childEntity = useGC ? collisionGroup : solidEntity,
                        newShapes = childEntity.getPrevShapes(collisionType);

                    if (newShapes) {
                        union(shapes, newShapes);
                    }
                }
                return shapes;
            },
            
            prepareCollision: function (x, y) {
                const
                    {owner, solidEntities} = this;
                
                for (let i = 0; i < solidEntities.length; i++) {
                    const
                        childEntity = solidEntities[i],
                        oX = owner.previousX - childEntity.previousX,
                        oY = owner.previousY - childEntity.previousY;

                    childEntity.saveDX = childEntity.x - childEntity.previousX;
                    childEntity.saveDY = childEntity.y - childEntity.previousY;
                    childEntity.saveOX = oX;
                    childEntity.saveOY = oY;

                    if ((childEntity !== owner) && childEntity.collisionGroup) {
                        childEntity.collisionGroup.prepareCollision(x - oX, y - oY);
                    } else {
                        childEntity.prepareCollision(x - oX, y - oY);
                    }
                }
            },
            
            movePreviousX: function (x) {
                const
                    {owner, solidEntities} = this;
                
                for (let i = 0; i < solidEntities.length; i++) {
                    const
                        childEntity = solidEntities[i],
                        offset = childEntity.saveOX;

                    if ((childEntity !== owner) && childEntity.collisionGroup) {
                        childEntity.collisionGroup.movePreviousX(x - offset);
                    } else {
                        childEntity.movePreviousX(x - offset);
                    }
                }
            },
            
            relocateEntity: function (vector, collisionData) {
                const
                    {owner, solidEntities} = this,
                    {xData, yData} = collisionData;
                let x = xData.length,
                    y = yData.length;
                
                owner.saveDX -= vector.x - owner.previousX;
                owner.saveDY -= vector.y - owner.previousY;

                while (x--) {
                    if (xData[x].thisShape.owner === owner) {
                        owner.saveDX = 0;
                        break;
                    }
                }
                
                while (y--) {
                    if (yData[y].thisShape.owner === owner) {
                        owner.saveDY = 0;
                        break;
                    }
                }
                
                for (let i = 0; i < solidEntities.length; i++) {
                    const
                        solidEntity = solidEntities[i],
                        {collisionGroup} = solidEntity,
                        useGC = (solidEntity !== owner) && collisionGroup,
                        childEntity = useGC ? collisionGroup : solidEntity,
                        v = Vector.setUp(vector.x - solidEntity.saveOX, vector.y - solidEntity.saveOY, childEntity.z);

                    childEntity.relocateEntity(v, collisionData);
                    v.recycle();
                    solidEntity.x += solidEntity.saveDX;
                    solidEntity.y += solidEntity.saveDY;
                    if (solidEntity !== owner) {
                        solidEntity.x += owner.saveDX;
                        solidEntity.y += owner.saveDY;
                    }
                }
            },

            destroy: function () {
                arrayCache.recycle(this.solidEntities);
                arrayCache.recycle(this.collisionTypes);
                arrayCache.recycle(this.shapes);
                arrayCache.recycle(this.prevShapes);
                this.aabb.recycle();
                this.prevAABB.recycle();
                this.filteredAABB.recycle();
            }
        },
        
        publicMethods: {
            /**
             * Gets the bounding box of the group of entities.
             *
             * @method platypus.components.CollisionGroup#getCollisionGroupAABB
             * @return platypus.AABB
             */
            getCollisionGroupAABB: function () {
                return this.getAABB();
            },
            
            /**
             * Gets a list of all the entities in the world.
             *
             * @method platypus.components.CollisionGroup#getWorldEntities
             * @return Array
             */
            getWorldEntities: function () {
                return this.owner.parent.getWorldEntities();
            },
            
            /**
             * Gets the collision entity representing the world's terrain.
             *
             * @method platypus.components.CollisionGroup#getWorldTerrain
             * @return platypus.Entity
             */
            getWorldTerrain: function () {
                return this.owner.parent.getWorldTerrain();
            }
        }
    });
}());
