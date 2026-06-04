[![Platypus](./assets/platypus-title.png)](https://github.com/pbs/Platypus/)
========

2D tile based game framework in HTML5

## Install

```bash
npm install @makefully/platypus
```

Install [peer dependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies) (`pixi.js`, `springroll`, `@tweenjs/tween.js`, and others listed in `package.json`) in your game project. The published package contains the webpack build in `lib/` only, not `src/`.

## Development

From a clone of this repository, install dependencies and build the distributable (output is gitignored under `lib/`):

```bash
npm install
npm run build:release
```

Use `npm start` for the webpack 5 dev server against `src/`. See [docs/README.md](docs/README.md) for API docs and npm publishing.

The Platypus Engine allows rapid development of 2D orthogonal tile based games for deployment in HTML5 compatible browsers. The engine uses a component based model, and includes many ready to use components to allow users to start adding assets and editing levels right away. The component based model lends itself to community members adding new functionality, we hope you'll share what you've done!

Platypus uses:

* The [Tiled](http://www.mapeditor.org/) map editor for level creation.
* [SpringRoll (v2)](http://springroll.io) for application management.
* [Pixi.js](http://www.pixijs.com/) for rendering visuals.

## Key Features

* Deploy on any HTML5 platform supported by SpringRoll v2
* Multi-platform support
* Automatic scaling
* Touch and keyboard input
* Component-based development model
* [Documentation](https://makefully-studios.github.io/platypus/) — build locally with `npm run docs` (see [docs/README.md](docs/README.md))

Platypus in action:

* Ready Jet GO! [Mission Earth](https://pbskids.org/readyjetgo/games/mission/index.html)
* Wild Kratts [Monkey Mayhem](http://pbskids.org/wildkratts/games/monkey-mayhem/)

***
[Code](https://github.com/Makefully-Studios/platypus) - [Docs](https://makefully-studios.github.io/platypus/) - [npm](https://www.npmjs.com/package/@makefully/platypus)

Platypus was developed by PBS KIDS and [Gopherwood Studios](http://gopherwoodstudios.com/). It is free to use (see licenses.txt), all assets in the example games are © Gopherwood Studios and/or © PBS KIDS.
