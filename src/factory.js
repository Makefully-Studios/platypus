/**
 * The component factory takes in component definitions and creates component classes that can be used to create components by entities.  It adds properties and methods that are common to all components so that component definitions can focus on unique properties and methods.
 *
 * To create an extended component class, use the following syntax:
 *
 *      platypus.createComponentClass(componentDefinition);
 *
 *  * `componentDefinition` is list of key/value pairs that describe the component's behavior.
 *
 * See ComponentExample.js for an example componentDefinition that can be sent into this component class factory.
 *
 */
/* global platypus */
import {arrayCache, greenSlice} from './utils/array.js';
import Component from './Component.js';

var priority = 0;
    
export default function (componentDefinition = {}) {
    const
        {events, getAssetList, id, initialize, methods, properties, publicMethods, publicProperties} = componentDefinition,

        // Not sure if this is future-proof, but putting in object to create dynamic name.
        NewComponent = ({[id]: class extends Component {
            constructor (owner, definition = {}, callback) {
                const
                    {aliases} = definition;

                super(id, owner);
    
                // Set up properties, prioritizing component settings, entity settings, and finally defaults.
                if (properties) {
                    const
                        keys = Object.keys(properties),
                        {length} = keys;

                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];

                        this[key] = definition[key] ?? owner[key] ?? properties[key];
                    }
                }
    
                // These component properties are equivalent with `entity.property`
                if (publicProperties) {
                    const
                        keys = Object.keys(publicProperties),
                        {length} = keys;

                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];

                        Object.defineProperty(this, key, {
                            get: function () {
                                return owner[key];
                            },
                            set: function (value) {
                                owner[key] = value;
                            },
                            enumerable: true
                        });
                        this[key] = definition[key] ?? owner[key] ?? publicProperties[key];
                    }
                }
    
                if (events) {
                    const
                        keys = Object.keys(events),
                        {length} = keys;

                    priority -= 1; // So event priority remains in order of component addition.

                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];

                        this.addEventListener(key, events[key], priority);
                        if (aliases) {
                            const
                                aliasKeys = Object.keys(aliases),
                                {length} = keys;
        
                            for (let j = 0; j < length; j++) {
                                const
                                    alias = aliasKeys[j];
        
                                if (aliases[alias] === key) {
                                    this.addEventListener(alias, events[key], priority);
                                }
                            }
                        }
                    }
                }
    
                if (publicMethods) {
                    const
                        keys = Object.keys(publicMethods),
                        {length} = keys;

                    for (let i = 0; i < length; i++) {
                        const
                            key = keys[i];
                        let name = key;

                        if (aliases) {
                            const
                                aliasKeys = Object.keys(aliases),
                                {length} = keys;
        
                            for (let j = 0; j < length; j++) {
                                const
                                    alias = aliasKeys[j];
        
                                if (aliases[alias] === key) {
                                    name = alias;
                                }
                            }
                        }
                        this.addMethod(name, publicMethods[key]);
                    }
                }
    
                if (!this.initialize(definition, callback) && callback) { // whether the callback will be used; if not, we run immediately.
                    callback();
                }
            }
        }})[id],
        proto = NewComponent.prototype;

    if (initialize) {
        proto.initialize = initialize;
    }
    
    /**
     * Returns a JSON structure describing this componet. This can be overridden by a "toJSON" method in the component definition. This is by design.
     * 
     * @method toJSON
     * @return {Object}
     */
    proto.toJSON = (function () {
        const
            valid = function (value, depthArray) {
                const
                    type = typeof value;
                let depth = null,
                    root = false,
                    invalid = false;
                
                if (!validating) { // prevents endless validation during recursion.
                    validating = true;
                    root = true;
                }

                if (type === 'function') {
                    invalid = true;
                } else if ((type === 'object') && (value !== null)) {
                    if (value.toJSON) { // We know it's valid but we run this for the depth check to make sure that there is no recursion.
                        depth = depthArray ? greenSlice(depthArray) : arrayCache.setUp();
                        depth.push(value);
                        if (!valid(value.toJSON(), depth)) {
                            invalid = true;
                        }
                    } else if (Array.isArray(value)) {
                        let i = value.length;

                        while (i--) {
                            const
                                propValue = value[i];

                            if (depthArray && depthArray.indexOf(propValue) >= 0) {
                                invalid = true;
                                break;
                            }
                            depth = depthArray ? greenSlice(depthArray) : arrayCache.setUp();
                            depth.push(propValue);
                            if (!valid(propValue, depth)) {
                                invalid = true;
                                break;
                            }
                        }
                    } else {
                        const
                            keys = Object.keys(value),
                            {length} = keys;

                        for (let i = 0; i < length; i++) {
                            const
                                propValue = value[keys[i]];

                            if (depthArray && depthArray.indexOf(propValue) >= 0) {
                                invalid = true;
                                break;
                            }
                            depth = depthArray ? greenSlice(depthArray) : arrayCache.setUp();
                            depth.push(propValue);
                            if (!valid(propValue, depth)) {
                                invalid = true;
                                break;
                            }
                        }
                    }
                }

                if (depthArray) {
                    arrayCache.recycle(depthArray);
                }

                if (root) {
                    validating = false;
                }

                return !invalid;
            };
        let validating = false;

        return function (propertiesDefinition, debug) {
            const
                component = {
                    type: this.type
                };
            
            if (properties) {
                const
                    keys = Object.keys(properties),
                    {length} = keys;

                for (let i = 0; i < length; i++) {
                    const
                        key = keys[i];

                    if (properties[key] !== this[key]) {
                        if (debug && !validating && !valid(this[key])) {
                            platypus.debug.warn('Component "' + this.type + '" includes a non-JSON property value for "' + key + '" (type "' + (typeof this[key]) + '"). You may want to create a custom `toJSON` method for this component.', this[key]);
                        }
                        component[key] = this[key];
                    }
                }
            }

            if (publicProperties) {
                const
                    keys = Object.keys(publicProperties),
                    {length} = keys;

                for (let i = 0; i < length; i++) {
                    const
                        key = keys[i];

                    if ((publicProperties[key] !== this.owner[key]) && (typeof propertiesDefinition[key] === 'undefined')) {
                        if (debug && !validating && !valid(this.owner[key])) {
                            platypus.debug.warn('Component "' + this.type + '" includes a non-JSON public property value for "' + key + '" (type "' + (typeof this.owner[key]) + '"). You may want to create a custom `toJSON` method for this component.', this.owner[key]);
                        }
                        propertiesDefinition[key] = this.owner[key];
                    }
                }
            }

            return component;
        };
    }());

    if (methods) {
        const
            keys = Object.keys(methods),
            {length} = keys;

        for (let i = 0; i < length; i++) {
            const
                key = keys[i];

            if (key === 'destroy') {
                proto._destroy = methods[key];
            } else {
                proto[key] = methods[key];
            }
        }
    }
    if (publicMethods) {
        const
            keys = Object.keys(publicMethods),
            {length} = keys;

        for (let i = 0; i < length; i++) {
            const
                key = keys[i];

            proto[key] = publicMethods[key];
        }
    }

    if (getAssetList) {
        NewComponent.getAssetList = getAssetList;
    }

    return NewComponent;
};
