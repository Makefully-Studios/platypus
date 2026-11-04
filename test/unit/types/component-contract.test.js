/**
 * @vitest-environment happy-dom
 *
 * Compares live createComponentClass metadata to types/components/_keys.js.
 * Warns on drift by default; set PLATYPUS_TYPES_STRICT=1 to fail.
 */
import {beforeAll, describe, expect, it} from 'vitest';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
    CANONICAL_COMPONENT_MODULES,
    COMPONENT_ALIASES as CATALOG_ALIASES,
    COMPONENT_MODULES
} from '../helpers/componentCatalog.js';
import {
    installPlatypusGlobal,
    isMissingModuleError
} from '../helpers/componentOwner.js';
import {
    COMPONENT_ALIASES,
    COMPONENT_KEYS
} from '../../../types/components/_keys.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const componentsDir = path.join(root, 'src/components');
const strict = process.env.PLATYPUS_TYPES_STRICT === '1';

const sortedEqual = (a = [], b = []) => {
    const left = [...a].sort().join('\0');
    const right = [...b].sort().join('\0');

    return left === right;
};

const diffKeys = (label, actual = [], expected = []) => {
    const a = new Set(actual);
    const e = new Set(expected);
    const missing = [...e].filter((k) => !a.has(k));
    const extra = [...a].filter((k) => !e.has(k));

    if (!missing.length && !extra.length) {
        return null;
    }

    return `${label} missing=[${missing}] extra=[${extra}]`;
};

describe('component contribution contract', () => {
    const warnings = [];

    beforeAll(() => {
        installPlatypusGlobal();
    });

    it('keeps Camera aliased to HandlerCamera', () => {
        expect(COMPONENT_ALIASES.Camera).toBe('HandlerCamera');
        expect(CATALOG_ALIASES.Camera).toBe('HandlerCamera');
        expect(COMPONENT_KEYS.Camera?.aliasOf).toBe('HandlerCamera');
    });

    it('lists every catalog id in COMPONENT_KEYS (except soft-skipped peers)', () => {
        for (const entry of COMPONENT_MODULES) {
            if (entry.optionalPeer && !COMPONENT_KEYS[entry.id]) {
                console.warn(
                    `[platypus types] contract soft-skip ${entry.id}: optional peer ${entry.optionalPeer}`
                );
                continue;
            }
            if (!COMPONENT_KEYS[entry.id]) {
                const message = `COMPONENT_KEYS missing entry for ${entry.id}`;

                warnings.push(message);
                console.warn(`[platypus types] ${message}`);
            }
        }
    });

    for (const entry of CANONICAL_COMPONENT_MODULES) {
        it(`matches meta for ${entry.id}`, async () => {
            const expected = COMPONENT_KEYS[entry.id];

            if (!expected) {
                if (entry.optionalPeer) {
                    console.warn(
                        `[platypus types] soft-skip ${entry.id}: no keys (optional ${entry.optionalPeer})`
                    );
                    return;
                }
                const message = `No COMPONENT_KEYS entry for ${entry.id}`;

                warnings.push(message);
                console.warn(`[platypus types] ${message}`);
                if (strict) {
                    expect.fail(message);
                }
                return;
            }

            let ComponentClass;

            try {
                const mod = await import(pathToFileURL(path.join(componentsDir, entry.file)).href);

                ComponentClass = mod.default;
            } catch (error) {
                if (isMissingModuleError(error) || entry.optionalPeer) {
                    console.warn(`[platypus types] soft-skip ${entry.id}:`, error.message);
                    return;
                }
                throw error;
            }

            const meta = ComponentClass.componentMeta;
            const parts = [
                diffKeys('properties', meta.properties, expected.properties),
                diffKeys('publicProperties', meta.publicProperties, expected.publicProperties),
                diffKeys('publicMethods', meta.publicMethods, expected.publicMethods),
                diffKeys('methods', meta.methods, expected.methods),
                diffKeys('events', meta.events, expected.events)
            ].filter(Boolean);

            if (meta.hasGetAssetList !== expected.hasGetAssetList) {
                parts.push(
                    `hasGetAssetList actual=${meta.hasGetAssetList} expected=${expected.hasGetAssetList}`
                );
            }

            if (parts.length) {
                const message = `${entry.id}: ${parts.join('; ')}`;

                warnings.push(message);
                console.warn(`[platypus types] contract drift: ${message}`);
                if (strict) {
                    expect.fail(message);
                }
            } else {
                expect(sortedEqual(meta.events, expected.events)).toBe(true);
            }
        });
    }

    it('summarizes warn-only policy', () => {
        if (warnings.length) {
            console.warn(
                `[platypus types] ${warnings.length} contract warning(s). ` +
                'Set PLATYPUS_TYPES_STRICT=1 to fail. Strict becomes default in the next major.'
            );
        }
        if (strict) {
            expect(warnings).toEqual([]);
        } else {
            expect(true).toBe(true);
        }
    });
});
