# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.10] - 2026-06-23

### Added

- `cloneDefinition` utility for deep-copying JSON-like Platypus definitions.
- `LevelBuilder#cloneLevel` public method.
- Unit tests for level composition isolation and TiledLoader entity template isolation.

### Fixed

- **LevelBuilder:** Composed levels are deep-cloned so merges, mirrors, and replay do not share or corrupt source data; `created-level` dispatches an isolated snapshot; skips re-composition when a pre-built level object is already supplied.
- **AssetManager:** Relinks assets already registered with Pixi between scene loads; `get()` falls back to `getFileId` for webpack URL lookups.
- **Render:** Warns when initializing with an image not in the asset cache.
- **TiledLoader:** Deep-copies entity templates from settings when creating layer entities; caches `level.assets` only for named level ids; passes tilesets when collecting assets from tile objectgroups.
- **VOPlayer:** `unloadSound` uses `getFileId` so asset reference counts match loaded aliases.

## [4.1.9] - 2026-06-22

### Added

- `RenderTiles` `force-render` event for synchronous cache refresh after bulk tile edits.
- `RenderTiles` helpers `refreshAllCaches`, `refreshPanningCache`, `refreshAllCacheGrid`, `alignCacheToCamera`, and `detachCacheCopy`.
- Unit tests for `RenderTiles` `populateTiles` incremental vs full refresh and `alignCacheToCamera`.

### Fixed

- `RenderTiles` `change-tile` now always flags a cache refresh; the previous bounds check skipped updates when `this.cache` did not cover the edited tile (notably on multi-texture full-map grids).
- `RenderTiles` `force-render` and in-place panning-cache refresh now repopulate the full visible window (`populate` with no `oldBounds`) instead of the camera-scroll incremental path, which skipped every tile when the camera had not moved.
- `RenderTiles` panning-cache refresh draws into the alternate render texture before swapping the display sprite, avoiding blank tiles from clearing the on-screen texture in Pixi v8.
- `RenderTiles` `force-render` re-renders all `cacheGrid` cells on multi-texture full-map layers instead of calling the single-texture path with no `cacheTexture`.
- `RenderTiles` `renderCache` removes the temporary copy sprite from `mapContainer` after scroll blits.

## [4.1.8] - 2026-06-16

### Changed

- Peer dependency `@esotericsoftware/spine-pixi-v8` updated to `^4.3.7`.

### Fixed

- `RenderSpine` updated for Spine 4.3 pose APIs (`setupPoseSlots`, `slot.pose.color`, `physicsRotate`).
- Spine physics no longer reacts to camera panning; automatic container physics inheritance is disabled because Platypus moves the world container, not individual entities.

## [4.1.7] - 2026-06-16

### Added

- Tiled layer parallax (`parallaxx`, `parallaxy`) and map parallax origin (`parallaxoriginx`, `parallaxoriginy`) support, forwarded from `TiledLoader` to `RenderTiles`.

### Changed

- `RenderTiles` layers with different parallax factors are no longer combined into a single render layer.

## [4.1.6] - 2026-06-10

### Changed

- `import` resolves to `src/index.js` (shipped in the npm tarball) so bundlers compile Platypus directly; `require` still uses `lib/platypus.js` (UMD).

### Fixed

- Webpack error `Can't resolve './'` when re-bundling `lib/platypus.mjs`: the prebuilt ESM artifact embedded webpack chunk-loader runtime that consumer bundlers cannot resolve. Removed the ESM webpack target in favor of publishing `src/`.

## [4.1.5] - 2026-06-10

### Added

- ESM build (`lib/platypus.mjs`) as the `import` entry in `package.json` exports; UMD (`lib/platypus.js`) remains the `require` entry.

### Fixed

- Pixi `collectRenderablesWithEffects` crash (`Cannot read properties of undefined (reading 'push')`) when consuming the npm package instead of `/src`: the prebuilt UMD hid Platypus's `pixi.js` sub-imports, so bundlers could omit mask/render pipes that masked sprites need. The ESM entry preserves those imports in the consumer's module graph.

## [4.1.4] - 2026-06-10

### Changed

- Release workflow publishes to npm via trusted publishing (OIDC) instead of `NPM_TOKEN`, avoiding `EOTP` failures when npm 2FA is enabled.

