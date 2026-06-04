/**
 * This component manages collectibles.
 *
 * @class CollectiblesManager
 * @uses platypus.Component
 */
/* global platypus */
import createComponentClass from '../factory.js';

export default createComponentClass({
    id: 'ControllerInput',
    
    properties: {
        /**
         * Sets the controller code to use for EntityController.
         */
        code: null,

        /**
         * Currently "button" is the only controller type.
         */
        controllerType: 'button'
    },
    
    publicProperties: {
    },
    
    initialize () {
        const
            {code, controllerType, owner: entity} = this,
            onUp = () => platypus.game.triggerOnChildren('controller-input-up', {
                code: code ?? entity.type,
                entity
            }),
            onDown = () => platypus.game.triggerOnChildren('controller-input-down', {
                code: code ?? entity.type,
                entity
            });

        switch (controllerType) {
            default: {
                this.addEventListener('pointerdown', onDown);
                this.addEventListener('pointerup', onUp);
                this.addEventListener('pointerupoutside', onUp);
                this.addEventListener('pointercancel', onUp);
                this.unattachControls = () => {
                    this.removeEventListener('pointerdown', onDown);
                    this.removeEventListener('pointerup', onUp);
                    this.removeEventListener('pointerupoutside', onUp);
                    this.removeEventListener('pointercancel', onUp);
                };
            }
        }
    },

    events: {
    },
    
    methods: {
    },
    
    publicMethods: {}
});
