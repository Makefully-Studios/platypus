import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const
    copyDir = (from, to) => {
        fs.mkdirSync(to, {recursive: true});
        for (const entry of fs.readdirSync(from, {withFileTypes: true})) {
            const
                src = path.join(from, entry.name),
                dest = path.join(to, entry.name);

            if (entry.isDirectory()) {
                copyDir(src, dest);
            } else {
                fs.copyFileSync(src, dest);
            }
        }
    },
    root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    configPath = path.join(root, 'jsDoc.json'),
    assetsDir = path.join(root, 'assets'),
    outputDir = path.join(root, 'docs', 'api'),
    jsdocBin = path.join(
        root,
        'node_modules',
        'jsdoc',
        'jsdoc.js'
    );

if (!fs.existsSync(jsdocBin)) {
    console.error('JSDoc is not installed. Run `npm install` first.');
    process.exit(1);
}

fs.rmSync(outputDir, {force: true, recursive: true});

const
    result = spawnSync(
        process.execPath,
        [jsdocBin, '-c', configPath],
        {cwd: root, stdio: 'inherit'}
    );

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

if (fs.existsSync(assetsDir)) {
    copyDir(assetsDir, path.join(outputDir, 'assets'));
} else {
    console.warn('Warning: assets/ not found; README header image will be missing from docs.');
}

console.log(`Documentation written to ${path.relative(root, outputDir)}`);
