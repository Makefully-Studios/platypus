import {beforeEach, describe, expect, it, vi} from 'vitest';
import Messenger from '../../../src/Messenger.js';
import ControllerInput from '../../../src/components/ControllerInput.js';

const
    createOwner = (overrides = {}) => {
        const owner = new Messenger();

        owner.type = 'jump-button';
        Object.assign(owner, overrides);

        return owner;
    },
    createControllerInput = (owner, definition = {}) => new ControllerInput(owner, definition);

let triggerOnChildren;

beforeEach(() => {
    triggerOnChildren = vi.fn();
    globalThis.platypus = {
        debug: {
            warn: vi.fn(),
            log: vi.fn()
        },
        game: {
            triggerOnChildren
        }
    };
});

describe('ControllerInput', () => {
    it('fires controller-input-down on pointerdown with an explicit code', () => {
        const owner = createOwner();

        createControllerInput(owner, {code: 'jump'});
        owner.triggerEvent('pointerdown');

        expect(triggerOnChildren).toHaveBeenCalledTimes(1);
        expect(triggerOnChildren).toHaveBeenCalledWith('controller-input-down', {
            code: 'jump',
            entity: owner
        });
    });

    it('fires controller-input-up on pointerup with an explicit code', () => {
        const owner = createOwner();

        createControllerInput(owner, {code: 'menu'});
        owner.triggerEvent('pointerup');

        expect(triggerOnChildren).toHaveBeenCalledTimes(1);
        expect(triggerOnChildren).toHaveBeenCalledWith('controller-input-up', {
            code: 'menu',
            entity: owner
        });
    });

    it('defaults code to the owner type when code is unset', () => {
        const owner = createOwner({type: 'pause-btn'});

        createControllerInput(owner);
        owner.triggerEvent('pointerdown');
        owner.triggerEvent('pointerup');

        expect(triggerOnChildren).toHaveBeenNthCalledWith(1, 'controller-input-down', {
            code: 'pause-btn',
            entity: owner
        });
        expect(triggerOnChildren).toHaveBeenNthCalledWith(2, 'controller-input-up', {
            code: 'pause-btn',
            entity: owner
        });
    });

    it('treats pointerupoutside and pointercancel as controller up', () => {
        const owner = createOwner();

        createControllerInput(owner, {code: 'action'});
        owner.triggerEvent('pointerupoutside');
        owner.triggerEvent('pointercancel');

        expect(triggerOnChildren).toHaveBeenCalledTimes(2);
        expect(triggerOnChildren).toHaveBeenNthCalledWith(1, 'controller-input-up', {
            code: 'action',
            entity: owner
        });
        expect(triggerOnChildren).toHaveBeenNthCalledWith(2, 'controller-input-up', {
            code: 'action',
            entity: owner
        });
    });

    it('stops forwarding pointer events after unattachControls', () => {
        const owner = createOwner();
        const component = createControllerInput(owner, {code: 'detach-me'});

        owner.triggerEvent('pointerdown');
        expect(triggerOnChildren).toHaveBeenCalledTimes(1);

        component.unattachControls();
        triggerOnChildren.mockClear();

        owner.triggerEvent('pointerdown');
        owner.triggerEvent('pointerup');
        owner.triggerEvent('pointerupoutside');
        owner.triggerEvent('pointercancel');

        expect(triggerOnChildren).not.toHaveBeenCalled();
    });

    it('uses the button controller mapping for the default controllerType', () => {
        const owner = createOwner();

        createControllerInput(owner, {code: 'default-type', controllerType: 'button'});
        owner.triggerEvent('pointerdown');

        expect(triggerOnChildren).toHaveBeenCalledWith('controller-input-down', {
            code: 'default-type',
            entity: owner
        });
    });
});
