/**
### Peer Broadcasts:
- **share-velocity** - This component triggers this message to prevent double collision calls.
  - @param entity ([[entity]]) - This entity.

## JSON Definition
    {
      "type": "LogicRebounder",
      
      "mass": 12,
      // Optional. Relative size of the entity. Defaults to 1.
      
      "elasticity": 0.4
      // Optional. Bounciness of the entity. Defaults to 0.8.
    }
*/
import Vector from '../Vector.js';
import {arrayCache} from '../utils/array.js';
import createComponentClass from '../factory.js';

export default createComponentClass(/** @lends platypus.components.LogicRebounder.prototype */{
    id: 'LogicRebounder',
    
    /**
     * This component works with `CollisionBasic` to cause entities to bounce away on solid collisions.
     *
     * @memberof platypus.components
     * @uses platypus.Component
     * @constructs
     * @param {*} definition 
     * @listens platypus.Entity#handle-logic
     */
    initialize: function (definition) {
        Vector.assign(this.owner, 'velocity', 'dx', 'dy', 'dz');

        this.owner.mass = this.owner.mass || definition.mass || 1;
        this.elasticity = definition.elasticity || 0.8;
        
        this.v = Vector.setUp(0, 0, 0);
        this.incidentVector = Vector.setUp(0, 0, 0);
        
        this.staticCollisionOccurred = false;
        this.nonStaticCollisionOccurred = false;
        
        this.hitThisTick = arrayCache.setUp();
        this.otherV = Vector.setUp(0, 0, 0);
        this.otherVelocityData = arrayCache.setUp();
    },

    events: {// These are messages that this component listens for
        "handle-logic": function () {
            this.hitThisTick.length = 0;
            for (let i = 0; i < this.otherVelocityData.length; i++) {
                this.otherVelocityData[i].velocity.recycle();
            }
            this.otherVelocityData.length = 0;
        },
        "hit-static": function ({direction, entity: other}) {
            let magnitude = 0;

            for (let x = 0; x < this.hitThisTick.length; x++) {
                if (other === this.hitThisTick[x]) {
                    return;
                }
            }
            this.hitThisTick.push(other);
            
            this.v.setVector(this.owner.velocity);
            this.incidentVector.setVector(direction);
            
            magnitude = this.v.scalarProjection(this.incidentVector);
            if (!isNaN(magnitude)) {
                this.incidentVector.scale(magnitude * (1 + this.elasticity));
                this.v.subtractVector(this.incidentVector);
            }
            
            this.owner.velocity.setVector(this.v);
        },
        "hit-non-static": function ({direction, entity: other}) {
            let otherVSet      = false,
                relevantV      = 0,
                otherRelevantV = 0,
                reboundV       = 0;

            if (this.hitThisTick.indexOf(other) >= 0) {
                return;
            }
            this.hitThisTick.push(other);
            
            for (let x = 0; x < this.otherVelocityData.length; x++) {
                if (other === this.otherVelocityData[x].entity) {
                    this.otherV.setVector(this.otherVelocityData[x].velocity);
                    otherVSet = true;
                    break;
                }
            }
            
            if (!otherVSet) {
                this.otherV.setVector(other.velocity);
                other.triggerEvent('share-velocity', this.owner);
            }
            
            this.v.setVector(this.owner.velocity);
            this.incidentVector.setVector(direction);
            
            
            relevantV = this.v.scalarProjection(this.incidentVector);
            relevantV = (isNaN(relevantV)) ? 0 : relevantV;
            otherRelevantV = this.otherV.scalarProjection(this.incidentVector);
            otherRelevantV = (isNaN(otherRelevantV)) ? 0 : otherRelevantV;
            
            reboundV = (relevantV * (this.owner.mass - other.mass) + 2 * other.mass * otherRelevantV) / (this.owner.mass + other.mass);
            
            this.incidentVector.scale(reboundV - relevantV);
            
            this.owner.velocity.setVector(this.incidentVector);
            
        },
        "share-velocity": function (other) {
            this.otherVelocityData.push({
                entity: other,
                velocity: Vector.setUp(other.velocity)
            });
        }
    },
    
    methods: {// These are methods that are called by this component.
        destroy: function () {
            this.v.recycle();
            this.incidentVector.recycle();
            this.otherV.recycle();
            arrayCache.recycle(this.hitThisTick);
            arrayCache.recycle(this.otherVelocityData);
        }
    }
});