## [4.1.3] - 2026-06-10

### Added

- Release workflow publishes `@makefully/platypus` to npm when `package.json` version changes on `main`.

### Changed

- GitHub Actions workflows use Node.js 24 and action versions with a Node 24 runtime (`actions/checkout@v6`, `actions/setup-node@v6`, `softprops/action-gh-release@v3`, `peaceiris/actions-gh-pages@v4.1.0`).

## [4.1.2] - 2026-06-10

### Added

- `platypus.css` shipped in the npm tarball under `lib/` and exposed as `@makefully/platypus/platypus.css` (release build copies `src/platypus.css`).

### Changed

- README documents the supported CSS import path for npm consumers (replaces v3 `src/platypus.css` imports).

## [4.1.1] - 2026-06-04

### Added

- GitHub Actions [release workflow](.github/workflows/release.yml): when `package.json` version changes on `main`, builds `lib/*.js` and publishes a GitHub release from [CHANGELOG.md](CHANGELOG.md).
- `scripts/extract-changelog.mjs` for release note extraction.
- Vitest tests for `ControllerInput`.

### Changed

- Docs CI ([docs workflow](.github/workflows/docs.yml)) deploys with `GITHUB_TOKEN` instead of an SSH deploy key.
- `npm run docs` copies `assets/` into `docs/api/` so the README header image works on GitHub Pages.
- `ControllerInput` JSDoc corrected (was incorrectly documented as `CollectiblesManager`).

### Fixed

- `ControllerInput#unattachControls` now removes the bound pointer listeners registered at setup.

## [4.1.0] - 2026-06-03

### Added

- npm package published as [`@makefully/platypus`](https://www.npmjs.com/package/@makefully/platypus) (UMD build in `lib/` only; `prepack` runs the release build).
- Webpack 5 build pipeline (`webpack serve`, production and development modes).
- API documentation tooling: `npm run docs`, `npm run docs:publish`, and [docs/README.md](docs/README.md).
- Vitest unit tests for core types and components (including `RenderDebug`, `StateMap`, `AABB`, and others).
- TiledLoader compatibility assessment (`npm run assess:tiled`, [test/tiled/README.md](test/tiled/README.md)).
- `StateMap#toJSON` (boolean key/value object) and `StateMap#toString` (comma/`!` format compatible with `updateFromString`).
- `StateMap` constructor support for copying from another `StateMap`.

### Changed

- Package name scoped to `@makefully/platypus`; repository and homepage point at [Makefully-Studios/platypus](https://github.com/Makefully-Studios/platypus).
- `lib/` is a build artifact (gitignored); clone builds via `npm run build:release`.
- Upgraded from Webpack 4 to Webpack 5; removed Babel, `worker-loader`, and OpenSSL legacy provider workarounds.
- `TickerClient` uses native `new Worker(new URL(..., import.meta.url))` again.
- Internal imports no longer use `import 'platypus'` (relative modules / globals instead).
- `StateMap` coerces stored values to booleans.
- README and contributor docs updated for install, development, peers, and publishing.
- Legacy JSDoc type expressions updated for current JSDoc parsing.

### Fixed

- `RenderDebug` draws each `CollisionBasic` shape from its own `aABB` instead of the combined AABB dimensions.
- `CollisionGroup` collision grid not updated for non-moving entities with a collision group.
- `package.json` `engines` field corrected to `engines` (Node `>=20`).

## [4.0.3] - 2026-06-03

### Added

- Vitest test suite and coverage reporting.
- Tiled format spec catalog and coverage assessment scripts.

### Changed

- Removed legacy `Camera` component; use `HandlerCamera` / `EntityCamera` instead.

### Fixed

- `TimeEvent` scheduling edge case.
- Test and base-class coverage gaps addressed in core utilities.

## [4.0.1] - 2026-05-28

### Added

- Rotated one-way (`jumpThrough`) collision support on `CollisionShape` / `CollisionBasic`.

### Fixed

- Collision handling when entities have multiple `CollisionBasic` components (`CollisionGroup`).
- `HandlerCollision` grid updates for grouped, non-moving entities.

## Earlier versions

Tags and history for releases prior to 4.0.x (for example `v2.0.2`) are available in [GitHub releases](https://github.com/Makefully-Studios/platypus/releases) and `git tag`.
