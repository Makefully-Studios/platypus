const path = require('path');

module.exports = (env, argv) => {
    const
        mode = argv.mode || 'production';

    return {
        entry: './src/index.js',
        mode,
        output: {
            path: path.resolve(__dirname, 'lib'),
            filename: 'platypus.js',
            clean: true,
            library: {
                name: 'platypus',
                type: 'umd',
                umdNamedDefine: true
            },
            globalObject: 'typeof self !== \'undefined\' ? self : this'
        },
        devtool: mode === 'development' ? 'source-map' : false,
        devServer: {
            static: {
                directory: path.join(__dirname, '.')
            },
            hot: true
        },
        externals: {
            '@esotericsoftware/spine-pixi-v8': '@esotericsoftware/spine-pixi-v8',
            '@tweenjs/tween.js': '@tweenjs/tween.js',
            '@pixi/sound': '@pixi/sound',
            'pixi.js': 'pixi.js',
            springroll: 'springroll'
        }
    };
};
