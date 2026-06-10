const fs = require('fs');
const path = require('path');

class CopyPlatypusCssPlugin {
    apply (compiler) {
        compiler.hooks.afterEmit.tap('CopyPlatypusCssPlugin', (compilation) => {
            const
                from = path.join(__dirname, 'src/platypus.css'),
                to = path.join(compilation.outputOptions.path, 'platypus.css');

            fs.copyFileSync(from, to);
        });
    }
}

const
    externals = {
        '@esotericsoftware/spine-pixi-v8': '@esotericsoftware/spine-pixi-v8',
        '@tweenjs/tween.js': '@tweenjs/tween.js',
        '@pixi/sound': '@pixi/sound',
        'pixi.js': 'pixi.js',
        springroll: 'springroll'
    },
    shared = {
        entry: './src/index.js',
        devServer: {
            static: {
                directory: path.join(__dirname, '.')
            },
            hot: true
        },
        externals,
        plugins: [
            new CopyPlatypusCssPlugin()
        ]
    };

module.exports = (env, argv) => {
    const
        mode = argv.mode || 'production',
        devtool = mode === 'development' ? 'source-map' : false;

  return [
        {
            ...shared,
            name: 'umd',
            mode,
            devtool,
            output: {
                path: path.resolve(__dirname, 'lib'),
                filename: 'platypus.js',
                library: {
                    name: 'platypus',
                    type: 'umd',
                    umdNamedDefine: true
                },
                globalObject: 'typeof self !== \'undefined\' ? self : this'
            }
        },
        {
            ...shared,
            name: 'esm',
            mode,
            devtool,
            experiments: {
                outputModule: true
            },
            output: {
                path: path.resolve(__dirname, 'lib'),
                filename: 'platypus.mjs',
                chunkFilename: '[id].platypus.mjs',
                library: {
                    type: 'module'
                },
                module: true,
                chunkFormat: 'module',
                environment: {
                    module: true
                }
            },
            externalsType: 'module'
        }
    ];
};
