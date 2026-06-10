# Platypus documentation

API reference is generated with [JSDoc](https://jsdoc.app/) from comments in `src/` and the root `README.md` (home page). The public site is hosted at [makefully-studios.github.io/platypus](https://makefully-studios.github.io/platypus/).

## Build locally

```bash
npm install
npm run docs
```

Output is written to `docs/api/` (gitignored). Open `docs/api/index.html` in a browser to preview.

## Publish

### CI (recommended)

Pushing to `pixi8` or `main` runs [.github/workflows/docs.yml](../.github/workflows/docs.yml), which builds docs and pushes the `gh-pages` branch on [Makefully-Studios/platypus](https://github.com/Makefully-Studios/platypus) using the workflow `GITHUB_TOKEN` (requires **Settings → Actions → General → Workflow permissions → Read and write**).

You can also trigger a deploy manually from the repository **Actions** tab → **Publish documentation** → **Run workflow**.

### Manual publish

Requires permission to push to `gh-pages` on the Makefully-Studios repo (deploy key or SSH).

```bash
npm run docs:publish
```

Override the target repository if needed:

```bash
PLATYPUS_DOCS_REPO=git@github.com:Makefully-Studios/platypus.git npm run docs:publish
```

## When to update docs

- User-facing or release-visible changes → add an entry under `[Unreleased]` in [CHANGELOG.md](../CHANGELOG.md)
- New or changed component properties, events, or public methods → update JSDoc in `src/`
- New subsystem with spec/checklists → add a focused README under `test/` or `docs/` (see `test/tiled/README.md`)
- Behavior that is easy to misread → add or extend a Vitest test and keep JSDoc in sync

## npm package

The library is published as [`@makefully/platypus`](https://www.npmjs.com/package/@makefully/platypus). The tarball includes everything under `lib/` (UMD bundle, `platypus.css`, and any worker chunks from `npm run build:release`), not `src/`. The `lib/` directory is gitignored in this repo; `prepack` rebuilds it when you publish to npm. Consumers import styles via `@makefully/platypus/platypus.css`.

```bash
npm run build:release   # Webpack 5 production build → lib/
npm run pack:check      # preview tarball contents
npm publish             # runs prepack, then publishes
```

Requires npm login with access to the `@makefully` scope (`publishConfig.access` is `public`).

## Configuration

- [jsDoc.json](../jsDoc.json) — source paths, Minami template, output directory
- [package.json](../package.json) — build, test, docs, and `prepack` scripts
- [webpack.config.js](../webpack.config.js) — Webpack 5 UMD bundle to `lib/`
