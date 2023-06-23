/* global atob, platypus */
import {arrayCache, greenSlice, union} from '../utils/array.js';
import AABB from '../AABB.js';
import Data from '../Data.js';
import DataMap from '../DataMap.js';
import Entity from '../Entity.js';
import EntityLinker from '../EntityLinker';
import Vector from '../Vector.js';
import createComponentClass from '../factory.js';
import {inflate} from 'pako';

const
    FILENAME_TO_ID = /^(?:(\w+:)\/{2}(\w+(?:\.\w+)*\/?))?([\/.]*?(?:[^?]+)?\/)?(?:(([^\/?]+)\.(\w+))|([^\/?]+))(?:\?((?:(?:[^&]*?[\/=])?(?:((?:(?:[^\/?&=]+)\.(\w+)))\S*?)|\S+))?)?$/,
    maskId = 0x0fffffff,
    maskXFlip = 0x80000000,
    maskYFlip = 0x40000000,
    decodeString = (str, index) => (((str.charCodeAt(index)) + (str.charCodeAt(index + 1) << 8) + (str.charCodeAt(index + 2) << 16) + (str.charCodeAt(index + 3) << 24 )) >>> 0),
    decodeArray = (arr, index) => ((arr[index] + (arr[index + 1] << 8) + (arr[index + 2] << 16) + (arr[index + 3] << 24 )) >>> 0),
    decodeBase64 = (data, compression) => {
        const
            arr   = [],
            compressed = compression === 'zlib',
            step1 = window.atob(data.replace(/\\/g, '')),
            step2 = compressed ? inflate(step1) : step1,
            decode = compressed ? decodeArray : decodeString;
        let index = 4;
            
        while (index <= step2.length) {
            arr.push(decode(step2, index - 4));
            index += 4;
        }
        
        return arr;
    },
    decodeLayer = function (layer) {
        if (layer.encoding === 'base64') {
            layer.data = decodeBase64(layer.data, layer.compression);
            layer.encoding = 'csv'; // So we won't have to decode again.
        }
        return layer;
    },
    getKey = function (path) {
        const
            result = path.match(FILENAME_TO_ID);

        return result[5] ?? result[7];
    },
    getPowerOfTen = function (amount) {
        let x = 1;

        while (x < amount) {
            x *= 10;
        }

        return x;
    },
    transform = {
        x: 1,
        y: 1,
        id: -1
    },
    getProperty = (...args) => {
        const obj = getPropertyObject(...args);

        return obj && obj.value;
    },
    getPropertyObject = (obj, key) => { // Handle Tiled map versions
        if (obj) {
            if (Array.isArray(obj)) {
                let i = obj.length;
                while (i--) {
                    if (obj[i].name === key) {
                        return obj[i];
                    }
                }
                return null;
            } else {
                platypus.debug.warn('This Tiled map version is deprecated.');
                return {
                    name: key,
                    type: typeof obj[key],
                    value: obj[key]
                };
            }
        } else {
            return null;
        }
    },
    setProperty = (obj, key, value) => { // Handle Tiled map versions
        if (obj) {
            if (Array.isArray(obj)) {
                let i = obj.length;

                while (i--) {
                    if (obj[i].name === key) {
                        obj[i].type = typeof value;
                        obj[i].value = value;
                        return;
                    }
                }
                obj.push({
                    name: key,
                    type: typeof value,
                    value: value
                });
            } else {
                obj[key] = value;
            }
        }
    },
    entityTransformCheck = function (v) {
        const
            b = !!(maskYFlip & v),
            c = !!(maskXFlip & v);

        transform.id = maskId & v;
        transform.x = 1;
        transform.y = 1;

        if (b) {
            transform.y = -1;
        }
        if (c) {
            transform.x = -1;
        }
        return transform;
    },
    createTilesetObjectGroupReference = function (reference, tilesets) {
        for (let i = 0; i < tilesets.length; i++) {
            const
                tileset = tilesets[i],
                tiles = tileset.tiles;
            
            if (tiles) {
                for (let j = 0; j < tiles.length; j++) {
                    const tile = tiles[j];

                    if (tile.objectgroup) { // Could just be other information, like terrain
                        reference.set(tile.id + tileset.firstgid, tile.objectgroup);
                    }
                }
            }
        }
    },
    getEntityData = function (obj, tilesets, entityLinker) {
        const
            properties = {},
            data = {
                gid: -1,
                transform: null,
                properties,
                type: ''
            },
            props = null;
        let gid = obj.gid || -1;
        
        if (gid !== -1) {
            data.transform = entityTransformCheck(gid);
            gid = data.gid = transform.id;
        }
        
        if (tilesets) {
            let tileset = null;

            for (let x = 0; x < tilesets.length; x++) {
                if (tilesets[x].firstgid > gid) {
                    break;
                } else {
                    tileset = tilesets[x];
                }
            }
            
            if (tileset?.tiles) {
                const
                    tiles = tileset.tiles,
                    entityTilesetIndex = gid - tileset.firstgid;

                for (let i = 0; i < tiles.length; i++) {
                    const tile = tiles[i];
                    if (tile.id === entityTilesetIndex) {
                        props = tile.properties || null;
                        data.type = tile.type || '';
                        break;
                    }
                }
            }
        }

        // Check Tiled data to find this object's type
        data.type = obj.type || data.type;

        if (!data.type) { // undefined entity
            return null;
        }
        
        //Copy properties from Tiled
        if (data.transform) {
            properties.scaleX = data.transform.x;
            properties.scaleY = data.transform.y;
        } else {
            properties.scaleX = 1;
            properties.scaleY = 1;
        }
        
        if (entityLinker) {
            entityLinker.linkObject(data.properties.tiledId = obj.id);
        }
        mergeAndFormatProperties(props, data.properties, entityLinker);
        mergeAndFormatProperties(obj.properties, data.properties, entityLinker);
        
        return data;
    },
    mergeAndFormatProperties = function (src, dest, entityLinker) {
        if (src && dest) {
            if (Array.isArray(src)) {
                for (let i = 0; i < src.length; i++) {
                    setProperty(dest, src[i].name, formatPropertyObject(src[i], entityLinker));
                }
            } else {
                const
                    keys = Object.keys(src),
                    {length} = keys;
        
                for (let i = 0; i < length; i++) {
                    const
                        key = keys[i];

                    setProperty(dest, key, formatProperty(src[key]));
                }
            }
        }
        
        return dest;
    },
    formatProperty = function (value) {
        if (typeof value === 'string') {
            //This is going to assume that if you pass in something that starts with a number, it is a number and converts it to one.
            // eslint-disable-next-line radix
            const
                numberProperty = parseFloat(value) ?? parseInt(value); // to handle floats and 0x respectively.

            if (numberProperty === 0 || (!!numberProperty)) {
                return numberProperty;
            } else if (value === 'true') {
                return true;
            } else if (value === 'false') {
                return false;
            } else if ((value.length > 1) && (((value[0] === '{') && (value[value.length - 1] === '}')) || ((value[0] === '[') && (value[value.length - 1] === ']')))) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                }
            }
        }

        return value;
    },
    formatPropertyObject = function ({name, value, type}, entityLinker) {
        switch (type) {
        case 'color':
            break;
        case 'object':
            if (entityLinker && value !== 0) {
                return entityLinker.getEntity(value, name); // if unfound, entityLinker saves this request and will try to fulfill it once the entity is added.
            } else {
                return null;
            }
        case 'string':
            if ((value.length > 1) && (((value[0] === '{') && (value[value.length - 1] === '}')) || ((value[0] === '[') && (value[value.length - 1] === ']')))) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                }
            }
            break;
        case 'bool':
        case 'float':
        case 'file':
        case 'int':
        default:
            break;
        }
        
        return value;
    },
    checkLevel = function (levelOrLevelId, ss) {
        const
            addObjectGroupAssets = (assets, objectGroup, tilesets) => {
                const objects = objectGroup.objects;

                for (let i = 0; i < objects.length; i++) {
                    const entity = getEntityData(objects[i], tilesets);
                    if (entity) {
                        const entityAssets = Entity.getAssetList(entity);
                        union(assets, entityAssets);
                        arrayCache.recycle(entityAssets);
                    }
                }
            },
            level = (typeof levelOrLevelId === 'string') ? platypus.game.settings.levels[levelOrLevelId] : levelOrLevelId,
            assets = arrayCache.setUp();

        if (level) {
            if (level.tilesets) {
                level.tilesets = importTilesetData(level.tilesets);
            }

            if (level.assets) { // Property added by a previous parse (so that this algorithm isn't run on the same level multiple times)
                union(assets, level.assets);
            } else if (level.layers) {
                for (let i = 0; i < level.layers.length; i++) {
                    const
                        layer = level.layers[i];

                    if (layer.type === 'objectgroup') {
                        addObjectGroupAssets(assets, layer, level.tilesets);
                    } else if (layer.type === 'imagelayer') {
                        // Check for custom layer entity
                        const
                            entityType = getProperty(layer.properties, 'entity');

                        if (entityType) {
                            const
                                data = Data.setUp('type', entityType, 'properties', mergeAndFormatProperties(layer.properties, {})),
                                arr = Entity.getAssetList(data);

                            union(assets, arr);
                            arrayCache.recycle(arr);
                            data.recycle();
                        } else {
                            union(assets, [layer.image]);
                        }
                    } else {
                        const
                            entityType = getProperty(level.layers[i].properties, 'entity'),
                            tiles = arrayCache.setUp();

                        // must decode first so we can check for tiles' objects
                        decodeLayer(layer);

                        // Check for relevant objectgroups in tileset
                        union(tiles, layer.data); // merge used tiles into one-off list
                        for (let j = 0; j < tiles.length; j++) {
                            const
                                id = maskId & tiles[j];
                                
                            for (let k = 0; k < level.tilesets.length; k++) {
                                const
                                    {tiles, firstgid} = level.tilesets[k];

                                if (tiles) {
                                    for (let l = 0; l < tiles.length; l++) {
                                        const
                                            tile = tiles[l];

                                        if (((tile.id + firstgid) === id) && tile.objectgroup) {
                                            addObjectGroupAssets(assets, tile.objectgroup);
                                        }
                                    }
                                }
                            }
                        }

                        // Check for custom layer entity
                        if (entityType) {
                            const
                                data = Data.setUp('type', entityType),
                                arr = Entity.getAssetList(data);

                            union(assets, arr);
                            arrayCache.recycle(arr);
                            data.recycle();
                        }
                    }
                }
                if (!ss) { //We need to load the tileset images since there is not a separate spriteSheet describing them
                    const
                        levelTilesets = level.tilesets,
                        tilesets = arrayCache.setUp();

                    for (let i = 0; i < levelTilesets.length; i++) {
                        const
                            tileset = levelTilesets[i];

                        if (tileset.image) {
                            tilesets.push(tileset.image);
                        } else {
                            const
                                tiles = tileset.tiles;

                            for (let j = 0; j < tiles.length; j++) {
                                const
                                    tile = tiles[j];

                                if (tile.image) {
                                    tilesets.push(tile.image);
                                }
                            }
                        }
                    }
                    union(assets, tilesets);
                    arrayCache.recycle(tilesets);
                }
                level.assets = greenSlice(assets); // Save for later in case this level is checked again.
            }
        }
        
        return assets;
    },
    // These are provided but can be overwritten by entities of the same name in the configuration.
    standardEntityLayers = {
        "render-layer": {
            "id": "render-layer",
            "components": [{
                "type": "RenderTiles",
                "spriteSheet": "import",
                "imageMap": "import",
                "entityCache": true
            }]
        },
        "collision-layer": {
            "id": "collision-layer",
            "components": [{
                "type": "CollisionTiles",
                "collisionMap": "import"
            }]
        },
        "image-layer": {
            "id": "image-layer",
            "components": [{
                "type": "RenderTiles",
                "spriteSheet": "import",
                "imageMap": "import"
            }]
        }
    },
    importTileset = function (tileset) {
        const
            source = platypus.game.settings.levels[getKey(tileset.source)],
            keys = Object.keys(source),
            {length} = keys;

        for (let i = 0; i < length; i++) {
            const
                key = keys[i];

            tileset[key] = source[key];
        }
        
        delete tileset.source; // We remove this so we never have to rerun this import. Note that we can't simply replace the tileset properties since the tileset's firstgid property may change from level to level.
        
        return tileset;
    },
    importTilesetData = function (tilesets) {
        for (let i = 0; i < tilesets.length; i++) {
            if (tilesets[i].source) {
                tilesets[i] = importTileset(tilesets[i]);
            }
        }
        
        return tilesets;
    };

