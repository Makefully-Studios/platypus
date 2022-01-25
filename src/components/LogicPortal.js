/**
# COMPONENT **LogicPortal**
A component which changes the scene when activated. When the portal receives an occupied message it sends the entity in that message notifying it. This message is meant to give the entity a chance to activate the portal in the manner it wants. The portal can also be activated by simply telling it to activate.

## Dependencies
- [[HandlerLogic]] (on entity's parent) - This component listens for a "handle-logic" message it then checks to see if it should change the scene if the portal is activated.
- [[SceneChanger]] (on entity) - This component listens for the "new-scene" message that the LogicPortal sends and actually handles the scene changing.
- [[CollisionBasic]] (on entity) - Not required, but if we want the 'occupied-portal' call to fire on collision you'll need to have a CollisionBasic component on the portal.

## Messages

### Listens for:
- **handle-logic** - Checks to see if we should change scene if the portal is activated.
- **occupied-portal** - This message takes an entity and then sends the entity a 'portal-waiting' message. The idea behind this was that you could use it with collision. When an entity gets in front of the portal the collision sends this message, we then tell the entity that collided to do whatever it needs and then it calls back to activate the portal.
  - @param message.entity (entity Object) - The entity that will receive the 'portal-waiting' message.
- **activate-portal** - This message turns the portal on. The next 'handle-logic' call will cause a change of scene.

### Local Broadcasts:
- **new-scene** - Calls the 'SceneChanger' component to tell it to change scenes.
  - @param object.destination (string) - The id of the scene that we want to go to.

### Peer Broadcasts:
- **portal-waiting** - Informs another object that the portal is waiting on it to send the activate message.
  - @param entity - This is the portal entity. To be used so that the object can communicate with it directly.

## JSON Definition
    {
      "type": "name-of-component",
      "destination" : "level-2"
      //Required - The destination scene to which the portal will take us. In most cases this will come into the portal from Tiled where you'll set a property on the portal you place.
    }
*/
import DataMap from '../DataMap.js';
import createComponentClass from '../factory.js';

export default (function () {
    return createComponentClass(/** @lends LogicPortal.prototype */{
        id: 'LogicPortal',
        initialize: function (definition) {
            var i = 0,
                entrants = definition.entrants || definition.entrant || 'no one',
                state = this.owner.state;
             
            this.destination = this.owner.destination || definition.destination;
            this.used = false;
            this.ready = false;
            this.wasReady = false;

            this.entrants = DataMap.setUp();
            if (Array.isArray(entrants)) {
                for (i = 0; i < entrants.length; i++) {
                    this.entrants.set(entrants[i], false);
                }
            } else {
                this.entrants.set(entrants, false);
            }
            
            this.state = state;

            state.set('occupied', false);
            state.set('ready', true);
        },
        events: {
            "handle-logic": function () {
                var entrants = this.entrants,
                    keys = entrants.keys,
                    i = keys.length,
                    occupied = false,
                    ready = true,
                    state = this.state;
                
                if (!this.used && this.activated) {
                    this.owner.triggerEvent("port-" + this.destination);
                    this.used = true;
                } else if (this.ready && !this.wasReady) {
                    this.owner.triggerEvent('portal-waiting');
                    this.wasReady = true;
                } else if (this.wasReady && !this.ready) {
                    this.owner.triggerEvent('portal-not-waiting');
                    this.wasReady = false;
                }
                
                
                //Reset portal for next collision run.
                while (i--) {
                    if (entrants[keys[i]]) {
                        occupied = true;
                        entrants.set(keys[i], false);
                    } else {
                        ready = false;
                    }
                }
                state.set('occupied', occupied);
                state.set('ready', ready);
                this.ready = false;
            },
            "occupied-portal": function (collision) {
                var entrants = this.entrants,
                    keys = entrants.keys,
                    i = keys.length;
                
                entrants.set(collision.entity.type, true);
                
                while (i--) {
                    if (!entrants.get(keys[i])) {
                        return;
                    }
                }
                
                this.ready = true;
            },
            "activate-portal": function () {
                this.activated = true;
            }
        },
        methods: {
            destroy: function () {
                this.state = null;
                this.entrants.recycle();
                this.entrants = null;
            }
        }
    });
}());
