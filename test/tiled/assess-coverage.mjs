/**
 * Tiled JSON format compatibility assessment for Platypus TiledLoader.
 *
 * This is not a pass/fail test. It compares the official Tiled JSON spec catalog
 * against a maintained coverage registry and prints a report you can re-run
 * whenever Tiled or TiledLoader changes.
 *
 * Usage:
 *   node test/tiled/assess-coverage.mjs
 *   node test/tiled/assess-coverage.mjs --json
 *   node test/tiled/assess-coverage.mjs path/to/map.tmj
 */
import {readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const
    __dirname = dirname(fileURLToPath(import.meta.url)),
    spec = JSON.parse(readFileSync(join(__dirname, 'spec-catalog.json'), 'utf8')),
    coverage = JSON.parse(readFileSync(join(__dirname, 'tiled-loader-coverage.json'), 'utf8')),
    STATUS_ORDER = ['supported', 'partial', 'unsupported', 'ignored', 'unknown'],
    args = process.argv.slice(2),
    jsonOutput = args.includes('--json'),
    mapPath = args.find((arg) => !arg.startsWith('--')),
    MAP_FEATURE_DETECTORS = [
        {id: 'map.infinite', test: (map) => map.infinite === true},
        {id: 'map.orientation.orthogonal', test: (map) => map.orientation === 'orthogonal'},
        {id: 'map.orientation.isometric', test: (map) => map.orientation === 'isometric'},
        {id: 'map.orientation.staggered', test: (map) => map.orientation === 'staggered'},
        {id: 'map.orientation.hexagonal', test: (map) => map.orientation === 'hexagonal'},
        {id: 'map.orientation.oblique', test: (map) => map.orientation === 'oblique'},
        {id: 'map.renderorder', test: (map) => typeof map.renderorder === 'string'},
        {id: 'map.properties', test: (map) => Array.isArray(map.properties) && map.properties.length > 0},
        {id: 'map.class', test: (map) => typeof map.class === 'string'},
        {id: 'layer.tilelayer', test: (map) => walkLayers(map.layers, (layer) => layer.type === 'tilelayer')},
        {id: 'layer.objectgroup', test: (map) => walkLayers(map.layers, (layer) => layer.type === 'objectgroup')},
        {id: 'layer.imagelayer', test: (map) => walkLayers(map.layers, (layer) => layer.type === 'imagelayer')},
        {id: 'layer.group', test: (map) => walkLayers(map.layers, (layer) => layer.type === 'group')},
        {id: 'tilelayer.chunks', test: (map) => walkLayers(map.layers, (layer) => Array.isArray(layer.chunks) && layer.chunks.length > 0)},
        {id: 'tilelayer.encoding.base64', test: (map) => walkLayers(map.layers, (layer) => layer.encoding === 'base64')},
        {id: 'tilelayer.compression.zlib', test: (map) => walkLayers(map.layers, (layer) => layer.compression === 'zlib')},
        {id: 'tilelayer.compression.gzip', test: (map) => walkLayers(map.layers, (layer) => layer.compression === 'gzip')},
        {id: 'tilelayer.compression.zstd', test: (map) => walkLayers(map.layers, (layer) => layer.compression === 'zstd')},
        {id: 'object.ellipse', test: (map) => walkObjects(map, (object) => object.ellipse === true)},
        {id: 'object.point', test: (map) => walkObjects(map, (object) => object.point === true)},
        {id: 'object.polygon', test: (map) => walkObjects(map, (object) => Array.isArray(object.polygon))},
        {id: 'object.polyline', test: (map) => walkObjects(map, (object) => Array.isArray(object.polyline))},
        {id: 'object.text', test: (map) => walkObjects(map, (object) => object.text != null)},
        {id: 'object.template', test: (map) => walkObjects(map, (object) => typeof object.template === 'string')},
        {id: 'object.tile', test: (map) => walkObjects(map, (object) => typeof object.gid === 'number')},
        {id: 'tileset.external', test: (map) => Array.isArray(map.tilesets) && map.tilesets.some((tileset) => tileset.source)},
        {id: 'tileset.collection', test: (map) => Array.isArray(map.tilesets) && map.tilesets.some((tileset) => Array.isArray(tileset.tiles) && tileset.tiles.some((tile) => tile.image))},
        {id: 'tileset.wangsets', test: (map) => Array.isArray(map.tilesets) && map.tilesets.some((tileset) => Array.isArray(tileset.wangsets) && tileset.wangsets.length > 0)},
        {id: 'tileset.tile.animation', test: (map) => Array.isArray(map.tilesets) && map.tilesets.some((tileset) => Array.isArray(tileset.tiles) && tileset.tiles.some((tile) => Array.isArray(tile.animation) && tile.animation.length > 0))},
        {id: 'tileset.tile.objectgroup', test: (map) => Array.isArray(map.tilesets) && map.tilesets.some((tileset) => Array.isArray(tileset.tiles) && tileset.tiles.some((tile) => tile.objectgroup))}
    ];

function walkLayers (layers, predicate) {
    if (!Array.isArray(layers)) {
        return false;
    }

    for (const layer of layers) {
        if (predicate(layer)) {
            return true;
        }
        if (layer.type === 'group' && walkLayers(layer.layers, predicate)) {
            return true;
        }
    }

    return false;
}

function walkObjects (map, predicate) {
    return walkLayers(map.layers, (layer) => {
        if (layer.type !== 'objectgroup' || !Array.isArray(layer.objects)) {
            return false;
        }

        return layer.objects.some(predicate);
    });
}

function detectMapFeatures (map) {
    const detected = {};

    for (const {id, test} of MAP_FEATURE_DETECTORS) {
        try {
            detected[id] = !!test(map);
        } catch {
            detected[id] = false;
        }
    }

    return detected;
}

function buildAssessment (mapFeatures = null) {
    const
        rows = spec.features.map((feature) => {
            const entry = coverage.coverage[feature.id] ?? {status: 'unknown', note: 'Not registered in tiled-loader-coverage.json.'};

            return {
                ...feature,
                status: entry.status,
                note: entry.note ?? '',
                inMap: mapFeatures ? !!mapFeatures[feature.id] : null
            };
        }),
        summary = STATUS_ORDER.reduce((acc, status) => {
            acc[status] = rows.filter((row) => row.status === status).length;
            return acc;
        }, {});

    summary.total = rows.length;
    summary.catalogued = Object.keys(coverage.coverage).length;
    summary.unregistered = rows.filter((row) => row.status === 'unknown').length;

    if (mapFeatures) {
        summary.mapFeaturesUsed = rows.filter((row) => row.inMap).length;
        summary.mapFeaturesUnsupported = rows.filter((row) => row.inMap && (row.status === 'unsupported' || row.status === 'unknown')).length;
        summary.mapFeaturesPartial = rows.filter((row) => row.inMap && row.status === 'partial').length;
    }

    return {spec, coverage, rows, summary, mapFeatures};
}

function printTextReport (assessment) {
    const {spec, coverage, rows, summary, mapFeatures} = assessment;

    console.log('Tiled JSON Format Compatibility Assessment');
    console.log('========================================');
    console.log(`Tiled spec: ${spec.specVersion} (${spec.specUrl})`);
    console.log(`Engine:   ${coverage.engine}`);
    console.log(`Source:   ${coverage.source}`);
    console.log(`Reviewed: spec ${spec.lastReviewed}, coverage ${coverage.lastReviewed}`);
    console.log('');
    console.log('Summary');
    console.log('-------');
    STATUS_ORDER.forEach((status) => {
        if (summary[status]) {
            console.log(`  ${status.padEnd(12)} ${summary[status]}`);
        }
    });
    console.log(`  ${'total'.padEnd(12)} ${summary.total}`);
    if (mapFeatures) {
        console.log('');
        console.log(`Map scan: ${summary.mapFeaturesUsed} spec features detected in file`);
        console.log(`          ${summary.mapFeaturesPartial} partial when used`);
        console.log(`          ${summary.mapFeaturesUnsupported} unsupported/unknown when used`);
    }
    console.log('');

    const categories = [...new Set(rows.map((row) => row.category))];

    for (const category of categories) {
        console.log(category);
        console.log('-'.repeat(category.length));

        rows.filter((row) => row.category === category).forEach((row) => {
            const mapFlag = mapFeatures && row.inMap ? ' [in map]' : '';
            const since = row.since ? ` (since ${row.since})` : '';

            console.log(`  [${row.status}] ${row.name}${since}${mapFlag}`);
            if (row.note) {
                console.log(`           ${row.note}`);
            }
        });

        console.log('');
    }

    if (summary.unregistered) {
        console.log(`Warning: ${summary.unregistered} catalog feature(s) lack coverage entries.`);
    }
}

function printJsonReport (assessment) {
    console.log(JSON.stringify({
        spec: {
            version: assessment.spec.specVersion,
            url: assessment.spec.specUrl,
            lastReviewed: assessment.spec.lastReviewed
        },
        engine: {
            name: assessment.coverage.engine,
            source: assessment.coverage.source,
            lastReviewed: assessment.coverage.lastReviewed
        },
        summary: assessment.summary,
        features: assessment.rows
    }, null, 2));
}

let mapFeatures = null;

if (mapPath) {
    const map = JSON.parse(readFileSync(resolve(mapPath), 'utf8'));

    mapFeatures = detectMapFeatures(map);
}

const assessment = buildAssessment(mapFeatures);

if (jsonOutput) {
    printJsonReport(assessment);
} else {
    printTextReport(assessment);
}
