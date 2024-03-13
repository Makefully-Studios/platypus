/**
 * This class is instantiated by Platypus at `platypus.assetCache` to track assets: loading assets needed for particular layers and unloading assets once they're no longer needed.
 *
 * @memberof platypus
 * @class AssetManager
**/
/* global platypus, setTimeout */
import Data from './Data.js';
import DataMap from './DataMap.js';
import {Assets} from 'pixi.js';
import {arrayCache} from './utils/array.js';

const
    fn = /^(?:\w+:\/{2}\w+(?:\.\w+)*\/?)?(?:[\/.]*?(?:[^?]+)?\/)?(?:([^\/?]+?)(?:\.(\w+|{\w+(?:,\w+)*}))?)(?:\?\S*)?$/,
    formatAsset = function (asset) { //TODO: Make this behavior less opaque.
        const
            path = asset.src ?? asset,
            match = path.match(fn);
            
        if (asset.id) {
            platypus.debug.warn(`AssetManager: Use "alias" instead of "id" for asset identification. (${asset.id})`);
        }

        return Data.setUp(
            'alias', asset.alias ?? [asset.id ?? (match ? match[1] : path)],
            'src', path,
            'data', asset.data ?? null
        );
    };

export default class AssetManager {
    constructor () {
        this.assets = DataMap.setUp();
        this.counts = Data.setUp();
    }

    /**
     * This method removes an asset from memory if it's the last needed instance of the asset.
     *
     * @method platypus.AssetManager#delete
     * @param {*} alias
     * @return {Boolean} Returns `true` if asset was removed from asset cache.
     */
    delete (alias) {
        const assets = this.assets;

        if (assets.has(alias)) {
            const counts = this.counts;

            counts[alias] -= 1;
            if (counts[alias] === 0) {
                const asset = assets.get(alias);
                
                if (asset && asset.src) {
                    asset.src = '';
                }
                assets.delete(alias);
            }

            return !counts[alias];
        } else {
            return false;
        }
    }

    /**
     * Returns a loaded instance of a given asset.
     *
     * @method platypus.AssetManager#get
     * @param {*} alias
     * @return {Object} Returns the asset if defined.
     */
    get (alias) {
        return this.assets.get(alias);
    }

    /**
     * Returns alias for given path.
     *
     * @method platypus.AssetManager#getFileId
     * @param {*} path
     * @return {String} Returns alias generated from path.
     */
    getFileId (path) {
        const match = path.match(fn);

        return match ? match[1] : path;
    }

    /**
     * Returns whether a given asset is currently loaded by the AssetManager.
     *
     * @method platypus.AssetManager#has
     * @param {*} alias
     * @return {Object} Returns `true` if the asset is loaded and `false` if not.
     */
    has (alias) {
        return this.assets.has(alias);
    }

    /**
     * Sets a mapping between an alias and a loaded asset. If the mapping already exists, simply increment the count for a given alias.
     *
     * @method platypus.AssetManager#set
     * @param {*} alias
     * @param {*} value The loaded asset.
     * @param {Number} count The number of assets needed.
     */
    set (alias, value, count = 1) {
        const
            assets = this.assets,
            counts = this.counts;

        if (assets.has(alias)) {
            counts[alias] += count;
        } else {
            assets.set(alias, value);
            counts[alias] = count;
        }
    }

    /**
     * Loads a list of assets.
     *
     * @method platypus.AssetManager#load
     * @param {Array} list A list of assets to load.
     * @param {Function} one This function is called as each asset is loaded.
     * @param {Function} all This function is called once all assets in the list are loaded.
     */
    async load (list, one, all) {
        const
            counts = this.counts,
            needsLoading = arrayCache.setUp(),
            adds = Data.setUp();

        if (platypus.game?.options?.images ?? platypus.game?.options?.audio) {
            platypus.debug.warn('AssetManager: Default asset folders are no longer specified via game options. Include pathing in asset imports.');
        }

        // work-around for Pixi v7 Spine PMA issue https://github.com/pixijs/pixijs/issues/9141
        Assets.setPreferences({
            preferCreateImageBitmap: false,
            preferWorker: false
        });

        for (let i = 0; i < list.length; i++) {
            const
                item = formatAsset(list[i]),
                alias = item.alias?.[0] ?? item.id ?? item.src ?? item;

            if (this.has(alias)) {
                counts[alias] += 1;
            } else if (adds.hasOwnProperty(alias)) {
                adds[alias] += 1;
            } else {
                adds[alias] = 1;
                needsLoading.push(item);
            }
        }

        if (needsLoading.length) {
            // Do this first to pass `data` property if needed
            needsLoading.forEach((asset) => Assets.add(asset));

            const
                aliases = needsLoading.map((asset) => asset.alias[0]),
                loadedList = await Assets.load(aliases, one);

            aliases.forEach((alias) => {
                const
                    response = loadedList[alias];

                this.set(alias, response, adds[alias]);
            });

            if (all) {
                all();
            }
        } else {
            setTimeout(() => { // To run in same async sequence as above.
                if (one) {
                    one(1);
                }
                if (all) {
                    all();
                }
            }, 1);
        }

        arrayCache.recycle(needsLoading);
    }

    /**
     * Unloads a list of assets. This is identical to passing each item in the list to `.delete()`.
     *
     * @method platypus.AssetManager#unload
     * @param {Array} list A list of assets to unload.
     */
    unload (list) {
        let i = list.length;

        while (i--) {
            this.delete(list[i].alias?.[0] ?? list[i].id ?? list[i]);
        }
    }
}
