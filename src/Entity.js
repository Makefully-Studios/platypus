/* global platypus */
import {arrayCache, greenSplice, union} from './utils/array.js';
import Messenger from './Messenger.js';
import StateMap from './StateMap.js';
import createComponentClass from './factory.js';

const
    entityIds = {},
    getComponentClass = function (componentDefinition) {
        const
            {type} = componentDefinition;

        if (type) {
            if (typeof type === 'function') {
                return type;
            } else if (platypus.components[type]) {
                return platypus.components[type];
            }
        } else if (componentDefinition.id) { // "type" not specified, so we create the component directly.
            return createComponentClass(componentDefinition);
        } else if (typeof componentDefinition === 'function') {
            return componentDefinition;
        } else {
            return null;
        }
    };

    /**
     * The Entity object acts as a container for components, facilitates communication between components and other game objects, and includes properties set by components to maintain a current state. The entity object serves as the foundation for most of the game objects in the platypus engine.
     *
     * ## JSON Definition Example
         {
             "id": "entity-id",
            // "entity-id" becomes `entity.type` once the entity is created.
        
            "components": [
            // This array lists one or more component definition objects
        
                {"type": "example-component"}
                // The component objects must include a "type" property corresponding to a component to load, but may also include additional properties to customize the component in a particular way for this entity.
            ],
        
            "properties": {
            // This object lists properties that will be attached directly to this entity.
        
                "x": 240
                // For example, `x` becomes `entity.x` on the new entity.
            },

            "preload": ['image.png', 'sound.mp3']
            // assets that need to be loaded before this entity loads
        }
     *
     * @memberof platypus
     * @extends platypus.Messenger
    **/
export default class Entity extends Messenger {
    /**
     * @param {Object} [definition] Base definition for the entity.
     * @param {Object} [definition.components] This lists the components that should be attached to this entity.
     * @param {Object} [definition.id] This declares the type of entity and will be stored on the Entity as `entity.type` after instantiation.
     * @param {Object} [definition.properties] [definition.properties] This is a list of key/value pairs that are added directly to the Entity as `entity.key = value`.
     * @param {Object} [instanceDefinition] Specific instance definition including properties that override the base definition properties.
     * @param {Object} [instanceDefinition.properties] This is a list of key/value pairs that are added directly to the Entity as `entity.key = value`.
     * @param {Function} [callback] A function to run once all of the components on the Entity have been loaded. The first parameter is the entity itself.
     * @param {Entity} [parent] Presets the parent of the entity so that the parent entity is available during component instantiation. Overrides `parent` in properties definitions.
     * @return {Entity} Returns the new entity made up of the provided components.
     * @fires platypus.Entity#load
     */
    constructor ({
        components: componentDefinitions,
        properties: defaultProperties = {},
        id: type
    }, {
        id,
        properties: instanceProperties = {}
    }, callback, parent) {
        // Set properties of messenger on this entity.
        super();

        const
            componentInit = (Component, componentDefinition) => new Promise((resolve) => this.addComponent(new Component(this, componentDefinition, resolve))),
            componentInits = arrayCache.setUp(),
            savedEvents = arrayCache.setUp(),
            trigger = this.trigger; // trigger reference for saved events
    
        this.components  = arrayCache.setUp();
        this.type = type || 'none';

        this.id = id ?? instanceProperties.id;
        if (this.id) { // check to make sure auto-ids don't overlap.
            if (this.id.search(this.type + '-') === 0) {
                const
                    i = parseInt(this.id.substring(this.id.search('-') + 1), 10);

                if (!isNaN(i) && (!entityIds[this.type] || (entityIds[this.type] <= i))) {
                    entityIds[this.type] = i + 1;
                }
            }
        } else {
            if (!entityIds[this.type]) {
                entityIds[this.type] = 0;
            }
            this.id = this.type + '-' + entityIds[this.type];
            entityIds[this.type] += 1;
        }

        this.setProperty(defaultProperties); // This takes the list of properties in the JSON definition and appends them directly to the object.
        this.setProperty(instanceProperties); // This takes the list of options for this particular instance and appends them directly to the object.
        this.on('set-property', (keyValuePairs) => {
            this.setProperty(keyValuePairs);
        });

        this.state = StateMap.setUp(this.state); //starts with no state information. This expands with boolean value properties entered by various logic components.
        this.lastState = StateMap.setUp(); //This is used to determine if the state of the entity has changed.
        
        if (parent) {
            this.parent = parent;
        }

        this.trigger = this.triggerEvent = (...args) => {
            savedEvents.push(trigger.bind(this, ...args));

            return -1; // Message has not been delivered yet.
        };
        
        if (componentDefinitions) {
            for (let i = 0; i < componentDefinitions.length; i++) {
                const
                    componentDefinition = componentDefinitions[i];

                if (componentDefinition) {
                    if (componentDefinition.type) {
                        const
                            componentClass = getComponentClass(componentDefinition);

                        if (componentClass) {
                            componentInits.push(componentInit(componentClass, componentDefinition));
                        } else {
                            platypus.debug.warn('Entity "' + this.type + '": Component "' + componentDefinition.type + '" is not defined.', componentDefinition);
                        }
                    } else if (componentDefinition.id) { // "type" not specified, so we create the component directly.
                        componentInits.push(componentInit(createComponentClass(componentDefinition)));
                    } else if (typeof componentDefinition === 'function') {
                        componentInits.push(componentInit(componentDefinition));
                    } else {
                        platypus.debug.warn('Entity "' + this.type + '": Component must have an `id` or `type` value.', componentDefinition);
                    }
                }
            }
        }
        this.loadingComponents = Promise.all(componentInits).then(() => {
            this.loadingComponents = null;

            // Trigger saved events that were being fired during component addition.
            delete this.trigger;
            delete this.triggerEvent;
            for (let i = 0; i < savedEvents.length; i++) {
                savedEvents[i]();
            }
            arrayCache.recycle(savedEvents);

            /**
             * The entity triggers `load` on itself once all the properties and components have been attached, notifying the components that all their peer components are ready for messages.
             *
             * @event platypus.Entity#load
             */
            this.triggerEvent('load');

            if (callback) {
                callback(this);
            }
        });
        
        arrayCache.recycle(componentInits);
    }

