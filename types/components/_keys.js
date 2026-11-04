/**
 * Auto-generated contribution key mirror for contract tests.
 * Regenerate: npm run generate:component-keys
 *
 * Soft-skipped at generation time: ["RenderLottie"]
 * Entries with optionalPeer may be hand-maintained across regenerations.
 */
export const COMPONENT_ALIASES = {
    "Camera": "HandlerCamera"
};

export const COMPONENT_KEYS = {
    "AIChaser": {
        "properties": [
            "accelerate",
            "chasing"
        ],
        "publicProperties": [
            "speed"
        ],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-ai",
            "load",
            "set-target",
            "set-target-offset",
            "start-chasing",
            "stop-chasing"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "AIPacer": {
        "properties": [
            "direction",
            "movement"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-ai",
            "turn-around"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": true
    },
    "AudioMusic": {
        "properties": [
            "fade",
            "tracks"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "changeMusicTracks"
        ],
        "events": [
            "change-music-tracks"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "AudioSFX": {
        "properties": [
            "audioMap",
            "autoPan",
            "eventBased",
            "forcePlayThrough",
            "stateBased"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "addStateCheck",
            "getAllClips",
            "getClipById",
            "handleClip",
            "removeClip",
            "stopAudio"
        ],
        "events": [
            "handle-render",
            "mute-audio",
            "pause-audio",
            "set-pan",
            "set-speed",
            "set-volume",
            "state-changed",
            "stop-audio",
            "toggle-mute",
            "unmute-audio",
            "unpause-audio"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "AudioVO": {
        "properties": [
            "audioMap",
            "interrupt",
            "preloadAudio"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "checkTimeEvents",
            "playSound",
            "setupEventList"
        ],
        "events": [
            "handle-render",
            "play-voice-over",
            "stop-audio"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "HandlerCamera": {
        "properties": [
            "height",
            "mode",
            "overflow",
            "rotate",
            "stretch",
            "threshold",
            "width",
            "x",
            "y"
        ],
        "publicProperties": [
            "canvas",
            "transitionAngle",
            "transitionX",
            "transitionY",
            "worldCamera",
            "z"
        ],
        "publicMethods": [
            "isOnCanvas",
            "windowToWorld",
            "worldToWindow"
        ],
        "methods": [
            "addCamera",
            "clampAspectRatio",
            "follow",
            "lockedFollow",
            "matchAspectRatio",
            "move",
            "moveX",
            "moveY",
            "removeCamera",
            "reorient",
            "resize",
            "updateMovementMethods",
            "updateViewport"
        ],
        "events": [
            "child-entity-added",
            "child-entity-removed",
            "child-entity-updated",
            "follow",
            "load",
            "pointerdown",
            "pressmove",
            "pressup",
            "relocate",
            "render-world",
            "resize-camera",
            "shake",
            "tick",
            "world-loaded"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "EntityCamera": {
        "properties": [
            "camera",
            "mode",
            "pause"
        ],
        "publicProperties": [
            "cameraBounds",
            "cameraFocus",
            "cameraHeight",
            "cameraOffset",
            "cameraOffsetX",
            "cameraOffsetY",
            "cameraSize",
            "cameraWidth",
            "x",
            "y"
        ],
        "publicMethods": [],
        "methods": [],
        "events": [
            "follow-me",
            "handle-movement"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "CollisionBasic": {
        "properties": [
            "collisionType",
            "height",
            "ignoreOrientation",
            "margin",
            "radius",
            "regX",
            "regY",
            "shapeType",
            "shapes",
            "softCollisions",
            "solidCollisions",
            "width"
        ],
        "publicProperties": [
            "bullet",
            "collisionDirty",
            "immobile",
            "jumpThrough"
        ],
        "publicMethods": [],
        "methods": [
            "getAABB",
            "getPrevShapes",
            "getPreviousAABB",
            "getShapes",
            "movePreviousX",
            "prepareCollision"
        ],
        "events": [
            "collide-off",
            "collide-on",
            "handle-logic",
            "orientation-updated",
            "relocate-entity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": true
    },
    "CollisionFilter": {
        "properties": [
            "collisions",
            "state"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "CollisionGroup": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [
            "getCollisionGroupAABB",
            "getWorldEntities",
            "getWorldTerrain"
        ],
        "methods": [
            "addCollisionEntity",
            "getAABB",
            "getCollisionTypes",
            "getPrevShapes",
            "getPreviousAABB",
            "getShapes",
            "getSolidCollisions",
            "movePreviousX",
            "prepareCollision",
            "relocateEntity",
            "removeCollisionEntity",
            "updateAABB"
        ],
        "events": [
            "add-collision-entity",
            "child-entity-added",
            "child-entity-removed",
            "relocate-entity",
            "remove-collision-entity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "CollisionTiles": {
        "properties": [
            "collisionType",
            "collisionTypeMap",
            "left",
            "top"
        ],
        "publicProperties": [
            "collisionMap",
            "tileHeight",
            "tileWidth"
        ],
        "publicMethods": [
            "getAABB",
            "getCollisionMatrix",
            "getTileShapes",
            "isTile",
            "setCollisionMatrix",
            "transform",
            "translate"
        ],
        "methods": [
            "addShape",
            "getShape"
        ],
        "events": [
            "add-collision-tiles",
            "transform",
            "translate"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "ComponentSwitcher": {
        "properties": [
            "componentMap"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "switchComponents"
        ],
        "events": [
            "prepare-logic"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": true
    },
    "ControllerInput": {
        "properties": [
            "code",
            "controllerType"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Counter": {
        "properties": [
            "persistentStorage"
        ],
        "publicProperties": [
            "count",
            "progress",
            "total"
        ],
        "publicMethods": [],
        "methods": [],
        "events": [
            "change-count",
            "change-total",
            "decrement-count",
            "handle-logic",
            "increment-count"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "EntityContainer": {
        "properties": [
            "childEvents"
        ],
        "publicProperties": [],
        "publicMethods": [
            "addEntity",
            "getEntitiesByType",
            "getEntityById",
            "removeEntity",
            "triggerEventOnChildren",
            "triggerOnChildren"
        ],
        "methods": [
            "addChildEventListener",
            "addChildEventListeners",
            "addNewPrivateEvent",
            "addNewPublicEvent",
            "removeChildEventListener",
            "removeChildEventListeners",
            "updateChildEventListeners"
        ],
        "events": [
            "add-entity",
            "child-entity-updated",
            "handle-logic",
            "remove-entity"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "EntityController": {
        "properties": [
            "controlMap",
            "joystick",
            "stateMaps"
        ],
        "publicProperties": [
            "paused"
        ],
        "publicMethods": [],
        "methods": [
            "addController",
            "addMap",
            "handleJoy"
        ],
        "events": [
            "handle-controller",
            "pause-controls",
            "pointerdown",
            "pressmove",
            "pressup",
            "unpause-controls"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "HandlerCollision": {
        "properties": [
            "gridBits"
        ],
        "publicProperties": [],
        "publicMethods": [
            "getEntityCollisions",
            "getPointCollisions",
            "getShapeCollisions",
            "getWorldEntities",
            "getWorldTerrain"
        ],
        "methods": [
            "addCollisionEntity",
            "checkCamera",
            "checkEntityForSoftCollisions",
            "checkGroupCollisions",
            "checkPointForCollisions",
            "checkShapeForCollisions",
            "checkSoftCollisions",
            "checkSolidCollisions",
            "checkSolidEntityCollision",
            "findMinAxisMovement",
            "findMinShapeMovementCollision",
            "getAgainstGrid",
            "getEntityAgainstGrid",
            "mapDown",
            "mergeAGCell",
            "processCollisionStep",
            "removeAgainst",
            "removeCollisionEntity",
            "resolveCollisionPosition",
            "resolveNonCollisions",
            "updateAgainst"
        ],
        "events": [
            "add-collision-entity",
            "check-collision-group",
            "child-entity-added",
            "child-entity-removed",
            "child-entity-updated",
            "remove-collision-entity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": true
    },
    "HandlerController": {
        "properties": [
            "enableDefaultEvents",
            "upOnBlur",
            "useHandleLogic"
        ],
        "publicProperties": [
            "inputPrecedence"
        ],
        "publicMethods": [],
        "methods": [
            "triggerControlAction",
            "triggerOnAll"
        ],
        "events": [
            "blur-control",
            "invalid-input",
            "valid-input"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "HandlerLogic": {
        "properties": [
            "alwaysOn"
        ],
        "publicProperties": [
            "buffer",
            "maxStepsPerTick",
            "stepLength",
            "timeMultiplier"
        ],
        "publicMethods": [],
        "methods": [],
        "events": [
            "camera-update",
            "child-entity-added",
            "child-entity-removed",
            "child-entity-updated",
            "pause-logic",
            "tick",
            "unpause-logic"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "HandlerRender": {
        "properties": [
            "interactive"
        ],
        "publicProperties": [
            "timeMultiplier",
            "worldContainer"
        ],
        "publicMethods": [],
        "methods": [
            "renderUpdate",
            "setParentRenderContainer"
        ],
        "events": [
            "child-entity-added",
            "load",
            "pause-render",
            "render-update",
            "set-parent-render-container",
            "tick",
            "unpause-render"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Interactive": {
        "properties": [
            "container",
            "hitArea",
            "hover",
            "relativeToSelf",
            "trackCameraUpdates"
        ],
        "publicProperties": [
            "buttonMode"
        ],
        "publicMethods": [],
        "methods": [
            "addInputs",
            "handlePressUp",
            "setHitArea",
            "toJSON"
        ],
        "events": [
            "camera-update",
            "dispatch-event",
            "input-off",
            "input-on",
            "pointercancel",
            "pointerdown",
            "pointermove",
            "pointerup",
            "pointerupoutside",
            "set-hit-area"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LevelBuilder": {
        "properties": [
            "levelPieces",
            "levelTemplate",
            "useUniques"
        ],
        "publicProperties": [],
        "publicMethods": [
            "mergeLevels"
        ],
        "methods": [
            "cloneLevel",
            "getLevelPiece"
        ],
        "events": [
            "layer-loaded"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "LogicAngularMovement": {
        "properties": [
            "acceleration",
            "maxVelocity",
            "startAngle",
            "visualOffset"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "move",
            "set-angle",
            "set-max-velocity",
            "stop"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicAttachment": {
        "properties": [
            "attachState",
            "attachment",
            "events",
            "offsetX",
            "offsetY",
            "offsetZ",
            "startAttached",
            "updateProperties"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "attach",
            "change-attachment-offset",
            "detach",
            "handle-logic"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "LogicButton": {
        "properties": [
            "baton",
            "disabled",
            "onCancel",
            "onHover",
            "onPress",
            "onRelease",
            "pressed",
            "toggle",
            "useOnce",
            "validParentState",
            "validState"
        ],
        "publicProperties": [
            "bottom",
            "left",
            "right",
            "top"
        ],
        "publicMethods": [],
        "methods": [
            "checkStateValidity",
            "updatePosition",
            "updateStateAndTrigger"
        ],
        "events": [
            "camera-update",
            "disable",
            "enable",
            "handle-logic",
            "highlight",
            "pointerdown",
            "pointerout",
            "pointerover",
            "pressup",
            "toggle-disabled",
            "toggle-highlight",
            "unhighlight"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicCarrier": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "carry-me",
            "load",
            "release-me"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicDestroyMe": {
        "properties": [
            "delay",
            "destroyed"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "destroy-me",
            "prepare-logic"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicDirectionalMovement": {
        "properties": [
            "axis",
            "speed"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "accelerate",
            "component-added",
            "face",
            "go-down",
            "go-down-left",
            "go-down-right",
            "go-east",
            "go-left",
            "go-north",
            "go-northeast",
            "go-northwest",
            "go-right",
            "go-south",
            "go-southeast",
            "go-southwest",
            "go-up",
            "go-up-left",
            "go-up-right",
            "go-west",
            "handle-logic",
            "stop"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicDragDrop": {
        "properties": [
            "dragDisabled",
            "stickiness"
        ],
        "publicProperties": [
            "stayInViewport",
            "stickyClick"
        ],
        "publicMethods": [],
        "methods": [
            "checkCamera",
            "claimPointer",
            "release",
            "releaseContainer",
            "releasePointer"
        ],
        "events": [
            "camera-update",
            "disable-drag",
            "handle-logic",
            "input-off",
            "pointerdown",
            "pointermove",
            "prepare-logic",
            "pressmove",
            "pressup"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicImpactLaunch": {
        "properties": [
            "accelerationX",
            "accelerationY",
            "flipX",
            "flipY",
            "state"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "component-added",
            "handle-logic",
            "hit-solid",
            "impact-launch"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicPacingPlatform": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicPortable": {
        "properties": [
            "portableDirections"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "isStillSupportedByCarrier",
            "releaseCarrier",
            "updateCarrier"
        ],
        "events": [
            "collide-off",
            "force-release",
            "handle-logic",
            "hit-solid"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicPortal": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "activate-portal",
            "handle-logic",
            "occupied-portal"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicPushable": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "hit-solid",
            "push-entity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicRebounder": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "hit-non-static",
            "hit-static",
            "share-velocity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicRegionSpawner": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "LogicRotationalMovement": {
        "properties": [
            "angle",
            "degree",
            "speed"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "go-backward",
            "go-forward",
            "handle-logic",
            "rotate",
            "stop",
            "stop-moving",
            "stop-turning",
            "turn-left",
            "turn-right"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicSpawner": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "spawn"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "LogicStateMachine": {
        "properties": [
            "appendDetails",
            "inputs",
            "outputs"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "state-changed",
            "update-state"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicSwitch": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "switch-pressed"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicTeleportee": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "setDestination"
        ],
        "events": [
            "handle-logic",
            "hit-telepoint",
            "set-destination",
            "teleport"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicTeleporter": {
        "properties": [],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "peer-entity-added",
            "teleport-entity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicTimer": {
        "properties": [
            "alarmMessage",
            "alarmTime",
            "isIncrementing",
            "isInterval",
            "isOn",
            "maxTime",
            "resetOnStop",
            "time",
            "updateMessage"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "set-timer",
            "start-timer",
            "stop-timer"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "LogicWindUpRacer": {
        "properties": [
            "raceTime",
            "speed",
            "windTime"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-logic",
            "hit-solid",
            "stop-racing",
            "wind-up"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Motion": {
        "properties": [
            "acceleration",
            "activeAcceleration",
            "activeVelocity",
            "controlState",
            "drag",
            "friction",
            "instant",
            "instantDecay",
            "instantState",
            "instantSuccess",
            "maxMagnitude",
            "orient",
            "stopOnCollision",
            "velocity"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "decay",
            "move"
        ],
        "events": [
            "control-acceleration",
            "control-velocity",
            "instant-begin",
            "instant-end",
            "instant-motion",
            "set-motion",
            "start-acceleration",
            "start-velocity",
            "stop-acceleration",
            "stop-velocity"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Mover": {
        "properties": [
            "ground"
        ],
        "publicProperties": [
            "drag",
            "friction",
            "gravity",
            "jump",
            "maxMagnitude",
            "maxMagnitudeDelta",
            "movers",
            "reorientVelocities",
            "speed"
        ],
        "publicMethods": [
            "addMover",
            "removeMover"
        ],
        "methods": [],
        "events": [
            "component-added",
            "component-removed",
            "handle-movement",
            "handle-post-collision-logic",
            "hit-solid",
            "load",
            "orientation-updated",
            "pause-movement",
            "set-mover",
            "unpause-movement"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Node": {
        "properties": [
            "neighborProperties"
        ],
        "publicProperties": [
            "neighbors",
            "nodeId",
            "x",
            "y",
            "z"
        ],
        "publicMethods": [
            "addToEdge",
            "addToNode",
            "getNode",
            "joinNode",
            "removeFromEdge",
            "removeFromNode"
        ],
        "methods": [
            "toJSON"
        ],
        "events": [
            "add-neighbors",
            "remove-neighbor"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "NodeMap": {
        "properties": [],
        "publicProperties": [
            "map"
        ],
        "publicMethods": [
            "getClosestNode",
            "getNode"
        ],
        "methods": [
            "addNode",
            "removeNode"
        ],
        "events": [
            "add-node",
            "child-entity-added",
            "child-entity-removed",
            "remove-node"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "NodeResident": {
        "properties": [
            "algorithm",
            "node",
            "offset",
            "snapToNodes",
            "updateOrientation"
        ],
        "publicProperties": [
            "friendlyEntities",
            "friendlyNodes",
            "nodeId",
            "speed"
        ],
        "publicMethods": [],
        "methods": [
            "getOffNode",
            "getOnNode",
            "gotoNode",
            "isPassable",
            "onEdge",
            "setPath",
            "setState",
            "traverseNode"
        ],
        "events": [
            "follow",
            "goto-closest-node",
            "goto-node",
            "handle-logic",
            "remove-directions",
            "set-algorithm",
            "set-directions"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Orientation": {
        "properties": [],
        "publicProperties": [
            "orientation",
            "orientationMatrix",
            "rotation",
            "scaleX",
            "scaleY"
        ],
        "publicMethods": [
            "tweenTransform"
        ],
        "methods": [
            "multiply",
            "replace",
            "transform",
            "updateTween",
            "updateVector"
        ],
        "events": [
            "append-transform",
            "complete-tweens",
            "drop-tweens",
            "handle-logic",
            "load",
            "orient-vector",
            "prepend-transform",
            "remove-vector",
            "replace-transform",
            "transform",
            "tween-transform"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RandomEvents": {
        "properties": [
            "events",
            "trueRandom"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RelativePosition": {
        "properties": [
            "cameraSizes"
        ],
        "publicProperties": [
            "bottom",
            "left",
            "right",
            "scaleX",
            "scaleY",
            "top",
            "x",
            "y"
        ],
        "publicMethods": [],
        "methods": [
            "checkCamera",
            "updatePosition",
            "updateProperties"
        ],
        "events": [
            "camera-update",
            "handle-logic"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RelayFamily": {
        "properties": [
            "events"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "broadcast"
        ],
        "events": [
            "entity-created",
            "link-family"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RelayGame": {
        "properties": [
            "events"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RelayLinker": {
        "properties": [
            "events",
            "linkId"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "load"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RelayParent": {
        "properties": [
            "events"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RelaySelf": {
        "properties": [
            "events"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Render": {
        "properties": [
            "image",
            "images",
            "localRotation",
            "localScaleX",
            "localScaleY",
            "matchEntity",
            "offsetX",
            "offsetY",
            "offsetZ",
            "options",
            "spriteType"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "addToContainer"
        ],
        "events": [],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "RenderAnimator": {
        "properties": [
            "animationEvents",
            "animationStates",
            "component",
            "forcePlayThrough",
            "loop",
            "restart"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "toJSON"
        ],
        "events": [
            "animation-ended",
            "state-changed",
            "update-animation"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RenderContainer": {
        "properties": [
            "cache",
            "cullable",
            "flip",
            "ignoreOpacity",
            "interactive",
            "interpolation",
            "localMask",
            "mask",
            "mirror",
            "rotate",
            "visible"
        ],
        "publicProperties": [
            "dragMode",
            "renderParent",
            "rotation",
            "scaleX",
            "scaleY",
            "skewX",
            "skewY",
            "tint",
            "x",
            "y",
            "z"
        ],
        "publicMethods": [
            "addToParentContainer",
            "removeFromParentContainer"
        ],
        "methods": [
            "setMask",
            "updateSprite"
        ],
        "events": [
            "cache",
            "handle-render-load",
            "hide-sprite",
            "set-mask",
            "show-sprite"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RenderDebug": {
        "properties": [
            "aabbColor",
            "collisionColor",
            "groupColor",
            "height",
            "offsetZ",
            "renderColor",
            "width"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "addShape",
            "update",
            "updateSprites"
        ],
        "events": [
            "collide-off",
            "collide-on",
            "handle-render",
            "load",
            "orientation-updated"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RenderDestroyMe": {
        "properties": [
            "animationId",
            "animationIds"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "animation-ended"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RenderProgress": {
        "properties": [
            "backgroundColor",
            "color",
            "flip",
            "height",
            "mirror",
            "regX",
            "regY",
            "width"
        ],
        "publicProperties": [
            "x",
            "y",
            "z"
        ],
        "publicMethods": [],
        "methods": [],
        "events": [
            "handle-render",
            "handle-render-load",
            "update-progress"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RenderSpine": {
        "properties": [
            "animationEvents",
            "animationMap",
            "animationStates",
            "atlas",
            "eventBased",
            "flip",
            "interactive",
            "localScaleX",
            "localScaleY",
            "mask",
            "mirror",
            "mixTimes",
            "offsetX",
            "offsetY",
            "offsetZ",
            "preMultipliedAlpha",
            "skeleton",
            "skinMap",
            "stateBased",
            "visible"
        ],
        "publicProperties": [
            "dragMode",
            "scaleX",
            "scaleY",
            "skewX",
            "skewY",
            "x",
            "y",
            "z"
        ],
        "publicMethods": [],
        "methods": [
            "addToContainer",
            "innerPlayAnimation",
            "playAnimation",
            "setMixTimes",
            "stopAnimation",
            "switchSkin"
        ],
        "events": [
            "apply-spine-physics",
            "handle-render",
            "hide",
            "pause-animation",
            "play-animation",
            "set-mix-times",
            "show",
            "stop-animation",
            "switch-skin",
            "tint-attachment",
            "tint-slots",
            "unpause-animation"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "RenderSprite": {
        "properties": [
            "animationEvents",
            "animationMap",
            "animationStates",
            "cache",
            "eventBased",
            "flip",
            "forcePlayThrough",
            "ignoreOpacity",
            "interactive",
            "localRotation",
            "localScaleX",
            "localScaleY",
            "mask",
            "mirror",
            "offsetX",
            "offsetY",
            "offsetZ",
            "restart",
            "scale",
            "scaleX",
            "scaleY",
            "skew",
            "skewX",
            "skewY",
            "spriteSheet",
            "stateBased",
            "visible"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "addToContainer",
            "playAnimation",
            "stopAnimation"
        ],
        "events": [
            "handle-render",
            "play-animation",
            "stop-animation"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "RenderText": {
        "properties": [
            "offsetX",
            "offsetY",
            "offsetZ",
            "style",
            "text"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "addToContainer"
        ],
        "events": [
            "set-text"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "RenderTiles": {
        "properties": [
            "buffer",
            "cacheAll",
            "entityCache",
            "imageMap",
            "left",
            "maximumBuffer",
            "parallaxOriginX",
            "parallaxOriginY",
            "parallaxX",
            "parallaxY",
            "refreshBuffer",
            "scaleX",
            "scaleY",
            "spriteSheet",
            "tileCache",
            "tileHeight",
            "tileWidth",
            "top"
        ],
        "publicProperties": [],
        "publicMethods": [
            "getMapDimensions",
            "getRootTileIndex",
            "getTileAt",
            "getTileVariants"
        ],
        "methods": [
            "alignCacheToCamera",
            "cacheSprite",
            "convertCamera",
            "createGrid",
            "createMap",
            "createTile",
            "detachCacheCopy",
            "populateTiles",
            "populateTilesAndEntities",
            "refreshAllCacheGrid",
            "refreshAllCaches",
            "refreshPanningCache",
            "renderCache",
            "renderCacheClear",
            "renderCacheWithExtrusion",
            "setupFullCache",
            "setupNoCache",
            "setupPanningCache",
            "setupSingleCache",
            "toJSON",
            "uncacheSprite",
            "updateBufferRegion",
            "updateRegion",
            "updateTile"
        ],
        "events": [
            "add-tiles",
            "cache-sprite",
            "camera-loaded",
            "change-tile",
            "force-render",
            "peer-entity-added",
            "peer-entity-removed",
            "refresh-cache"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "SceneChanger": {
        "properties": [
            "loadLayers",
            "persistentData",
            "scene",
            "unloadLayers"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "new-scene",
            "set-persistent-scene-data",
            "set-scene"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "TiledLoader": {
        "properties": [
            "backgroundLoad",
            "images",
            "layerIncrement",
            "offsetMap",
            "separateTiles",
            "showCollisionTiles",
            "spriteSheet"
        ],
        "publicProperties": [
            "entityModifier",
            "entityPositionX",
            "entityPositionY",
            "level",
            "manuallyLoad",
            "tileHeight",
            "tileWidth"
        ],
        "publicMethods": [],
        "methods": [
            "convertImageLayer",
            "createLayer",
            "loadLevel",
            "setUpEntities",
            "setupLayer",
            "updateLoadingProgress"
        ],
        "events": [
            "layer-loaded",
            "load-level"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": false
    },
    "Timeline": {
        "properties": [
            "executionFlow",
            "timelines"
        ],
        "publicProperties": [],
        "publicMethods": [
            "wait"
        ],
        "methods": [
            "addTimeline",
            "createTimeStampedTimeline",
            "progressTimeline",
            "startTimeline"
        ],
        "events": [
            "add-timeline",
            "handle-logic",
            "pause-timelines",
            "play-timelines",
            "start-timeline",
            "stop-active-timelines",
            "stop-all-timelines"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Tutorial": {
        "properties": [
            "tutorialDefs"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "checkRequirements",
            "play",
            "queue"
        ],
        "events": [
            "child-entity-added",
            "child-entity-removed",
            "handle-logic",
            "peer-entity-added",
            "peer-entity-removed",
            "sequence-complete"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Tween": {
        "properties": [
            "events"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "createTween",
            "createTweens",
            "runTween"
        ],
        "events": [
            "handle-logic",
            "pause-tween",
            "stop-tween",
            "tween",
            "unpause-tween"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "VoiceOver": {
        "properties": [
            "acceptInput",
            "aliases",
            "animation",
            "animationMap",
            "flip",
            "frameLength",
            "generatedVoiceOverMaps",
            "hidden",
            "interactive",
            "mask",
            "messagePrefix",
            "mirror",
            "offsetZ",
            "regX",
            "regY",
            "renderComponent",
            "restart",
            "scaleX",
            "scaleY",
            "spriteSheet",
            "stateBased",
            "voiceOverMap"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [],
        "events": [
            "play-voice-over-with-lip-sync"
        ],
        "hasGetAssetList": true,
        "dynamicEvents": true
    },
    "XHR": {
        "properties": [
            "method",
            "path",
            "responseType",
            "withCredentials"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "get",
            "post",
            "setProperties"
        ],
        "events": [
            "request"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false
    },
    "Camera": {
        "properties": [
            "height",
            "mode",
            "overflow",
            "rotate",
            "stretch",
            "threshold",
            "width",
            "x",
            "y"
        ],
        "publicProperties": [
            "canvas",
            "transitionAngle",
            "transitionX",
            "transitionY",
            "worldCamera",
            "z"
        ],
        "publicMethods": [
            "isOnCanvas",
            "windowToWorld",
            "worldToWindow"
        ],
        "methods": [
            "addCamera",
            "clampAspectRatio",
            "follow",
            "lockedFollow",
            "matchAspectRatio",
            "move",
            "moveX",
            "moveY",
            "removeCamera",
            "reorient",
            "resize",
            "updateMovementMethods",
            "updateViewport"
        ],
        "events": [
            "child-entity-added",
            "child-entity-removed",
            "child-entity-updated",
            "follow",
            "load",
            "pointerdown",
            "pressmove",
            "pressup",
            "relocate",
            "render-world",
            "resize-camera",
            "shake",
            "tick",
            "world-loaded"
        ],
        "hasGetAssetList": false,
        "dynamicEvents": false,
        "aliasOf": "HandlerCamera"
    },
    "RenderLottie": {
        "properties": [
            "localRotation",
            "localScaleX",
            "localScaleY",
            "offsetX",
            "offsetY",
            "offsetZ",
            "options"
        ],
        "publicProperties": [],
        "publicMethods": [],
        "methods": [
            "addToContainer"
        ],
        "events": [],
        "hasGetAssetList": true,
        "dynamicEvents": false,
        "optionalPeer": "@qva/pixi-lottie"
    }
};

export default COMPONENT_KEYS;
