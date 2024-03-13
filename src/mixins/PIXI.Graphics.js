/**
 * This adds support for a tiny API to PIXI.Graphics similar to the CreateJS Graphics API. This is used for backwards support for RenderSprite masks.
 */
import {Graphics} from 'pixi.js';

export default (function () {
    var gfx = Graphics.prototype;
    
    gfx.a  = gfx.a  || gfx.arc;
    gfx.at = gfx.at || gfx.arcTo;
    gfx.bt = gfx.bt || gfx.bezierCurveTo;
    gfx.c  = gfx.c  || gfx.clear;
    gfx.dc = gfx.dc || gfx.circle;
    gfx.de = gfx.de || gfx.ellipse;
    gfx.dr = gfx.dr || gfx.rect;
    gfx.ef = gfx.ef || gfx.endFill;
    gfx.f  = gfx.f  || gfx.beginFill;
    gfx.lt = gfx.lt || gfx.lineTo;
    gfx.mt = gfx.mt || gfx.moveTo;
    gfx.qt = gfx.qt || gfx.quadraticCurveTo;
    gfx.r  = gfx.r  || gfx.rect;
    gfx.rr = gfx.rr || gfx.roundRect;
    
    /* Other CreateJS shortcuts that are unsupported by PIXI
    gfx.cp
    gfx.lf
    gfx.rf
    gfx.bf
    gfx.ss
    gfx.sd
    gfx.s
    gfx.ls
    gfx.rs
    gfx.bs
    gfx.es
    gfx.rc
    gfx.dp
    gfx.p
    */
    
} ());