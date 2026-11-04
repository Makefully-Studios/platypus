/**
 * @vitest-environment happy-dom
 *
 * Regenerates types/components/_keys.js from live componentMeta.
 * Asserts meta is readable and writes the mirror file (preserve hand-maintained entries such as RenderLottie).
 */
import {beforeAll, describe, expect, it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
    CANONICAL_COMPONENT_MODULES,
    COMPONENT_ALIASES
} from '../helpers/componentCatalog.js';
import {
    installPlatypusGlobal,
    isMissingModuleError
} from '../helpers/componentOwner.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const componentsDir = path.join(root, 'src/components');
const outFile = path.join(root, 'types/components/_keys.js');

describe('generate component keys', () => {
    beforeAll(() => {
        installPlatypusGlobal();
    });

    it('collects componentMeta for the registry mirror', async () => {
        const keys = {};
        const softSkipped = [];

        for (const entry of CANONICAL_COMPONENT_MODULES) {
            try {
                const mod = await import(pathToFileURL(path.join(componentsDir, entry.file)).href);
                const ComponentClass = mod.default;

                expect(ComponentClass.componentId).toBe(entry.id);
                expect(ComponentClass.componentMeta).toBeTruthy();

                keys[entry.id] = {
                    properties: [...ComponentClass.componentMeta.properties].sort(),
                    publicProperties: [...ComponentClass.componentMeta.publicProperties].sort(),
                    publicMethods: [...ComponentClass.componentMeta.publicMethods].sort(),
                    methods: [...ComponentClass.componentMeta.methods].sort(),
                    events: [...ComponentClass.componentMeta.events].sort(),
                    hasGetAssetList: ComponentClass.componentMeta.hasGetAssetList,
                    dynamicEvents: [
                        'CollisionBasic',
                        'HandlerCollision',
                        'AIPacer',
                        'VoiceOver',
                        'ComponentSwitcher'
                    ].includes(entry.id)
                };
            } catch (error) {
                softSkipped.push({id: entry.id, reason: error.message});
                if (!isMissingModuleError(error) && !entry.optionalPeer) {
                    console.warn(`[generate-component-keys] soft-skip ${entry.id}:`, error.message);
                }
            }
        }

        for (const [alias, canonical] of Object.entries(COMPONENT_ALIASES)) {
            if (keys[canonical]) {
                keys[alias] = {...keys[canonical], aliasOf: canonical};
            }
        }

        expect(Object.keys(keys).length).toBeGreaterThan(50);

        // Preserve hand-maintained optional-peer entries (e.g. RenderLottie).
        if (fs.existsSync(outFile)) {
            const prior = await import(pathToFileURL(outFile).href);

            for (const [id, entry] of Object.entries(prior.COMPONENT_KEYS || {})) {
                if (entry.optionalPeer && !keys[id]) {
                    keys[id] = entry;
                }
            }
        }

        fs.mkdirSync(path.dirname(outFile), {recursive: true});
        const body = `/**
 * Auto-generated contribution key mirror for contract tests.
 * Regenerate: npm run generate:component-keys
 *
 * Soft-skipped at generation time: ${JSON.stringify(softSkipped.map((s) => s.id))}
 * Entries with optionalPeer may be hand-maintained across regenerations.
 */
export const COMPONENT_ALIASES = ${JSON.stringify(COMPONENT_ALIASES, null, 4)};

export const COMPONENT_KEYS = ${JSON.stringify(keys, null, 4)};

export default COMPONENT_KEYS;
`;

        fs.writeFileSync(outFile, body, 'utf8');
        console.log(`Wrote ${outFile} (${Object.keys(keys).length} entries; soft-skipped ${softSkipped.length})`);
    });
});