    /**
    * Returns a string describing the entity.
    *
    * @return {String} Returns the entity type as a string of the form "[Entity entity-type]".
    **/
    toString () {
        return "[Entity " + this.type + "]";
    }
    
    /**
    * Returns a JSON object describing the entity.
    *
    * @param includeComponents {Boolean} Whether the returned JSON should list components. Defaults to `false` to condense output since components are generally defined in `platypus.game.settings.entities`, but may be needed for custom-constructed entities not so defined.
    * @return {Object} Returns a JSON definition that can be used to recreate the entity.
    **/
    toJSON (includeComponents) {
        const
            {components, type} = this,
            properties = {
                id: this.id,
                state: this.state.toJSON()
            },
            definition = {
                properties
            };
        
        if (includeComponents) {
            definition.id = type;
            definition.components = [];
        } else {
            definition.type = type;
        }

        for (let i = 0; i < components.length; i++) {
            const
                json = components[i].toJSON(properties);

            if (includeComponents && json) {
                definition.components.push(json);
            }
        }

        return definition;
    }
    
    /**
     * Attaches the provided component to the entity.
     *
     * @param {platypus.Component} component Must be an object that functions as a Component.
     * @return {platypus.Component} Returns the same object that was submitted.
     * @fires platypus.Entity#component-added
    **/
    addComponent (component) {
        this.components.push(component);

        /**
         * The entity triggers `component-added` on itself once a component has been attached, notifying other components of their peer component.
         *
         * @event platypus.Entity#component-added
         * @param {platypus.Component} component The added component.
         * @param {String} component.type The type of component.
         **/
        this.triggerEvent('component-added', component);
        return component;
    }
    
    /**
     * Removes the mentioned component from the entity.
     *
     * @param {Component} component Must be a [[Component]] attached to the entity.
     * @return {Component} Returns the same object that was submitted if removal was successful; otherwise returns false (the component was not found attached to the entity).
     * @fires platypus.Entity#component-removed
    **/
    removeComponent (component) {
        /**
         * The entity triggers `component-removed` on itself once a component has been removed, notifying other components of their peer component's removal.
         *
         * @event platypus.Entity#component-removed
         * @param {Component} component The removed component.
         * @param {String} component.type The type of component.
         **/
        if (typeof component === 'string') {
            for (let i = 0; i < this.components.length; i++) {
                if (this.components[i].type === component) {
                    component = this.components[i];
                    greenSplice(this.components, i);
                    this.triggerEvent('component-removed', component);
                    component.destroy();
                    return component;
                }
            }
        } else {
            for (let i = 0; i < this.components.length; i++) {
                if (this.components[i] === component) {
                    greenSplice(this.components, i);
                    this.triggerEvent('component-removed', component);
                    component.destroy();
                    return component;
                }
            }
        }
        
        return false;
    }
    
    /**
    * This method sets one or more properties on the entity.
    *
    * @param {Object} properties A list of key/value pairs to set as properties on the entity.
    **/
    setProperty (properties) {
        const
            keys = Object.keys(properties);
        
        // This takes a list of properties and appends them directly to the object.
        for (let i = 0; i < keys.length; i++) {
            const
                key = keys[i];

            this[key] = properties[key];
        }
    }
    
    /**
    * This method removes all components from the entity.
    *
    **/
    destroy () {
        const
            components = this.components;
        
        if (!this._destroyed) {
            while (components.length) {
                components[0].destroy();
                components.shift();
            }
            arrayCache.recycle(components);
            this.components = null;
            
            this.state.recycle();
            this.state = null;
            
            this.lastState.recycle();
            this.lastState = null;
            
            super.destroy();
        }
    }
    
    /**
     * Returns all of the assets required for this Entity. This method calls the corresponding method on all components to determine the list of assets.
     *
     * @param definition {Object} The definition for the Entity.
     * @param properties {Object} Properties for this instance of the Entity.
     * @param data {Object} Layer data that affects asset list.
     * @return {Array} A list of the necessary assets to load.
     */
    static getAssetList (def, props, data) {
        const
            {components, preload, properties, type} = def ?? {};

        if (type) {
            const
                definition = platypus.game.settings.entities[type];

            if (!definition) {
                platypus.debug.warn(`Entity "${type}": This entity is not defined.`, def);
                return arrayCache.setUp();
            }
            return Entity.getAssetList(definition, properties, data);
        } else {
            const
                assets = union(arrayCache.setUp(), preload),
                {length} = components;

            for (let i = 0; i < length; i++) {
                const
                    component = getComponentClass(components[i]);

                if (component) {
                    const
                        arr = component.getAssetList(components[i], properties, props, data);

                    union(assets, arr);
                    arrayCache.recycle(arr);
                }
            }
            
            return assets;
        }
    }
}
