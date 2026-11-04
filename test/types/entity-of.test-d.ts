import {expectAssignable, expectError, expectType} from 'tsd';
import type {Entity, EntityOf} from '../../types/entity-of';
import type {ComponentRegistry} from '../../types/components/registry';
import {defineEntity} from '../../types/defineEntity';

type PortableHero = EntityOf<'LogicPortable' | 'CollisionBasic'>;

declare const hero: PortableHero;

expectAssignable<PortableHero>(hero);
hero.triggerEvent('carry-me', {entity: hero});
hero.triggerEvent('hit-solid', {});
hero.triggerEvent('collide-off', undefined);

// Wide Entity keeps an open property bag this milestone.
declare const wide: Entity;
wide.customFlag = true;
expectType<unknown>(wide.get('sprite.texture'));
wide.triggerEvent('anything-goes', {ok: true});

// Camera alias resolves in the registry.
expectAssignable<keyof ComponentRegistry>('Camera');
expectAssignable<keyof ComponentRegistry>('HandlerCamera');
type Cam = EntityOf<'Camera'>;
declare const cam: Cam;
cam.triggerEvent('follow', {});

const def = defineEntity({
    id: 'hero',
    components: [
        {type: 'CollisionBasic' as const, collisionType: 'hero'},
        {type: 'LogicPortable' as const}
    ],
    properties: {x: 0, y: 0}
});
expectType<'hero'>(def.id);

// Strict EntityOf rejects unknown event names.
expectError(hero.triggerEvent('not-a-real-event'));
