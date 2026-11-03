import {entitiesCanSolidCollide, entitiesShareCollisionGroup} from '../utils/jumpThrough.js';
import createComponentClass from '../factory.js';

/**
 * How far past a carrier's solid face (px) a rider may sit and still count as supported
 * when a one-frame collision miss would otherwise drop them from a moving platform.
 */
const CARRY_SUPPORT_SLACK = 8;

export default (function () {
    return createComponentClass(/** @lends platypus.components.LogicPortable.prototype */{
        id: 'LogicPortable',
        properties: {
            /**
             * This is an object specifying the directions that this portable entity can be carried on. Default is {down:true}, but "up", "down", "left", and/or "right" can be specified as object properties set to `true`.
             *
             * @property portableDirections
             * @type Object
             * @default {"down": true}
             */
            portableDirections: {
                down: true //default is false, 'true' means as soon as carrier is connected downward
            }
        },

        /**
         * This component allows this entity to be carried by other entities with which it collides. Entities that should carry this entity need to have a [[Logic-Carrier]] component attached.
         *
         * @memberof platypus.components
         * @uses platypus.Component
         * @constructs
         * @listens platypus.Entity#collide-off
         * @listens platypus.Entity#force-release
         * @listens platypus.Entity#handle-logic
         * @listens platypus.Entity#hit-solid
         * @fires platypus.Entity#carry-me
         * @fires platypus.Entity#release-me
         */
        initialize: function () {
            this.carrier = this.lastCarrier = null;
            this.message = {
                entity: this.owner
            };
        },

        events: {
            "handle-logic": function () {
                const
                    {message: msg} = this;
                
                if (this.carrierConnected) {
                    if (this.carrier !== this.lastCarrier) {
                        if (this.lastCarrier) {
                            this.lastCarrier.triggerEvent('release-me', msg);
                        }

                        /**
                         * This message is triggered on a potential carrying peer, notifying the peer that this entity is portable.
                         *
                         * @event platypus.Entity#carry-me
                         * @param {platypus.Entity} message.entity This entity, requesting to be carried.
                         */
                        this.carrier.triggerEvent('carry-me', msg);
                    }
                    
                    this.carrierConnected = false;
                } else if (this.carrier) {
                    // Moving jump-through carriers can miss a floor hit for a frame after
                    // CollisionGroup sync. Stay carried while still grouped and supported.
                    if (!this.isStillSupportedByCarrier(this.carrier)) {

                    /**
                     * This message is triggered on the current carrier, notifying them to release this entity.
                     *
                     * @event platypus.Entity#release-me
                     * @param {platypus.Entity} message.entity This entity, requesting to be released.
                     */
                    this.carrier.triggerEvent('release-me', msg);
                    this.carrier = null;
                    }
                }
                this.lastCarrier = this.carrier;
            },

            "hit-solid": function (collisionInfo) {
                if (collisionInfo.y > 0) {
                    this.updateCarrier(collisionInfo.entity, 'down');
                } else if (collisionInfo.y < 0) {
                    this.updateCarrier(collisionInfo.entity, 'up');
                } else if (collisionInfo.x < 0) {
                    this.updateCarrier(collisionInfo.entity, 'left');
                } else if (collisionInfo.x > 0) {
                    this.updateCarrier(collisionInfo.entity, 'right');
                }
            },

            /**
             * Drop-through / temporary solid disable (e.g. Alma `no-ledge` → `collide-off`).
             * Must release immediately so CollisionGroup sync cannot hold the rider up.
             *
             * @event platypus.Entity#collide-off
             */
            "collide-off": function () {
                this.releaseCarrier();
            },

            /**
             * On receiving this message, this component immediately triggers 'release-me' on its owner's carrier.
             *
             * @event platypus.Entity#force-release
             */
            "force-release": function () {
                this.releaseCarrier();
            }
        },
        methods: {
            updateCarrier: function (entity, direction) {
                if (this.portableDirections[direction]) {
                    if (entity) {
                        if (entity !== this.carrier) {
                            this.carrier = entity;
                        }
                        this.carrierConnected = true;
                    }
                }
            },

            releaseCarrier: function () {
                if (this.carrier) {
                    this.carrier.triggerEvent('release-me', this.message);
                }
                this.carrier = null;
                this.lastCarrier = this.carrier;
                this.carrierConnected = false;
            },

            /**
             * True when this entity is still a CollisionGroup passenger of the carrier and
             * remains horizontally over / near the carrier's top face.
             */
            isStillSupportedByCarrier: function (carrier) {
                if (!carrier || !entitiesShareCollisionGroup(this.owner, carrier)) {
                    return false;
                }

                // Typed collide-off (e.g. hero-on-ledge) removes the only solid
                // link to a ledge carrier; aliases never broadcast entity-wide
                // collide-off, so keep-carry must detect the missing path here.
                if (!entitiesCanSolidCollide(this.owner, carrier)) {
                    return false;
                }

                if (!this.portableDirections.down) {
                    return true;
                }

                const
                    riderAABB = this.owner.getAABB?.() ?? null,
                    carrierAABB = carrier.getAABB?.() ?? null;

                if (!riderAABB || !carrierAABB) {
                    return true;
                }

                const
                    horizontal = riderAABB.left < carrierAABB.right && riderAABB.right > carrierAABB.left,
                    nearTop = riderAABB.bottom <= carrierAABB.top + CARRY_SUPPORT_SLACK
                        && riderAABB.bottom >= carrierAABB.top - CARRY_SUPPORT_SLACK;

                return horizontal && nearTop;
            }
        }
    });
}());
