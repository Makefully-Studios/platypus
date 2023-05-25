/* eslint-disable sort-imports */
/**
 * @namespace window
 */
/**
 * @namespace platypus
 */
/* global global, navigator, window */

import AssetManager from './AssetManager.js';
import {Debugger} from 'springroll';
import Game from './Game.js';
import createComponentClass from './factory.js';
import pkg from '../package.json';
import * as components from './components/index.js';

export * from './utils/array.js';
export * from './utils/string.js';
export {default as recycle} from 'recycle';

// Classes
export {default as AABB} from './AABB.js';
export {default as ActionState} from './ActionState.js';
export {Application as Application} from 'springroll';
export {default as Async} from './Async.js';
export {default as CollisionData} from './CollisionData.js';
export {default as CollisionDataContainer} from './CollisionDataContainer.js';
export {default as CollisionShape} from './CollisionShape.js';
export {default as Component} from './Component.js';
export {default as Data} from './Data.js';
export {default as DataMap} from './DataMap.js';
export {default as Entity} from './Entity.js';
export {default as Game} from './Game.js';
export {default as Messenger} from './Messenger.js';
export {default as PIXIAnimation} from './PIXIAnimation.js';
export {default as RandomSet} from './RandomSet.js';
export {default as StateMap} from './StateMap.js';
export {default as Vector} from './Vector.js';

// Component creator
export {default as createComponentClass} from './factory.js';

const
    platypus = global.platypus = {
        createComponentClass,
        components
    },
    debugWrapper = Debugger ? function (method, ...args) {
        if (platypus.game?.settings?.debug) {
            Debugger.log(method, ...args);
        }
    } : function (method, ...args) {
        if (platypus.game?.settings?.debug) {
            window.console[method](...args);
        }
    },
    uagent    = navigator.userAgent.toLowerCase(),
    isEdge    = (uagent.search('edge')    > -1),
    isIPod    = (uagent.search('ipod')    > -1),
    isIPhone  = (uagent.search('iphone')  > -1),
    isIPad    = (uagent.search('ipad')    > -1),
    isAndroid = (uagent.search('android') > -1),
    isSilk    = (uagent.search('silk')    > -1),
    isIOS     = isIPod || isIPhone  || isIPad,
    isMobile  = isIOS  || isAndroid || isSilk;

/**
 * This is an object of boolean key/value pairs describing the current browser's properties.
 * @property supports
 * @type Object
 **/
platypus.supports = {
    touch: (window.ontouchstart !== 'undefined'),
    edge: isEdge,
    iPod: isIPod,
    iPhone: isIPhone,
    iPad: isIPad,
    safari: (uagent.search('safari')  > -1) && !isEdge,
    ie: (uagent.search('msie')    > -1) || (uagent.search('trident') > -1),
    firefox: (uagent.search('firefox') > -1),
    android: isAndroid,
    chrome: (uagent.search('chrome')  > -1) && !isEdge,
    silk: isSilk,
    iOS: isIOS,
    mobile: isMobile,
    desktop: !isMobile
};

/**
 * This method defines platypus.debug and uses springroll.Debug if available. If springroll.Debug is not loaded, platypus.debug provides inactive stubs for console methods.
 *
 * @property debug
 * @type Object
 */
platypus.debug = {
    general: debugWrapper.bind(null, 'log'),
    log: debugWrapper.bind(null, 'log'),
    warn: debugWrapper.bind(null, 'warn'),
    debug: debugWrapper.bind(null, 'debug'),
    error: debugWrapper.bind(null, 'error')
};

platypus.assetCache = new AssetManager();

/**
 * The version string for this release.
 * @property version
 * @type String
 * @static
 **/
platypus.version = pkg.version;

platypus.Game = Game;

export {components};
export default platypus;
