/**
 * Maps pointer presses on this entity to game-wide controller events consumed by {@link platypus.components.HandlerController}.
 * Add {@link platypus.components.Interactive} (or another source of pointer events) on the same entity so presses hit the control.
 *
 * @memberof platypus.components
 * @class ControllerInput
 * @uses platypus.Component
 */
/* global platypus */
import createComponentClass from '../factory.js';

export default createComponentClass(/** @lends platypus.components.ControllerInput.prototype */{
    id: 'ControllerInput',

    properties: {
        /**
         * Control code passed to `HandlerController` (for example `jump` or `menu-select`).
         * Defaults to the entity's `type` when unset.
         *
         * @property code
         * @type String
         * @default null
         */
        code: null,

        /**
         * Input device style. Only `button` is supported: `pointerdown` / `pointerup` (and cancel/outside) map to controller down/up.
         *
         * @property controllerType
         * @type String
         * @default button
         */
        controllerType: 'button'
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
                const
                    down = this.addEventListener('pointerdown', onDown),
                    up = this.addEventListener('pointerup', onUp),
                    upOutside = this.addEventListener('pointerupoutside', onUp),
                    cancel = this.addEventListener('pointercancel', onUp);

                this.unattachControls = () => {
                    this.removeEventListener('pointerdown', down);
                    this.removeEventListener('pointerup', up);
                    this.removeEventListener('pointerupoutside', upOutside);
                    this.removeEventListener('pointercancel', cancel);
                };
            }
        }
    }
});
