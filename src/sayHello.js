/* global console, document, platypus */
import {VERSION as pixiVersion} from 'pixi.js';
import {arrayCache} from './utils/array.js';

const
    getPortion = (num, min, max) => Math.floor(num * min / max),
    getStyle = (title, version) => {
        const
            min = 204,
            A = 65,
            v = version?.split?.('.'),
            useVersion = v?.length >= 3,
            r = useVersion ? parseInt(v[0], 10) : (title.charCodeAt(0) || A) - A,
            g = useVersion ? parseInt(v[1], 10) : (title.charCodeAt(1) || A) - A,
            b = useVersion ? parseInt(v[2], 10) : (title.charCodeAt(2) || A) - A,
            max = Math.max(r, g, b, 1);

        return `color: #ffffff; line-height: 1.5em; border-radius: 6px; background-color: rgb(${getPortion(r, min, max)},${getPortion(g, min, max)},${getPortion(b, min, max)});`;
    },
    getVersions = (arr) => arr.reduce((arr, str) => {
        arr.push(getStyle(str, str.substr(str.lastIndexOf(' ') - str.length + 1)), 'line-height: 1.5em;');
        return arr;
    }, []);

export default function (app) {
    const
        {options = {}} = app,
        {version = '(?)'} = options,
        docAuth = document.getElementsByName('author')?.[0]?.getAttribute('content') ?? '',
        author = docAuth ? `by ${docAuth}` : '',
        title = `${options.name ?? app.name ?? document.title ?? ''}${version ? ` ${version}` : ''}`,
        using = arrayCache.setUp(),
        {springroll, supports} = platypus;
    
    if (springroll) {
        using.push('SpringRoll ' + springroll.version);
    }
    
    using.push('Pixi.js ' + pixiVersion);
    
    if (supports.firefox || supports.chrome) {
        console.log(`%c ${title} %c ${author}`, getStyle(title, title.substr(title.lastIndexOf(' ') - title.length + 1)), 'line-height: 1.5em;');
        using.push(`Platypus ${platypus.version}`);
        console.log(`Using %c ${using.join(' %c %c ')} %c `, ...getVersions(using));
    } else {
        console.log(`--- "${title}" ${author} - Using ${using.join(', ')}, and Platypus ${platypus.version} ---`);
    }

    arrayCache.recycle(using);
};
