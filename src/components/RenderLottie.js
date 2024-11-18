//import RenderContainer from './RenderContainer.js';
//import createComponentClass from '../factory.js';
import {LottieSprite} from '@qva/pixi-lottie';
import {components, createComponentClass} from 'platypus';

const
    {RenderContainer} = components;

export default createComponentClass(/** @lends platypus.components.RenderSprite.prototype */{
    
    id: 'RenderLottie',
    
    properties: {
        /**
         * The offset of the x-axis position of the sprite from the entity's x-axis position.
         *
         * @property offsetX
         * @type Number
         * @default 0
         */
        offsetX: 0,

        /**
         * The offset of the y-axis position of the sprite from the entity's y-axis position.
         *
         * @property offsetY
         * @type Number
         * @default 0
         */
        offsetY: 0,

        /**
         * The z-index relative to other render components on the entity.
         *
         * @property offsetZ
         * @type Number
         * @default 0
         */
        offsetZ: 0,

        /**
            {
                asset: string | Uint8Array;
               
                autoplay?: boolean;
               
                loop?: boolean;
               
                width?: number;
               
                height?: number;
               
                speed?: number;
            }
         */
        options: null,

        /**
        * The rotation for this sprite relative to the container.
        *
        * @property localRotation
        * @type Number
        * @default 0
        */
        localRotation: 0,
        
        /**
        * The scaling factor for this sprite relative to the scale of the container.
        *
        * @property localScaleX
        * @type Number|Array|Object
        * @default 1
        */
        localScaleX: 1,

        /**
        * The scaling factor for this sprite relative to the scale of the container.
        *
        * @property localScaleY
        * @type Number|Array|Object
        * @default 1
        */
        localScaleY: 1
    },

    /**
     * This component is attached to entities that will appear in the game world. It renders a static or animated image. It listens for messages triggered on the entity or changes in the logical state of the entity to play a corresponding animation.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @listens platypus.Entity#handle-render
     * @listens platypus.Entity#play-animation
     * @listens platypus.Entity#stop-animation
     * @fires platypus.Entity#animation-ended
     * @fires platypus.Entity#update-animation
     */
    initialize () {
        const
            {localRotation, localScaleX, localScaleY, offsetX, offsetY, offsetZ, options, owner} = this,
            sprite = this.sprite = new LottieSprite(options ?? {});

        sprite.x = offsetX;
        sprite.y = offsetY;
        sprite.zIndex = offsetZ;
        sprite.rotation = (localRotation / 180) * Math.PI;
        sprite.scale.x = localScaleX;
        sprite.scale.y = localScaleY;

        if (!owner.container) {
            const
                {interactive, mask, mirror, flip, visible, cache, ignoreOpacity, scaleX, scaleY, skewX, skewY} = owner;
            
            owner.addComponent(new RenderContainer(this.owner, {interactive, mask, mirror, flip, visible, cache, ignoreOpacity, scaleX, scaleY, skewX, skewY}, () => this.addToContainer()));
        } else {
            this.addToContainer();
        }

        if (sprite.update) {
            this.addEventListener('handle-render', (renderData) => {
                if (sprite.update) {
                    sprite.update(renderData.delta);
                }
            });
        }

        sprite.play();
    },
    
    methods: {
        addToContainer: function () {
            const container = this.owner.container;

            container.addChild(this.sprite);
        },

        destroy: function () {
            this.owner.container.removeChild(this.sprite);
            this.sprite.destroy();
            this.sprite = null;
        }
    },
    
    getAssetList (/*a, b, c*/) {
        //const
        //    image = a?.image ?? b?.image ?? c?.image;
//
        //return (image ? [image] : a?.images ?? b?.images ?? c?.images ?? []).map((src) => ({
        //    alias: [src],
        //    src
        //}));
    }
});
