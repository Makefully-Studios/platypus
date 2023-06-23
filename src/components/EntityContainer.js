/* global platypus */
import {arrayCache, greenSlice, greenSplice, union} from '../utils/array.js';
import Data from '../Data.js';
import Entity from '../Entity.js';
import Messenger from '../Messenger.js';
import createComponentClass from '../factory.js';

const
    childBroadcast = function (event) {
        return function (value, debug) {
            this.triggerOnChildren(event, value, debug);
        };
    },
    EntityContainer = createComponentClass(/** @lends platypus.components.EntityContainer.prototype */{
        id: 'EntityContainer',
        
        properties: {
            /**
             * An Array listing messages that are triggered on the entity and should be triggered on the children as well.
             *
             * @property childEvents
             * @type Array
             * @default []
             */
            childEvents: []
        },
        
        /**
         * This component allows the entity to contain child entities. It will add several methods to the entity to manage adding and removing entities.
         *
         * @memberof platypus.components
         * @extends platypus.Messenger
         * @uses platypus.Component
         * @constructs
         * @listens platypus.Entity#add-entity
         * @listens platypus.Entity#child-entity-updated
         * @listens platypus.Entity#handle-logic
         * @listens platypus.Entity#remove-entity
         */
        initialize: function (definition, callback) {
            const
                //combine component list and entity list into one if they both exist.
                owner = this.owner,
                entities = (definition.entities && owner.entities) ? definition.entities.concat(owner.entities) : (definition.entities ?? owner.entities ?? null),
                events = this.childEvents;
    
            Messenger.initialize(this);

            this.newAdds = arrayCache.setUp();

            owner.entities = this.entities = arrayCache.setUp();
            
            this.childEvents = arrayCache.setUp();
            for (let i = 0; i < events.length; i++) {
                this.addNewPublicEvent(events[i]);
            }
            this.addNewPrivateEvent('peer-entity-added');
            this.addNewPrivateEvent('peer-entity-removed');

            if (entities) {
                Promise.all(entities.map((entity) => new Promise((resolve) => this.addEntity(entity, resolve)))).then(callback);
                return true; // notifies owner that this component is asynchronous.
            } else {
                return false;
            }
        },
        
        events: {
            /**
             * This message will added the given entity to this component's list of entities.
             *
             * @event platypus.Entity#add-entity
             * @param entity {platypus.Entity} This is the entity to be added as a child.
             * @param [callback] {Function} A function to run once all of the components on the Entity have been loaded.
             */
            "add-entity": function (entity, callback) {
                this.addEntity(entity, callback);
            },
            
            /**
             * On receiving this message, the provided entity will be removed from the list of child entities.
             *
             * @method platypus.Entity#remove-entity
             * @param entity {platypus.Entity} The entity to remove.
             */
            "remove-entity": function (entity) {
                this.removeEntity(entity);
            },
            
            "child-entity-updated": function (entity) {
                this.updateChildEventListeners(entity);
            },

            "handle-logic": function () {
                const
                    adds = this.newAdds,
                    l = adds.length;

                if (l) {
                    const
                        removals = arrayCache.setUp();
                    let j = 0;

                    //must go in order so entities are added in the expected order.
                    for (let i = 0; i < l; i++) {
                        const
                            adding = adds[i];

                        if (adding.destroyed || !adding.loadingComponents || adding.loadingComponents.attemptResolution()) {
                            removals.push(i);
                        }
                    }

                    j = removals.length;
                    while (j--) {
                        greenSplice(adds, removals[j]);
                    }

                    arrayCache.recycle(removals);
                }
            }
        },
        
        methods: {
            addNewPublicEvent: function (event) {
                this.addNewPrivateEvent(event);
                
                for (let i = 0; i < this.childEvents.length; i++) {
                    if (this.childEvents[i] === event) {
                        return false;
                    }
                }
                this.childEvents.push(event);
                // Listens for specified messages and on receiving them, re-triggers them on child entities.
                this.addEventListener(event, childBroadcast(event));
                
                return true;
            },
            
            addNewPrivateEvent: function (event) {
                if (this._listeners[event]) {
                    return false; // event is already added.
                }

                this._listeners[event] = arrayCache.setUp(); //to signify it's been added even if not used
                
                //Listen for message on children
                for (let x = 0; x < this.entities.length; x++) {
                    if (this.entities[x]._listeners[event]) {
                        for (let y = 0; y < this.entities[x]._listeners[event].length; y++) {
                            this.addChildEventListener(this.entities[x], event, this.entities[x]._listeners[event][y]);
                        }
                    }
                }
                
                return true;
            },
            
            updateChildEventListeners: function (entity) {
                this.removeChildEventListeners(entity);
                this.addChildEventListeners(entity);
            },
            
            addChildEventListeners: function (entity) {
                const
                    {_listeners} = entity,
                    keys = Object.keys(_listeners),
                    {length} = keys;
        
                for (let i = 0; i < length; i++) {
                    const
                        key = keys[i],
                        listener = _listeners[key];

                    if (listener) {
                        for (let i = 0; i < listener.length; i++) {
                            this.addChildEventListener(entity, key, listener[i]);
                        }
                    }
                }
            },
            
            removeChildEventListeners: function (entity) {
                if (entity.containerListener) {
                    const
                        {events, messages} = entity.containerListener;

                    for (let i = 0; i < events.length; i++) {
                        this.removeChildEventListener(entity, events[i], messages[i]);
                    }
                    arrayCache.recycle(events);
                    arrayCache.recycle(messages);
                    entity.containerListener.recycle();
                    entity.containerListener = null;
                }
            },
            
            addChildEventListener: function (entity, event, callback) {
                if (!entity.containerListener) {
                    entity.containerListener = Data.setUp(
                        "events", arrayCache.setUp(),
                        "messages", arrayCache.setUp()
                    );
                }
                entity.containerListener.events.push(event);
                entity.containerListener.messages.push(callback);
                this.on(event, callback, callback._priority || 0);
            },
            
            removeChildEventListener: function (entity, event, callback) {
                const
                    {events, messages} = entity.containerListener;
                
                for (let i = 0; i < events.length; i++) {
                    if ((events[i] === event) && (!callback || (messages[i] === callback))) {
                        this.off(event, messages[i]);
                    }
                }
            },

            destroy: function () {
                const
                    entities = greenSlice(this.entities); // Make a copy to handle entities being destroyed while processing list.
                let i = entities.length;
                
                while (i--) {
                    const
                        entity = entities[i];

                    this.removeChildEventListeners(entity);
                    entity.destroy();
                }
                
                arrayCache.recycle(entities);
                arrayCache.recycle(this.entities);
                this.owner.entities = null;
                arrayCache.recycle(this.childEvents);
                this.childEvents = null;
                arrayCache.recycle(this.newAdds);
                this.newAdds = null;
            }
        },
        
        publicMethods: {
            /**
             * Gets an entity in this layer by its Id. Returns `null` if not found.
             *
             * @method platypus.components.EntityContainer#getEntityById
             * @param {String} id
             * @return {Entity}
             */
            getEntityById: function (id) {
                for (let i = 0; i < this.entities.length; i++) {
                    if (this.entities[i].id === id) {
                        return this.entities[i];
                    }
                    if (this.entities[i].getEntityById) {
                        const
                            selection = this.entities[i].getEntityById(id);

                        if (selection) {
                            return selection;
                        }
                    }
                }
                return null;
            },

            /**
             * Returns a list of entities of the requested type.
             *
             * @method platypus.components.EntityContainer#getEntitiesByType
             * @param {String} type
             * @return {Array}
             */
            getEntitiesByType: function (type) {
                const
                    entities  = arrayCache.setUp();
                
                for (let i = 0; i < this.entities.length; i++) {
                    if (this.entities[i].type === type) {
                        entities.push(this.entities[i]);
                    }
                    if (this.entities[i].getEntitiesByType) {
                        const
                            selection = this.entities[i].getEntitiesByType(type);

                        union(entities, selection);
                        arrayCache.recycle(selection);
                    }
                }
                return entities;
            },

            /**
             * This method adds an entity to the owner's group. If an entity definition or a reference to an entity definition is provided, the entity is created and then added to the owner's group.
             *
             * @method platypus.components.EntityContainer#addEntity
             * @param newEntity {platypus.Entity|Object|String} Specifies the entity to add. If an object with a "type" property is provided or a String is provided, this component looks up the entity definition to create the entity.
             * @param [newEntity.type] {String} If an object with a "type" property is provided, this component looks up the entity definition to create the entity.
             * @param [newEntity.properties] {Object} A list of key/value pairs that sets the initial properties on the new entity.
             * @param [callback] {Function} A function to run once all of the components on the Entity have been loaded.
             * @return {platypus.Entity} The entity that was just added.
             * @fires platypus.Entity#child-entity-added
             * @fires platypus.Entity#entity-created
             * @fires platypus.Entity#peer-entity-added
             */
            addEntity (newEntity, callback) {
                const
                    {owner} = this,
                    whenReady = (entity) => {
                        const
                            {owner, entities} = this;
                        let i = entities.length;

                        entity.triggerEvent('adopted', entity);
                        
                        /**
                         * This message is triggered when a new entity has been added to the parent's list of children entities.
                         * 
                         * @event platypus.Entity#peer-entity-added
                         * @param {platypus.Entity} entity The entity that was just added.
                         */
                        while (i--) {
                            if (!entity.triggerEvent('peer-entity-added', entities[i])) {
                                break;
                            }
                        }
                        this.triggerEventOnChildren('peer-entity-added', entity);

                        this.addChildEventListeners(entity);
                        entities.push(entity);

                        /**
                         * This message is triggered when a new entity has been added to the list of children entities.
                         * 
                         * @event platypus.Entity#child-entity-added
                         * @param {platypus.Entity} entity The entity that was just added.
                         */
                        owner.triggerEvent('child-entity-added', entity);

                        if (callback) {
                            callback(entity);
                        }
                    };
                let entity = null;
                
                if (newEntity instanceof Entity) {
                    entity = newEntity;
                    entity.parent = owner;
                    whenReady(entity);
                } else {
                    if (typeof newEntity === 'string') {
                        entity = new Entity(platypus.game.settings.entities[newEntity], null, whenReady, owner);
                    } else if (newEntity.id) {
                        entity = new Entity(newEntity, null, whenReady, owner);
                    } else {
                        entity = new Entity(platypus.game.settings.entities[newEntity.type], newEntity, whenReady, owner);
                    }

                    /**
                     * Called when this entity spawns a new entity, this event links the newly created entity to this entity.
                     *
                     * @event platypus.Entity#entity-created
                     * @param entity {platypus.Entity} The entity to link.
                     */
                    this.owner.triggerEvent('entity-created', entity);
                }

                this.newAdds.push(entity);

                return entity;
            },
            
            /**
             * Removes the provided entity from the layer and destroys it. Returns `false` if the entity is not found in the layer.
             *
             * @method platypus.components.EntityContainer#removeEntity
             * @param {Entity} entity
             * @return {Entity}
             * @fires platypus.Entity#child-entity-removed
             * @fires platypus.Entity#peer-entity-removed
             */
            removeEntity: function (entity) {
                const
                    i = this.entities.indexOf(entity);

                if (i >= 0) {
                    this.removeChildEventListeners(entity);
                    greenSplice(this.entities, i);

                    /**
                     * This message is triggered when an entity has been removed from the parent's list of children entities.
                     * 
                     * @event platypus.Entity#peer-entity-removed
                     * @param {platypus.Entity} entity The entity that was just removed.
                     */
                    this.triggerEventOnChildren('peer-entity-removed', entity);
                    
                    /**
                     * This message is triggered when an entity has been removed from the list of children entities.
                     * 
                     * @event platypus.Entity#child-entity-removed
                     * @param {platypus.Entity} entity The entity that was just added.
                     */
                    this.owner.triggerEvent('child-entity-removed', entity);
                    entity.destroy();
                    entity.parent = null;
                    return entity;
                }
                return false;
            },
            
            /**
             * Triggers a single event on the child entities in the layer.
             *
             * @method platypus.components.EntityContainer#triggerEventOnChildren
             * @param {*} event
             * @param {*} message
             * @param {*} debug
             */
            triggerEventOnChildren: function (event, message, debug) {
                if (this.destroyed) {
                    return 0;
                }
                
                if (!this._listeners[event]) {
                    this.addNewPrivateEvent(event);
                }
                return this.triggerEvent(event, message, debug);
            },

            /**
             * Triggers one or more events on the child entities in the layer. This is unique from `triggerEventOnChildren` in that it also accepts an `Array` to send multiple events.
             *
             * @method platypus.components.EntityContainer#triggerOnChildren
             * @param {*} event
             * @param {*} message
             * @param {*} debug
             */
            triggerOnChildren: function (event) {
                if (this.destroyed) {
                    return 0;
                }
                
                if (!this._listeners[event]) {
                    this.addNewPrivateEvent(event);
                }
                return this.trigger.apply(this, arguments);
            }
        },
        
        getAssetList: function (def, props, defaultProps, data) {
            const
                assets = arrayCache.setUp(),
                entities = arrayCache.setUp();
            
            if (def.entities) {
                union(entities, def.entities);
            }
            
            if (props && props.entities) {
                union(entities, props.entities);
            } else if (defaultProps && defaultProps.entities) {
                union(entities, defaultProps.entities);
            }

            for (let i = 0; i < entities.length; i++) {
                const
                    arr = Entity.getAssetList(entities[i], null, data);

                union(assets, arr);
                arrayCache.recycle(arr);
            }
            
            arrayCache.recycle(entities);
            
            return assets;
        }
    });

Messenger.mixin(EntityContainer);

export default EntityContainer;
