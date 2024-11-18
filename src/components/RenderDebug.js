import {Container, Graphics} from 'pixi.js';
import {arrayCache} from '../utils/array.js';
import createComponentClass from '../factory.js';

const
    collisionColors = {},
    createCollisionColor = function (collisionType) {
        let
            r = collisionType.charCodeAt(0) || 0,
            g = collisionType.charCodeAt(1) || 0,
            b = collisionType.charCodeAt(2) || 0,
            min = 0,
            max = 0;
        
        min = Math.min(r, g, b);

        r -= min;
        g -= min;
        b -= min;

        max = Math.max(r, g, b, 1);
            
        r = (0xCC * r / max) >> 0;
        g = (0xCC * g / max) >> 0;
        b = (0xCC * b / max) >> 0;

        return (r << 8) + (g << 4) + b;
    };

export default (function () {
    var createShape = function ({radius, color, left, top, width, height, z, outline, points}) {
            var newShape = new Graphics();

            if (radius) {
                newShape.circle(left + radius, top + radius, radius);
            } else if (points) {
                newShape.poly(points);
            } else if (width && height) {
                newShape.rect(left, top, width, height);
            }
            newShape.z = z;
            newShape.fill(color, 0.1);
            if (outline) {
                newShape.stroke({
                    width: outline,
                    color
                });
            }

            return newShape;
        },
        standardizeColor = function (color) {
            if (typeof color === 'string') {
                return parseInt(color.replace('#', ''), 16);
            } else {
                return color;
            }
        };
    
    return createComponentClass(/** @lends platypus.components.RenderDebug.prototype */{
        
        id: 'RenderDebug',

        properties: {
            /**
             * The color to use to highlight an entity's AABB. For example, use `"#ffffff"` or `0xffffff` to set as white.
             *
             * @property aabbColor
             * @type Number|String
             * @default 0xff88ff
             */
            aabbColor: 0xff88ff,

            /**
             * The color to use to highlight an entity's collision shape. For example, use `"#ffffff"` or `0xffffff` to set as white. Will generate a color based on the collision type if not specified.
             *
             * @property collisionColor
             * @type Number|String
             * @default 0
             */
            collisionColor: 0,

            /**
             * The color to use to highlight the AABB for a group of entities attached to this entity. For example, use `"#ffffff"` or `0xffffff` to set as white.
             *
             * @property groupColor
             * @type Number|String
             * @default 0x00ff00
             */
            groupColor: 0x00ff00,

            /**
             * The color to use to highlight an entity. This property is only used if there is no `CollisionBasic` component attached to the entity: this component uses the entity's `width` and `height` properties if defined. For example, use `"#ffffff"` or `0xffffff` to set as white.
             *
             * @property renderColor
             * @type Number|String
             * @default 0x0000ff
             */
            renderColor: 0x0000ff,

            /**
             * The height of the entity.
             *
             * @property height
             * @type Number
             * @default 100
             */
            width: 100,

            /**
             * The width of the entity.
             *
             * @property width
             * @type Number
             * @default 100
             */
            height: 100,

            /**
             * The local offset in z-index for the rendered debug area.
             *
             * @property offsetZ
             * @type Number
             * @default 10000
             */
            offsetZ: 10000
        },
        
        /**
         * This component is attached to entities that will appear in the game world. It serves two purposes. First, it displays a rectangle that indicates the location of the entity. By default it uses the specified position and dimensions of the object (in grey). If the object has a collision component it will display the AABB of the collision shape (in pink). If the entity has a LogicCarrier component and is/was carrying an object, a green rectangle will be drawn showing the collision group. The RenderDebug component also allows the developer to right-click on an entity and it will print the object in the debug console.
         *
         * @memberof platypus.components
         * @uses platypus.Component
         * @constructs
         * @listens platypus.Entity#camera-update
         * @listens platypus.Entity#collide-off
         * @listens platypus.Entity#collide-on
         * @listens platypus.Entity#handle-render
         * @listens platypus.Entity#load
         * @listens platypus.Entity#orientation-updated
         */
        initialize: function () {
            this.container = new Container();
            this.container.cullable = true;

            this.parentContainer = this.owner.parent.worldContainer;
            this.parentContainer.addChild(this.container);

            this.shapes = arrayCache.setUp();
            this.isOutdated = true;

            this.aabbColor = standardizeColor(this.aabbColor);
            this.collisionColor = this.collisionColor ? standardizeColor(this.collisionColor) : 0;
            this.groupColor = standardizeColor(this.groupColor);
            this.renderColor = standardizeColor(this.renderColor);
        },
        
        events: {
            "load": function () {
                if (!platypus.game.settings.debug) {
                    this.owner.removeComponent(this);
                    return;
                }
            },

            "handle-render": function () {
                var aabb = null,
                    offset = -0.5;

                if (this.isOutdated) {
                    this.updateSprites();
                    this.isOutdated = false;
                }
                
                if (this.owner.getCollisionGroupAABB) {
                    aabb = this.owner.getCollisionGroupAABB();
                    if (!this.groupShape) {
                        this.groupShape = createShape({
                            color: this.groupColor,
                            left: offset,
                            top: offset,
                            width: 1,
                            height: 1,
                            z: this.offsetZ
                        });
                        this.container.addChild(this.groupShape);
                    }
                    this.groupShape.scaleX = aabb.width;
                    this.groupShape.scaleY = aabb.height;
                    this.groupShape.x      = aabb.x - this.owner.x;
                    this.groupShape.y      = aabb.y - this.owner.y;
                }

                this.update();
            },
            
            "orientation-updated": function () {
                this.isOutdated = true;
            },
            
            "collide-on": function () {
                this.isOutdated = true;
            },
            
            "collide-off": function () {
                this.isOutdated = true;
            }
        },
        
        methods: {
            addShape (properties) {
                const
                    shape = createShape({
                        z: this.offsetZ,
                        ...properties
                    });

                this.shapes.push(shape);
                this.container.addChild(shape);
                this.offsetZ -= 0.0001;
            },

            update () {
                const
                    {container, owner} = this;

                if (container.zIndex !== owner.z + 0.000001) {
                    container.zIndex = owner.z + 0.000001;
                }

                container.updateTransform({
                    x: owner.x,
                    y: owner.y
                });
            },

            updateSprites: function () {
                const
                    {owner} = this;

                for (let i = 0; i < this.shapes.length; i++) {
                    this.container.removeChild(this.shapes[i]);
                }
                this.shapes.length = 0;
                
                if (owner.getAABB) {
                    for (let j = 0; j < owner.collisionTypes.length; j++) {
                        const
                            collisionType = owner.collisionTypes[j],
                            aabb = owner.getAABB(collisionType),
                            lineWidth = 2,
                            shapes = owner.getShapes(collisionType),
                            width = this.initialWidth = aabb.width,
                            height = this.initialHeight = aabb.height;

                        let collisionColor = this.collisionColor || collisionColors[collisionType];

                        if (!collisionColor) {
                            collisionColor = collisionColors[collisionType] = createCollisionColor(collisionType);
                        }
                        
                        this.addShape({
                            color: this.aabbColor,
                            left: aabb.left - owner.x,
                            top: aabb.top - owner.y,
                            width,
                            height
                        });
                        
                        for (let i = 0; i < shapes.length; i++) {
                            const
                                w = shapes[i].width - lineWidth,
                                h = shapes[i].height - lineWidth;

                            this.addShape({
                                color: collisionColor,
                                left: shapes[i].offsetX - w / 2,
                                top: shapes[i].offsetY - h / 2,
                                radius: shapes[i].radius ? shapes[i].radius - lineWidth : 0,
                                width,
                                height,
                                outline: lineWidth,
                                points: shapes[i].points
                            });
                        }
                    }
                } else {
                    this.addShape({
                        color: this.renderColor,
                        left: -this.width / 2,
                        top: -this.height / 2,
                        width,
                        height
                    });
                }
                this.addShape({
                    color: 0x000000,
                    left: -1,
                    outline: 1,
                    top: -1,
                    radius: 1
                });
            },
            
            destroy: function () {
                var i = 0;
                
                for (i = 0; i < this.shapes.length; i++) {
                    this.container.removeChild(this.shapes[i]);
                }
                arrayCache.recycle(this.shapes);

                this.parentContainer.removeChild(this.container);
                this.container = null;
            }
        }
    });
}());
