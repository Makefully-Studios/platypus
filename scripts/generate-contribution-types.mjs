/**
 * Generates types/components/*.d.ts contribution stubs and registry.d.ts from _keys.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'types/components');
const keysMod = await import(pathToFileURL(path.join(outDir, '_keys.js')).href);
const {COMPONENT_KEYS, COMPONENT_ALIASES} = keysMod;

const toInterfaceName = (id) => `${id}Contribution`;
const escapeProp = (key) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key));

const eventPayloadHint = (id, eventName) => {
    if (eventName.startsWith('hit-by-') || eventName === 'hit-solid' || eventName === 'hit-soft') {
        return 'unknown';
    }
    if (eventName === 'carry-me' || eventName === 'release-me') {
        return '{ entity: unknown }';
    }
    return 'unknown';
};

fs.mkdirSync(outDir, {recursive: true});

const canonicalIds = Object.keys(COMPONENT_KEYS)
    .filter((id) => !COMPONENT_KEYS[id].aliasOf)
    .sort();

const registryLines = [
    'import type { ComponentContribution } from \'../entity-of\';',
    ...canonicalIds.map((id) => `import type { ${toInterfaceName(id)} } from \'./${id}\';`),
    '',
    '/**',
    ' * Built-in component contribution registry.',
    ' * Games may augment this interface via declaration merging.',
    ' *',
    ' * Camera is an alias of HandlerCamera (same contribution).',
    ' */',
    'export interface ComponentRegistry {'
];

for (const id of canonicalIds) {
    const file = path.join(outDir, `${id}.d.ts`);
    const meta = COMPONENT_KEYS[id];
    const props = meta.publicProperties.map(
        (key) => `    ${escapeProp(key)}?: unknown;`
    );
    const methods = meta.publicMethods.map(
        (key) => `    ${escapeProp(key)}?: (...args: never[]) => unknown;`
    );
    const componentProps = meta.properties.map(
        (key) => `    ${escapeProp(key)}?: unknown;`
    );
    const events = meta.events.map(
        (key) => `    ${JSON.stringify(key)}: ${eventPayloadHint(id, key)};`
    );

    if (id === 'CollisionBasic' || id === 'HandlerCollision') {
        events.push('    [event: `hit-by-${string}`]: unknown;');
    }
    if (id === 'AIPacer') {
        events.push('    \'go-up\': unknown;');
        events.push('    \'go-down\': unknown;');
        events.push('    \'go-left\': unknown;');
        events.push('    \'go-right\': unknown;');
    }
    if (id === 'VoiceOver') {
        events.push('    [event: string]: unknown;');
    }
    if (id === 'LogicPortable') {
        events.push('    "carry-me": { entity: unknown };');
        events.push('    "release-me": { entity: unknown };');
    }

    const contents = `import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for ${id}.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface ${toInterfaceName(id)} extends ComponentContribution {
    props: {
${props.join('\n') || '        // none'}
    };
    methods: {
${methods.join('\n') || '        // none'}
    };
    events: {
${events.join('\n') || '        // none'}
    };
    componentProps: {
${componentProps.join('\n') || '        // none'}
    };
}

export type ${id}Props = ${toInterfaceName(id)}['props'];
export type ${id}Events = ${toInterfaceName(id)}['events'];
`;

    fs.writeFileSync(file, contents, 'utf8');
    registryLines.push(`    ${id}: ${toInterfaceName(id)};`);
}

for (const [alias, canonical] of Object.entries(COMPONENT_ALIASES)) {
    registryLines.push(`    /** Alias of ${canonical}. */`);
    registryLines.push(`    ${alias}: ${toInterfaceName(canonical)};`);
}

registryLines.push('}');
registryLines.push('');
registryLines.push('export type BuiltinComponentId = keyof ComponentRegistry;');
registryLines.push('');

fs.writeFileSync(path.join(outDir, 'registry.d.ts'), registryLines.join('\n'), 'utf8');

// Barrel for contributions
const index = [
    'export type { ComponentRegistry, BuiltinComponentId } from \'./registry\';',
    ...canonicalIds.map((id) => `export type { ${toInterfaceName(id)} } from \'./${id}\';`),
    ''
].join('\n');

fs.writeFileSync(path.join(outDir, 'index.d.ts'), index, 'utf8');

console.log(`Wrote ${canonicalIds.length} contribution modules + registry.d.ts`);
