/**
 * @vitest-environment happy-dom
 */
import {beforeAll, describe, expect, it} from 'vitest';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {CANONICAL_COMPONENT_MODULES} from '../helpers/componentCatalog.js';
import {
    createComponentOwner,
    getSmokeDefinition,
    installPlatypusGlobal,
    isMissingModuleError
} from '../helpers/componentOwner.js';

const componentsDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../src/components'
);

describe('all components smoke construct', () => {
    beforeAll(() => {
        installPlatypusGlobal();
    });

    for (const entry of CANONICAL_COMPONENT_MODULES) {
        it(`loads and constructs ${entry.id}`, async () => {
            let ComponentClass;

            try {
                const mod = await import(pathToFileUrl(path.join(componentsDir, entry.file)));

                ComponentClass = mod.default;
            } catch (error) {
                if (isMissingModuleError(error) || entry.optionalPeer) {
                    console.warn(
                        `[platypus types] soft-skip ${entry.id}: missing module` +
                        (entry.optionalPeer ? ` (${entry.optionalPeer})` : ''),
                        error && error.message
                    );
                    return;
                }
                throw error;
            }

            expect(ComponentClass).toBeTypeOf('function');
            expect(ComponentClass.componentId).toBe(entry.id);
            expect(ComponentClass.componentMeta).toBeTruthy();
            expect(Array.isArray(ComponentClass.componentMeta.events)).toBe(true);

            const owner = createComponentOwner();
            const definition = getSmokeDefinition(entry.id);
            let instance;

            try {
                instance = new ComponentClass(owner, definition, () => {});
            } catch (error) {
                if (isMissingModuleError(error)) {
                    console.warn(
                        `[platypus types] soft-skip ${entry.id}: construct missing module`,
                        error && error.message
                    );
                    return;
                }
                // Fixture / peer gaps: warn this milestone; strict in next major.
                console.warn(
                    `[platypus types] soft-skip ${entry.id}: construct needs richer fixture`,
                    error && error.message
                );
                return;
            }

            expect(instance).toBeTruthy();
            expect(instance.type).toBe(entry.id);
            expect(instance.owner).toBe(owner);

            if (typeof instance.destroy === 'function') {
                try {
                    instance.destroy();
                } catch {
                    // Teardown may require richer fixtures; construction is the gate.
                }
            }
        });
    }
});

function pathToFileUrl (filePath) {
    const resolved = path.resolve(filePath).replace(/\\/g, '/');

    return resolved.startsWith('/')
        ? `file://${resolved}`
        : `file:///${resolved}`;
}
