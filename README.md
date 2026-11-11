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

The npm package ships **`src/` for `import`** (your bundler compiles it, same as linking the repo) and a **UMD build** in `lib/platypus.js` for `require` or script tags. Your game must also install peer dependencies:

| Package | Notes |
|---------|--------|
| `pixi.js` (^8.1.5) | Rendering |
| `springroll` (^2.6.0) | Application shell |
| `@tweenjs/tween.js` | Tweens |
| `@pixi/sound` | Audio (`^6.0.2`) |
| `@esotericsoftware/spine-pixi-v8` | Spine animations (`RenderSpine`) |
| `pako` | Compression helpers where used |

Optional: `box2d3-wasm`, `@probityrules/jsmediatags` (`^4.1.2`, ID3 + WebM), `poly-decomp` (see `optionalDependencies` in [package.json](package.json)).

With jsmediatags enabled, VO/SFX can use `.webm` / `.weba` as well as `.mp3`. Embedded captions and lipsync come from ID3 `SYLT` or WebM `WEBVTT` tracks, normalized by `timedCueTracks` for `ID3CaptionPlayer` / `VOPlayer`. Safari may not decode Opus-in-WebM for Web Audio; prefer MP3 where that matters.

Entry points: `src/index.js` via `import platypus from '@makefully/platypus'`, or `lib/platypus.js` for `require`/script tags (plus worker chunks in `lib/` for the UMD build). TypeScript consumers resolve typings from `types/` (`EntityOf`, `ComponentRegistry`, `defineEntity`).

Bundlers should use the `import` entry (source). The prebuilt UMD omits Platypus's `pixi.js` sub-imports from your module graph, which can cause a Pixi `collectRenderablesMixin` crash on masked sprites unless you add `import 'pixi.js'` before Platypus.

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
npm run test:types      # TypeScript contribution typings (tsd)
npm run docs            # API reference → docs/api/ (gitignored)
```

| Script | Purpose |
|--------|---------|
| `npm start` | Webpack dev server (`src/`, development mode) |
| `npm run build:debug` | Development bundle with source maps |
| `npm run pack:check` | Preview the npm tarball contents |
| `npm run assess:tiled` | TiledLoader vs Tiled spec report ([test/tiled/README.md](test/tiled/README.md)) |
| `npm run test:types` | Compile-time checks for `EntityOf` / registry typings |
| `npm run generate:component-keys` | Refresh `types/components/_keys.js` from live `componentMeta` |
| `npm run generate:contribution-types` | Regenerate per-component contribution `.d.ts` + registry |

### TypeScript

Platypus ships **composition typings**: an entity’s type is the merge of the components added to it.

```ts
import type { EntityOf } from '@makefully/platypus';
import { defineEntity } from '@makefully/platypus';

type Hero = EntityOf<'CollisionBasic' | 'LogicPortable'>;

const heroDef = defineEntity({
  id: 'hero',
  components: [
    { type: 'CollisionBasic' as const, collisionType: 'hero' },
    { type: 'LogicPortable' as const }
  ]
});
```

Augment `ComponentRegistry` for game-specific components. Contribution contract tests **warn** on key drift by default; set `PLATYPUS_TYPES_STRICT=1` to fail (planned default in the next major). The wide `Entity` index signature for ad-hoc JSON `properties` is also deferred for removal until then.

`ComponentSwitcher` changes the runtime composition without narrowing types—annotate a union of possible component ids when you need precision.

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

Maintained by **Makefully Studios** ([CONTRIBUTORS.md](CONTRIBUTORS.md)). Originally developed by PBS KIDS and [Gopherwood Studios](https://gopherwoodstudios.com/).

Released under the [BSD 3-Clause License](LICENSE) (© 2013 Public Broadcasting Service). Assets in the example games are © Gopherwood Studios and/or © PBS KIDS.
