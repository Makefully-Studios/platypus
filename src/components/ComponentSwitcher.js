/* global platypus */
import {arrayCache, union} from '../utils/array.js';
import createComponentClass from '../factory.js';

export default createComponentClass(/** @lends platypus.components.ComponentSwitcher.prototype */{
    id: 'ComponentSwitcher',
    
    properties: {
        /**
         * This is the list of messages to listen for (as the keys) with the settings as two arrays of components to add and components to remove.
         *
            {
                "found-pogostick":{
                    "add":[
                    // This is a list of components to add when "found-pogostick" is triggered on the entity. If it's adding a single component, "add" can be a reference to the component definition itself rather than an array of one object.
                    {"type": "Mover"},
                    {"type": "HeadGear"}
                    ]
                    
                    "remove": ["CarSeat"]
                    // This is a string list of component ids to remove when "found-pogostick" is triggered on the entity. It will ignore listed components that are not connected to the entity.
                },
                
                // Multiple events can cause unique components to be added or removed
                "walking-indoors":{
                    "remove": ["HeadGear"]
                },
                
                "contemplate":{
                    "add": {"type": "AIPacer"}
                }
                }
            }
            *
            * @property componentMap
            * @type Object
            * @default null
            */
        componentMap: null
    },
    
    /**
     * This component listens for messages and, according to its preset settings, will remove and add components to the entity. This is useful if certain events should modify the behavior of the entity in some way: for example, acquiring a pogo-stick might add a jumping component so the hero can jump.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#prepare-logic
     * @fires platypus.Entity#child-entity-updated
     * @fires platypus.Entity#add-remove-component-complete
     */
    initialize: function () {
        const
            {componentMap} = this,
            switches = this.switches = arrayCache.setUp(); // The list of switches to make.
        
        if (componentMap) {
            const
                keys = Object.keys(componentMap),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    key = keys[i];

                // Message(s) listed by `componentMap` will add or remove components.
                this.addEventListener(key, (event) => {
                    switches.push(event);
                });
            }
        }
    },
    
    events: {
        "prepare-logic": function () {
            if (this.switches.length) {
                for (let i = 0; i < this.switches.length; i++) {
                    this.switchComponents(this.componentMap[this.switches[i]]);
                }
                this.switches.length = 0;
            }
        }
    },
    
    methods: {
        switchComponents: function (definition) {
            const
                owner = this.owner,
                components = owner.components,
                remove = definition.remove,
                add = definition.add;
                
            if (remove) {
                if (!Array.isArray(remove)) {
                    for (let i = components.length - 1; i > -1; i--) {
                        if (components[i].type === remove) {
                            owner.removeComponent(components[i]);
                        }
                    }
                } else {
                    for (let i = 0; i < remove.length; i++) {
                        for (let j = components.length - 1; j > -1; j--) {
                            if (components[j].type === remove[i]) {
                                owner.removeComponent(components[j]);
                            }
                        }
                    }
                }
            }

            if (add) {
                if (!Array.isArray(add)) {
                    owner.addComponent(new platypus.components[add.type](owner, add));
                } else {
                    for (let i = 0; i < add.length; i++) {
                        owner.addComponent(new platypus.components[add[i].type](owner, add[i]));
                    }
                }
            }
            
            /**
            * This message is triggered on the parent when the entity's components change.
            *
            * @event platypus.Entity#child-entity-updated
            * @param entity {platypus.Entity} This is the entity itself.
            */
            owner.parent.triggerEvent('child-entity-updated', owner);

            /**
            * This message is triggered on the entity itself when its components change.
            *
            * @event platypus.Entity#add-remove-component-complete
            */
            owner.triggerEvent('add-remove-component-complete');
        },
        
        destroy: function () {
            arrayCache.recycle(this.switches);
        }
    },
    
    getAssetList: function (def, props, defaultProps) {
        const
            componentMap = def?.componentMap ?? props?.componentMap ?? defaultProps?.componentMap,
            assets = arrayCache.setUp();
        
        if (componentMap) {
            const
                keys = Object.keys(componentMap),
                {length} = keys;

            for (let i = 0; i < length; i++) {
                const
                    adds = map[keys[i]].add;

                for (let j = 0; j < adds.length; j++) {
                    const
                        component = platypus.components[adds[j].type];

                    if (component) {
                        const
                            arr = component.getAssetList(adds[j], props, defaultProps);
                            
                        union(assets, arr);
                        arrayCache.recycle(arr);
                    }
                }
            }
        }
        
        return assets;
    }
});