export default createComponentClass(/** @lends platypus.components.TiledLoader.prototype */{
    id: 'TiledLoader',

    properties: {
        /**
         * This causes the entire map to be offset automatically by an order of magnitude higher than the height and width of the world so that the number of digits below zero is constant throughout the world space. This fixes potential floating point issues when, for example, 97 is added to 928.0000000000001 giving 1025 since a significant digit was lost when going into the thousands.
         *
         * @property offsetMap
         * @type Boolean
         * @default false
         */
        offsetMap: false,
        
        /**
         * If set to `true` and if the game is running in debug mode, this causes the collision layer to appear.
         *
         * @property showCollisionTiles
         * @type Boolean
         * @default false
         */
        showCollisionTiles: false,

        /**
         * If specified, the referenced images are used as the game sprite sheets instead of the images referenced in the Tiled map. This is useful for using different or better quality art from the art used in creating the Tiled map.
         *
         * @property images
         * @type Array
         * @default null
         */
        images: null,

        /**
         * Adds a number to each additional Tiled layer's z coordinate to maintain z-order. Defaults to 1000.
         *
         * @property layerIncrement
         * @type number
         * @default 1000
         */
        layerIncrement: 1000,

        /**
         * Keeps the tile maps in separate render layers. Default is 'false' to for better optimization.
         *
         * @property separateTiles
         * @type boolean
         * @default false
         */
        separateTiles: false,
        
        /**
         * If a particular sprite sheet should be used that's not defined by the level images themselves. This is useful for making uniquely-themed variations of the same level. This is overridden by `"spriteSheet": "import"` in the "render-layer" Entity definition, so be sure to remove that when setting this property.
         *
         * @property spriteSheet
         * @type String | Object
         * @default null
         */
        spriteSheet: null,

        /**
         * Whether to continue loading `lazyLoad` entities in the background after level starts regardless of camera position. If `false`, entities with a `lazyLoad` property will only load once within camera range.
         *
         * @property backgroundLoad
         * @type Boolean
         * @default true
         */
        backgroundLoad: true
    },

    publicProperties: {
        /**
         * Specifies the JSON level to load. Available on the entity as `entity.level`.
         *
         * @property level
         * @type String
         * @default null
         */
        level: null,

        /**
         * Can be "left", "right", or "center". Defines where entities registered X position should be when spawned. Available on the entity as `entity.entityPositionX`.
         *
         * @property entityPositionX
         * @type String
         * @default "center"
         */
        entityPositionX: "center",

        /**
         * Can be "top", "bottom", or "center". Defines where entities registered Y position should be when spawned. Available on the entity as `entity.entityPositionY`.
         *
         * @property entityPositionY
         * @type String
         * @default "bottom"
         */
        entityPositionY: "bottom",

        /**
         * Whether to wait for a "load-level" event before before loading. Available on the entity as `entity.manuallyLoad`.
         *
         * @property manuallyLoad
         * @type boolean
         * @default false
         */
        manuallyLoad: false,

        tileWidth: null,

        tileHeight: null
    },

    /**
     * This component is attached to a top-level entity and, once its peer components are loaded, ingests a JSON file exported from the [Tiled map editor](http://www.mapeditor.org/) and creates the tile maps and entities. Once it has finished loading the map, it removes itself from the list of components on the entity.
     *
     * This component requires an [EntityContainer](platypus.components.EntityContainer.html) since it calls `entity.addEntity()` on the entity, provided by `EntityContainer`.
     *
     * This component looks for the following entities, and if not found will load default versions:

            {
                "render-layer": {
                    "id": "render-layer",
                    "components":[{
                        "type": "RenderTiles",
                        "spriteSheet": "import",
                        "imageMap":    "import",
                        "entityCache": true
                    }]
                },
                "collision-layer": {
                    "id": "collision-layer",
                    "components":[{
                        "type": "CollisionTiles",
                        "collisionMap": "import"
                    }]
                },
                "image-layer": {
                    "id": "image-layer",
                    "components":[{
                        "type": "RenderTiles",
                        "spriteSheet": "import",
                        "imageMap":    "import"
                    }]
                }
            }

        * @memberof platypus.components
        * @uses platypus.Component
        * @constructs
        * @listens platypus.Entity#camera-update
        * @listens platypus.Entity#layer-loaded
        * @listens platypus.Entity#load-level
        * @listens platypus.Entity#tick
        * @fires platypus.Entity#world-loaded
        * @fires platypus.Entity#level-loading-progress
        */
    initialize: function () {
        this.assetCache = platypus.assetCache;
        this.layerZ = 0;
        this.followEntity = false;
        this.lazyLoads = arrayCache.setUp();
    },

    events: {
        "layer-loaded": function (persistentData, holds) {
            if (!this.manuallyLoad) {
                holds.count += 1;
                this.loadLevel({
                    level: this.level || persistentData.level,
                    persistentData: persistentData
                }, holds.release);
            }
        },

        "load-level": function (levelData, callback) {
            this.loadLevel(levelData, callback);
        }
    },

    methods: {
        createLayer: function (entityKind, rawLayer, offsetX, offsetY, tileWidth, tileHeight, tilesets, tilesetObjectGroups, images, combineRenderLayer, progress, entityLinker) {
            const
                //This builds in parallaxing support by allowing the addition of width and height properties into Tiled layers so they pan at a separate rate than other layers.
                checkParallax = ({data, height, properties, width}) => {
                    const
                        layerHeight = getProperty(properties, 'height'),
                        layerWidth = getProperty(properties, 'width'),
                        newWidth = layerWidth ? parseInt(layerWidth,  10) : width,
                        newHeight = layerHeight ? parseInt(layerHeight, 10) : height,
                        newData = (newWidth !== width || newHeight !== height) ? [] : data;

                    if (newData.length === 0) {
                        for (let x = 0; x < newWidth; x++) {
                            for (let y = 0; y < newHeight; y++) {
                                if ((x < width) && (y < height)) {
                                    newData[x + y * newWidth] = data[x + y * width];
                                } else {
                                    newData[x + y * newWidth] = 0;
                                }
                            }
                        }
                    }
                    
                    return {
                        width: newWidth,
                        height: newHeight,
                        data: newData
                    };
                },

                layer = decodeLayer(rawLayer),
                {
                    offsetx: layerOffsetX = 0,
                    offsety: layerOffsetY = 0,
                    properties: layerProperties,
                    tileheight: tHeight = tileHeight,
                    tilewidth: tWidth = tileWidth
                } = layer,
                {
                    data,
                    height,
                    width
                } = layerProperties ? checkParallax(layer) : layer,
                mapOffsetX = offsetX + layerOffsetX,
                mapOffsetY = offsetY + layerOffsetY,
                layerDefinition = JSON.parse(JSON.stringify(platypus.game.settings.entities[entityKind] ?? standardEntityLayers[entityKind])), //TODO: a bit of a hack to copy an object instead of overwrite values
                layerDefinitionProperties = layerDefinition.properties = layerDefinition.properties ?? {},
                {components} = layerDefinition,
                importAnimation = {},
                importCollision = [],
                importFrames = [],
                importRender = [],
                importSpriteSheet = {
                    images: (layer.image ? [layer.image] : images),
                    frames: importFrames,
                    animations: importAnimation
                },
                createFrames = function (frames, index, tileset) {
                    const
                        {image, tiles} = tileset;

                    if (image) {
                        const
                            {
                                columns = (((tileset.imagewidth / (tileset.tilewidth + tileset.spacing)) + (tileset.margin * 2 - tileset.spacing)) >> 0),
                                imageheight,
                                margin = 0,
                                spacing = 0,
                                tileheight,
                                tilewidth
                            } = tileset,
                            tileWidthHalf = tilewidth / 2,
                            tileHeightHalf = tileheight / 2,
                            tileWidthSpace = tilewidth + spacing,
                            tileHeightSpace = tileheight + spacing,
                            margin2 = margin * 2,
                            marginSpace = margin2 - spacing,
                            rows = /* Tiled tileset def doesn't seem to have rows */ (((imageheight / tileHeightSpace) + marginSpace) >> 0);
                        
                        for (let y = 0; y < rows; y++) {
                            for (let x = 0; x < columns; x++) {
                                frames.push([
                                    margin + x * tileWidthSpace,
                                    margin + y * tileHeightSpace,
                                    tilewidth,
                                    tileheight,
                                    index,
                                    tileWidthHalf,
                                    tileHeightHalf
                                ]);
                            }
                        }
                        index += 1;
                    } else if (tiles) {
                        for (let i = 0; i < tiles.length; i++) {
                            const
                                {imageheight, imagewidth} = tiles[i];

                            frames.push([
                                0,
                                0,
                                imageheight,
                                imagewidth,
                                index,
                                imageheight / 2,
                                imagewidth / 2
                            ]);
                            index += 1;
                        }
                    }

                    return index;
                };
            let index = 0,
                lastSet = null,
                renderTiles = false;
            
            entityLinker.linkObject(layerDefinitionProperties.tiledId = layer.id);

            if (layerProperties) {
                mergeAndFormatProperties(layerProperties, layerDefinitionProperties, entityLinker);
            }

            layerDefinitionProperties.width = tWidth * width;
            layerDefinitionProperties.height = tHeight * height;
            layerDefinitionProperties.columns = width;
            layerDefinitionProperties.rows = height;
            layerDefinitionProperties.tileWidth = tWidth;
            layerDefinitionProperties.tileHeight = tHeight;
            layerDefinitionProperties.scaleX = 1;
            layerDefinitionProperties.scaleY = 1;
            layerDefinitionProperties.layerZ = this.layerZ;
            layerDefinitionProperties.left = layerDefinitionProperties.x || mapOffsetX;
            layerDefinitionProperties.top = layerDefinitionProperties.y || mapOffsetY;
            layerDefinitionProperties.z = layerDefinitionProperties.z || this.layerZ;

            if (tilesets.length) {
                let imageIndex = 0;

                for (let x = 0; x < tilesets.length; x++) {
                    imageIndex = createFrames(importFrames, imageIndex, tilesets[x]);
                }

                lastSet = tilesets[tilesets.length - 1];
                {
                    const
                        tileTypes = lastSet.firstgid + lastSet.tilecount;

                    for (let x = -1; x < tileTypes; x++) {
                        importAnimation['tile' + x] = x;
                    }
                }
            }
            for (let x = 0; x < width; x++) {
                importCollision[x] = [];
                importRender[x] = [];
                for (let y = 0; y < height; y++) {
                    index = +data[x + y * width] - 1; // -1 from original src to make it zero-based.
                    importRender[x][y] = 'tile' + index;
                    index += 1; // So collision map matches original src indexes. Render (above) should probably be changed at some point as well. DDD 3/30/2016
                    importCollision[x][y] = index;

                    if (tilesetObjectGroups) {
                        const
                            transform = entityTransformCheck(index);

                        if (tilesetObjectGroups.has(transform.id)) {
                            const // These values cause a flipped tile to find x/y by starting on the opposite side of the tile (and subtracting x/y once in the called function).
                                offsetX = mapOffsetX + tileWidth * (transform.x > 0 ? x : x + 1),
                                offsetY = mapOffsetY + tileHeight * (transform.y > 0 ? y : y + 1);
                                
                            this.setUpEntities(tilesetObjectGroups.get(transform.id), offsetX, offsetY, tileWidth, tileHeight, tilesets, transform, progress, entityLinker);
                        }
                    }
                }
            }
            for (let x = 0; x < components.length; x++) {
                if (components[x].type === 'RenderTiles') {
                    renderTiles = components[x];
                }
                if (components[x].spriteSheet === 'import') {
                    components[x].spriteSheet = importSpriteSheet;
                } else if (components[x].spriteSheet) {
                    if (typeof components[x].spriteSheet === 'string' && platypus.game.settings.spriteSheets[components[x].spriteSheet]) {
                        components[x].spriteSheet = platypus.game.settings.spriteSheets[components[x].spriteSheet];
                    }
                    if (!components[x].spriteSheet.animations) {
                        components[x].spriteSheet.animations = importAnimation;
                    }
                }
                if (components[x].collisionMap === 'import') {
                    components[x].collisionMap = importCollision;
                }
                if (components[x].imageMap === 'import') {
                    components[x].imageMap = importRender;
                }
            }

            if ((entityKind === 'render-layer') && (!this.separateTiles) && (combineRenderLayer?.tileHeight === tHeight) && (combineRenderLayer?.tileWidth === tWidth) && (combineRenderLayer?.columns === width) && (combineRenderLayer?.rows === height)) {
                combineRenderLayer.triggerEvent('add-tiles', renderTiles);
                this.updateLoadingProgress(progress);
                return combineRenderLayer;
            } else {
                const
                    properties = {};

                if ((entityKind === 'render-layer') && this.spriteSheet) {
                    if (typeof this.spriteSheet === 'string') {
                        properties.spriteSheet = platypus.game.settings.spriteSheets[this.spriteSheet];
                    } else {
                        properties.spriteSheet = this.spriteSheet;
                    }
                    if (!properties.spriteSheet.animations) {
                        properties.spriteSheet.animations = importAnimation;
                    }
                }
                return entityLinker.linkEntity(this.owner.addEntity(new Entity(layerDefinition, {
                    properties
                }, this.updateLoadingProgress.bind(this, progress), this.owner)));
            }
        },
        
        convertImageLayer: function (imageLayer) {
            const
                {image, name, properties} = imageLayer,
                namedAsset = this.assetCache.get(name),
                imageId = namedAsset ? name : getKey(image),
                asset = namedAsset ?? this.assetCache.get(imageId) ?? null,
                repeat = getProperty(properties, 'repeat'),
                repeatX = getProperty(properties, 'repeat-x'),
                repeatY = getProperty(properties, 'repeat-y'),
                height = +(repeatY ?? repeat ?? 1),
                width = +(repeatX ?? repeat ?? 1),
                dataCells = width * height,
                tileheight = asset?.height ?? 1,
                tilewidth = asset?.width ?? 1,
                tileLayer = {
                    ...imageLayer,
                    data: Array(dataCells).fill(1),
                    image: asset ? imageId : image,
                    height,
                    type: 'tilelayer',
                    width,
                    tileheight,
                    tilewidth,
                    properties
                };

            if (!asset) { // Prefer to have name in tiled match image id in game
                platypus.debug.warn(`Component TiledLoader: Cannot find the "${name}" sprite sheet. Add it to the list of assets in config.json and give it the id "${name}".`);
            }

            tileLayer.tileset = {
                columns: 1,
                image: tileLayer.image,
                imageheight: tileheight,
                imagewidth: tilewidth,
                margin: 0,
                name,
                spacing: 0,
                tilecount: 1,
                tileheight,
                tilewidth,
                type: "tileset"
            };
            
            return tileLayer;
        },
        
        loadLevel: function (levelData, callback) {
            const
                {assetCache, offsetMap, owner} = this,
                entityLinker = EntityLinker.setUp(),
                images = this.images ? greenSlice(this.images) : arrayCache.setUp(),
                level = (typeof levelData.level === 'string') ? platypus.game.settings.levels[levelData.level] : levelData.level, //format level appropriately
                layers = level.layers,
                progress = Data.setUp('count', 0, 'progress', 0, 'total', 0),
                tilesetObjectGroups = DataMap.setUp(),
                tilesets = importTilesetData(level.tilesets),
                tileWidth = this.tileWidth = level.tilewidth,
                tileHeight = this.tileHeight = level.tileheight,
                height = level.height * tileHeight,
                width = level.width * tileWidth,
                x = offsetMap ? getPowerOfTen(width) : 0,
                y = offsetMap ? getPowerOfTen(height) : 0;
            let layer = null;

            createTilesetObjectGroupReference(tilesetObjectGroups, tilesets);

            if (level.properties) {
                entityLinker.linkObject(owner.tiledId = 0); // Level
                mergeAndFormatProperties(level.properties, owner, entityLinker);
                entityLinker.linkEntity(owner);
            }
            
            if (images.length === 0) {
                const
                    addImage = ({image}) => {
                        const
                            imageKey = getKey(image),
                            asset = assetCache.get(imageKey);

                        if (asset) { // Prefer to have name in tiled match image id in game
                            images.push(imageKey);
                        } else {
                            platypus.debug.warn('Component TiledLoader: Cannot find the "' + imageKey + '" sprite sheet. Add it to the list of assets in config.json and give it the id "' + imageKey + '".');
                            images.push(image);
                        }
                    };

                for (let i = 0; i < tilesets.length; i++) {
                    const
                        tileset = tilesets[i];

                    if (tileset.image) {
                        addImage(tileset);
                    } else {
                        tileset.tiles.forEach(addImage);
                    }
                }
            }
            
            progress.total = layers.length;

            this.finishedLoading = () => {
                const
                    message = Data.setUp(
                        "level", null,
                        "world", AABB.setUp(),
                        "tile", AABB.setUp(),
                        "camera", null,
                        "lazyLoads", this.lazyLoads
                    ),
                    lazyLoad = (entity) => {
                        const
                            aabb = entity.aabb,
                            entityLinker = entity.entityLinker;
    
                        aabb.recycle();
                        entity.aabb = null;
                        entity.entityLinker = null;
                        entityLinker.linkEntity(owner.addEntity(entity));
                    };
    
                this.lazyLoads.sort((a, b) => b.aabb.left - a.aabb.left); // Maybe a smidge faster since we can cut out once it's too far to the right.
    
                /**
                 * Once finished loading the map, this message is triggered on the entity to notify other components of completion.
                 *
                 * @event platypus.Entity#world-loaded
                 * @param message {platypus.Data} World data.
                 * @param message.level {Object} The Tiled level data used to load the level.
                 * @param message.width {number} The width of the world in world units.
                 * @param message.height {number} The height of the world in world units.
                 * @param message.tile {platypus.AABB} Dimensions of the world tiles.
                 * @param message.world {platypus.AABB} Dimensions of the world.
                 * @param message.camera {platypus.Entity} If a camera property is found on one of the loaded entities, this property will point to the entity on load that a world camera should focus on.
                 * @param message.lazyLoads {Array} List of objects representing entity definitions that will await camera focus before generating actual entities.
                 */
                message.level = level;
                message.camera = this.followEntity; // TODO: in 0.9.0 this should probably be removed, using something like "child-entity-added" instead. Currently this is particular to TiledLoader and Camera and should be generalized. - DDD 3/15/2016
                message.width = width;
                message.height = height;
                message.world.setBounds(x, y, x + width, y + height);
                message.tile.setBounds(0, 0, tileWidth, tileHeight);
                owner.triggerEvent('world-loaded', message);
                message.world.recycle();
                message.tile.recycle();
                message.recycle();
                
                if (this.lazyLoads.length) {
                    this.addEventListener("camera-update", (camera) => {
                        const
                            lazyLoads = this.lazyLoads,
                            viewport = AABB.setUp(camera.viewport);
                        let i = lazyLoads.length;
    
                        viewport.resize(viewport.width * 1.5, viewport.height * 1.5);
    
                        while (i--) {
                            const entity = lazyLoads[i],
                                aabb = entity.aabb;
    
                            if (viewport.intersects(aabb)) {
                                lazyLoad(entity);
                                for (let j = i + 1; j < lazyLoads.length; j++) {
                                    lazyLoads[j - 1] = lazyLoads[j];
                                }
                                lazyLoads.length -= 1;
                            } else if (aabb.left > viewport.right) { // we're at the end of viable aabb's
                                break;
                            }
                        }
                    });
                    if (this.backgroundLoad) {
                        this.addEventListener('tick', function () {
                            const
                                lazyLoads = this.lazyLoads,
                                i = lazyLoads.length;
    
                            if (i) {
                                lazyLoad(lazyLoads.pop(i - 1));
                            }
                        });
                    }
                } else {
                    owner.removeComponent(this);
                }
    
                if (callback) {
                    callback();
                }
            };

            for (let i = 0; i < layers.length; i++) {
                const
                    layerDefinition = layers[i];

                switch (layerDefinition.type) {
                case 'imagelayer':
                    layer = this.convertImageLayer(layerDefinition);
                    layer = this.createLayer(getProperty(layer.properties, 'entity') || 'image-layer', layer, x, y, layer.tilewidth, layer.tileheight, [layer.tileset], null, images, layer, progress, entityLinker);
                    break;
                case 'objectgroup':
                    this.setUpEntities(layerDefinition, x, y, tileWidth, tileHeight, tilesets, null, progress, entityLinker);
                    layer = null;
                    this.updateLoadingProgress(progress);
                    break;
                case 'tilelayer':
                    layer = this.setupLayer(layerDefinition, layer, x, y, tileWidth, tileHeight, tilesets, tilesetObjectGroups, images, progress, entityLinker);
                    break;
                default:
                    platypus.debug.warn('Component TiledLoader: Platypus does not support Tiled layers of type "' + layerDefinition.type + '". This layer will not be loaded.');
                    this.updateLoadingProgress(progress);
                }
                this.layerZ += this.layerIncrement;
            }

            tilesetObjectGroups.recycle();
        },
        
        setUpEntities: (function () {
            const
                tBoth = function (point) {
                    return Data.setUp('x', -point.x, 'y', -point.y);
                },
                tNone = function (point) {
                    return Data.setUp('x', point.x, 'y', point.y);
                },
                tX = function (point) {
                    return Data.setUp('x', -point.x, 'y', point.y);
                },
                tY = function (point) {
                    return Data.setUp('x', point.x, 'y', -point.y);
                },
                transformPoints = function (points, transformX, transformY) {
                    const
                        arr = arrayCache.setUp(),
                        reverseCycle = transformX ^ transformY,
                        transform = transformX ? transformY ? tBoth : tX : transformY ? tY : tNone;

                    if (reverseCycle) {
                        let i = points.length;
                        while (i--) {
                            arr.push(transform(points[i]));
                        }
                        arr.unshift(arr.pop()); // so the same point is at the beginning.
                    } else {
                        for (let i = 0; i < points.length; i++) {
                            arr.push(transform(points[i]));
                        }
                    }

                    return arr;
                },
                getPolyShape = function (type, points, transformX, transformY, decomposed) {
                    const
                        shape = {
                            type: type,
                            points: transformPoints(points, transformX, transformY)
                        };

                    if (decomposed) {
                        const decomposedPoints = [];
                        let p = 0;

                        for (p = 0; p < decomposed.length; p++) {
                            decomposedPoints.push(transformPoints(decomposed[p], transformX, transformY));
                        }

                        shape.decomposedPolygon = decomposedPoints;
                    }

                    return shape;
                };

            return function (layer, offsetX, offsetY, tileWidth, tileHeight, tilesets, transform, progress, entityLinker) {
                const
                    clamp = 1000,
                    {
                        objects,
                        offsetx: layerOffsetX = 0,
                        offsety: layerOffsetY = 0,
                        properties: layerProperties
                    } = layer,
                    mapOffsetX = offsetX + layerOffsetX,
                    mapOffsetY = offsetY + layerOffsetY,
                    len = objects.length;

                progress.total += len;

                for (let obj = 0; obj < len; obj++) {
                    const
                        entity = objects[obj],
                        entityData = getEntityData(entity, tilesets, entityLinker);
                    
                    if (entityData) {
                        const
                            {polygon, polyline, rotation} = entity,
                            {
                                gid = -1,
                                type: entityType,
                                properties
                            } = entityData,
                            entityPackage = {
                                properties
                            },
                            entityDefinition = platypus.game.settings.entities[entityType],
                            entityDefProps = entityDefinition?.properties ?? null,
                            transformX = transform?.x ?? 1,
                            transformY = transform?.y ?? 1;
                            
                        entityPackage[entityDefinition ? 'type' : 'id'] = entityType;

                        if (polygon || polyline) {
                            //Figuring out the width of the polygon and shifting the origin so it's in the top-left.
                            const
                                polyPoints = polygon ?? polyline; 
                            let smallestX = Infinity,
                                largestX = -Infinity,
                                smallestY = Infinity,
                                largestY = -Infinity;

                            for (let x = 0; x < polyPoints.length; x++) {
                                if (polyPoints[x].x > largestX) {
                                    largestX = polyPoints[x].x;
                                }
                                if (polyPoints[x].x < smallestX) {
                                    smallestX = polyPoints[x].x;
                                }
                                if (polyPoints[x].y > largestY) {
                                    largestY = polyPoints[x].y;
                                }
                                if (polyPoints[x].y < smallestY) {
                                    smallestY = polyPoints[x].y;
                                }
                            }
                            properties.width = largestX - smallestX;
                            properties.height = largestY - smallestY;
                            properties.x = entity.x + mapOffsetX;
                            properties.y = entity.y + mapOffsetY;

                            if (polygon) {
                                properties.shape = getPolyShape('polygon', polyPoints, transformX === -1, transformY === -1, properties.decomposedPolygon);
                            } else if (polyline) {
                                properties.shape = getPolyShape('polyline', polyPoints, transformX === -1, transformY === -1, null);
                            }

                            if (rotation) {
                                properties.rotation = rotation;
                            }
                        } else {
                            const
                                {point} = entity,
                                entityPositionX = getProperty(layerProperties, 'entityPositionX') ?? this.entityPositionX,
                                entityPositionY = getProperty(layerProperties, 'entityPositionY') ?? this.entityPositionY,
                                width = properties.width = entityDefProps?.width ?? entity.width ?? (point ? 0 : tileWidth),
                                height = properties.height = entityDefProps?.height ?? entity.height ?? (point ? 0 : tileHeight),
                                widthOffset = entityDefProps?.width ? tileWidth : (point ? 0 : width),
                                heightOffset = entityDefProps?.height ? tileHeight : (point ? 0: height);

                            properties.x = entity.x;
                            properties.y = entity.y;

                            if (entity.rotation) {
                                const
                                    w = properties.width / 2,
                                    h = properties.height / 2;

                                properties.rotation = entity.rotation;

                                if (w || h) {
                                    const
                                        a = ((entity.rotation / 180) % 2) * Math.PI,
                                        v = Vector.setUp(w, -h).rotate(a);

                                    properties.x = Math.round((properties.x + v.x - w) * clamp) / clamp;
                                    properties.y = Math.round((properties.y + v.y + h) * clamp) / clamp;
                                    v.recycle();
                                }
                            }

                            if (entityPositionX === 'left') {
                                properties.regX = 0;
                            } else if (entityPositionX === 'center') {
                                properties.regX = properties.width / 2;
                                properties.x += widthOffset / 2;
                            } else if (entityPositionX === 'right') {
                                properties.regX = properties.width;
                                properties.x += widthOffset;
                            }
                            properties.x = mapOffsetX + properties.x * transformX;

                            if (gid === -1) {
                                properties.y += properties.height;
                            }
                            if (entityPositionY === 'bottom') {
                                properties.regY = properties.height;
                            } else if (entityPositionY === 'center') {
                                properties.regY = properties.height / 2;
                                properties.y -= heightOffset / 2;
                            } else if (entityPositionY === 'top') {
                                properties.regY = 0;
                                properties.y -= heightOffset;
                            }
                            properties.y = mapOffsetY + properties.y * transformY;

                            if (entity.ellipse) {
                                properties.shape = {};
                                properties.shape.type = 'circle';//'ellipse';
                                properties.shape.width = properties.width;
                                properties.shape.height = properties.height;

                                // Tiled has ellipses, but Platypus only accepts circles. Setting a radius based on the average of width and height in case a non-circular ellipse is imported.
                                properties.shape.radius = (properties.width + properties.height) / 4;
                            } else if (entity.width && entity.height) {
                                properties.shape = {};
                                properties.shape.type = 'rectangle';
                                properties.shape.width = properties.width;
                                properties.shape.height = properties.height;
                            }
                        }

                        if (entityDefProps) {
                            properties.scaleX *= (entityDefProps.scaleX || 1);
                            properties.scaleY *= (entityDefProps.scaleY || 1);
                        }
                        properties.scaleX *= transformX;
                        properties.scaleY *= transformY;
                        properties.layerZ = this.layerZ;

                        //Setting the z value. All values are getting added to the layerZ value.
                        if (properties.z) {
                            properties.z += this.layerZ;
                        } else if (entityDefProps && (typeof entityDefProps.z === 'number')) {
                            properties.z = this.layerZ + entityDefProps.z;
                        } else {
                            properties.z = this.layerZ;
                        }

                        if (properties.lazyLoad || (entityDefProps && entityDefProps.lazyLoad)) {
                            entityPackage.aabb = AABB.setUp(properties.x + properties.width / 2 - properties.regX, properties.y + properties.height / 2 - properties.regY, properties.width || 1, properties.height || 1);
                            entityPackage.entityLinker = entityLinker;
                            this.lazyLoads.push(entityPackage);
                            this.updateLoadingProgress(progress);
                        } else {
                            const
                                createdEntity = this.owner.addEntity(entityPackage, this.updateLoadingProgress.bind(this, progress));
                            
                            entityLinker.linkEntity(createdEntity);

                            if (createdEntity && createdEntity.camera) {
                                this.followEntity = {
                                    entity: createdEntity,
                                    mode: createdEntity.camera
                                }; //used by camera
                            }
                        }
                    } else {
                        this.updateLoadingProgress(progress);
                    }
                }
            };
        }()),

        setupLayer: function (layer, combineRenderLayer, mapOffsetX, mapOffsetY, tileWidth, tileHeight, tilesets, tilesetObjectGroups, images, progress, entityLinker) {
            const
                entity = getProperty(layer.properties, 'entity') ?? 'render-layer', // default
                entityDefinition = platypus.game.settings.entities[entity] ?? standardEntityLayers[entity];
            let canCombine = false;
            
            // Need to check whether the entity can be combined for optimization. This combining of tile layers might be a nice addition to the compilation tools so it's not happening here.
            if (entityDefinition) {
                let i = entityDefinition.components.length;
                
                while (i--) {
                    if (entityDefinition.components[i].type === "RenderTiles") {
                        canCombine = true;
                        break;
                    }
                }
            }

            if (canCombine) {
                return this.createLayer(entity, layer, mapOffsetX, mapOffsetY, tileWidth, tileHeight, tilesets, tilesetObjectGroups, images, combineRenderLayer, progress, entityLinker);
            } else {
                this.createLayer(entity, layer, mapOffsetX, mapOffsetY, tileWidth, tileHeight, tilesets, tilesetObjectGroups, images, combineRenderLayer, progress, entityLinker);
                return null;
            }
        },
        
        updateLoadingProgress: function (progress) {
            progress.count += 1;
            progress.progress = progress.count / progress.total;

            /**
             * As a level is loaded, this event is triggered to show progress.
             *
             * @event platypus.Entity#level-loading-progress
             * @param message {platypus.Data} Contains progress data.
             * @param message.count {Number} The number of loaded entities.
             * @param message.progress {Number} A fraction of count / total.
             * @param message.total {Number} The total number of entities being loaded by this component.
             */
            this.owner.triggerEvent('level-loading-progress', progress);

            if (progress.count === progress.total) {
                progress.recycle();
                this.finishedLoading();
            }
        },

        destroy: function () {
            arrayCache.recycle(this.lazyLoads);
            this.lazyLoads = null;
        }
    },
    
    getAssetList: function (definition, props, defaultProps, data) {
        const
            ss = definition?.spriteSheet ?? props?.spriteSheet ?? defaultProps?.spriteSheet,
            images = definition?.images ?? props?.images ?? defaultProps?.images,
            assets = checkLevel(data?.level ?? definition?.level ?? props?.level ?? defaultProps?.level, ss);
        
        if (ss) {
            if (typeof ss === 'string') {
                union(assets, platypus.game.settings.spriteSheets[ss].images);
            } else {
                union(assets, ss.images);
            }
        }
        
        if (images) {
            union(assets, images);
        }
        
        return assets;
    }
});

