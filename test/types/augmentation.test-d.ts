import {expectAssignable} from 'tsd';
import type {EntityOf} from '../../types/entity-of';
import type {ComponentContribution} from '../../types/entity-of';

declare module '../../types/components/registry' {
    interface ComponentRegistry {
        MyJump: MyJumpContribution;
    }
}

interface MyJumpContribution extends ComponentContribution {
    props: {
        jumpHeight?: number;
    };
    methods: {
        doJump?: () => void;
    };
    events: {
        jump: { force: number };
    };
    componentProps: {
        jumpHeight?: number;
    };
}

type Jumper = EntityOf<'MyJump'>;
declare const jumper: Jumper;

expectAssignable<number | undefined>(jumper.jumpHeight);
jumper.triggerEvent('jump', {force: 10});
jumper.doJump?.();
