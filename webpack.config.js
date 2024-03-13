const
    path = require('path'),
    webpack = require('webpack');
    
module.exports = env => {
    const
        mode = env.dev ? 'development' : 'production';

    return {
        entry: './src/index.js',
        mode,
        output: {
            path: path.resolve(__dirname, 'lib'),
            filename: 'platypus.js',
            library: 'platypus'
        },
        externals: {
            "@tweenjs/tween.js": "@tweenjs/tween.js",
            "@pixi/sound": "@pixi/sound",
            "@pixi/spine-pixi": "@pixi/spine-pixi",
            "pixi.js": "pixi.js",
            "springroll": "springroll"
        }
    };
};