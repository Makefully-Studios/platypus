/**
 * Prefer: npm run generate:component-keys
 * (Vitest resolves ESM extensions / happy-dom for peer modules.)
 */
import {spawnSync} from 'node:child_process';

const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vitest', 'run', 'test/unit/types/generate-component-keys.test.js'],
    {stdio: 'inherit', shell: true}
);

process.exit(result.status ?? 1);
