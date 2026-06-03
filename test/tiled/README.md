# Tiled format compatibility assessment

This folder tracks Platypus **TiledLoader** support against the official [Tiled JSON map format](https://doc.mapeditor.org/en/stable/reference/json-map-format/).

It is intentionally **not** a pass/fail unit test. Running the assessment always produces a report so you can compare the engine to the latest Tiled spec after either side changes.

## Files

| File | Role |
|------|------|
| `spec-catalog.json` | Feature checklist derived from the Tiled JSON spec (update when Tiled releases). |
| `tiled-loader-coverage.json` | Manual registry of how `TiledLoader` treats each feature. |
| `assess-coverage.mjs` | Joins the catalog with coverage and prints a report. |

## Usage

```bash
# Full engine vs spec report
npm run assess:tiled

# JSON output for CI dashboards or diffs
node test/tiled/assess-coverage.mjs --json

# Cross-check a specific exported .tmj / .json map
node test/tiled/assess-coverage.mjs path/to/level.tmj
```

## Status meanings

- **supported** — TiledLoader handles the feature for game runtime.
- **partial** — Recognized or partially applied (custom properties, flags, etc.).
- **unsupported** — Present in Tiled exports but not handled (may warn and skip).
- **ignored** — Editor-only or not relevant to runtime loading.
- **unknown** — Listed in the spec catalog but missing from the coverage registry.

## Maintenance

1. When Tiled ships a new format version, extend `spec-catalog.json` from the upstream docs.
2. After changing `TiledLoader.js`, update matching entries in `tiled-loader-coverage.json`.
3. Re-run `npm run assess:tiled` and commit catalog/coverage updates with the loader change.

Optional next steps: add minimal `.tmj` fixtures per feature, or fetch the upstream RST from GitHub in the assess script to diff catalog drift automatically.
