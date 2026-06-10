[![Platypus](./assets/platypus-title.png)](https://github.com/Makefully-Studios/platypus)
========

2D tile based game framework in HTML5

The Platypus Engine allows rapid development of 2D orthogonal tile based games for deployment in HTML5 compatible browsers. The engine uses a component based model, and includes many ready to use components to allow users to start adding assets and editing levels right away. The component based model lends itself to community members adding new functionality, we hope you'll share what you've done!

Platypus uses:

* The [Tiled](https://www.mapeditor.org/) map editor for level creation.
* [SpringRoll (v2)](https://springroll.io) for application management.
* [Pixi.js](https://pixijs.com/) for rendering visuals.

## Install

```bash
npm install @makefully/platypus
```

The npm package ships **Webpack 5 builds** in `lib/` (not `src/`): `platypus.mjs` for `import` (recommended) and `platypus.js` (UMD) for `require` or script tags. Your game must also install peer dependencies:

| Package | Notes |
|---------|--------|
| `pixi.js` (^8.1.5) | Rendering |
| `springroll` (^2.6.0) | Application shell |
| `@tweenjs/tween.js` | Tweens |
| `@pixi/sound` | Audio (Makefully fork; see `package.json`) |
| `@esotericsoftware/spine-pixi-v8` | Spine animations (`RenderSpine`) |
| `pako` | Compression helpers where used |

Optional: `box2d3-wasm`, `jsmediatags`, `poly-decomp` (see `optionalDependencies` in [package.json](package.json)).

Entry points: `lib/platypus.mjs` (`import`) or `lib/platypus.js` (`require`/script tag), plus worker chunks alongside them in `lib/`.

If you see a Pixi error like `Cannot read properties of undefined (reading 'push')` in `collectRenderablesMixin` when using the UMD build, switch to the ESM entry (`import platypus from '@makefully/platypus'`). The ESM build keeps Platypus's `pixi.js` imports visible to your bundler so mask and render pipes are initialized. Using `/src` directly worked because your bundler already walked those imports.

Include the engine stylesheet in your game's CSS (canvas layout, captions, debug overlay):

```css
@import '@makefully/platypus/platypus.css';
```

## Development

Requires **Node.js 20+**.

```bash
npm install
npm run build:release   # production bundle → lib/ (gitignored)
npm run test:run        # unit tests (Vitest)
npm run docs            # API reference → docs/api/ (gitignored)
```

| Script | Purpose |
|--------|---------|
| `npm start` | Webpack dev server (`src/`, development mode) |
| `npm run build:debug` | Development bundle with source maps |
| `npm run pack:check` | Preview the npm tarball contents |
| `npm run assess:tiled` | TiledLoader vs Tiled spec report ([test/tiled/README.md](test/tiled/README.md)) |

Contributor workflow, API docs publishing, and `npm publish` are described in [docs/README.md](docs/README.md).

When `package.json` **version** changes on `main`, [.github/workflows/release.yml](.github/workflows/release.yml) builds `lib/`, publishes to [npm](https://www.npmjs.com/package/@makefully/platypus), and creates a GitHub release from the matching [CHANGELOG.md](CHANGELOG.md) section (skips each step if that version already exists).

## Key Features

* Deploy on any HTML5 platform supported by SpringRoll v2
* Multi-platform support
* Automatic scaling
* Touch and keyboard input
* Component-based development model
* [Documentation](https://makefully-studios.github.io/platypus/) — generated from JSDoc in `src/`

## Platypus in action

* Ready Jet GO! [Mission Earth](https://pbskids.org/readyjetgo/games/mission/index.html)
* Wild Kratts [Monkey Mayhem](https://pbskids.org/wildkratts/games/monkey-mayhem/)

***

[Code](https://github.com/Makefully-Studios/platypus) · [Docs](https://makefully-studios.github.io/platypus/) · [npm](https://www.npmjs.com/package/@makefully/platypus) · [Changelog](CHANGELOG.md)

Maintained by **Derek Detweiler** and **Todd Lewis** ([CONTRIBUTORS.md](CONTRIBUTORS.md)).

Platypus was originally developed by PBS KIDS and [Gopherwood Studios](https://gopherwoodstudios.com/). It is free to use (see [licenses.txt](licenses.txt)); assets in the example games are © Gopherwood Studios and/or © PBS KIDS.
