import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const
    version = process.argv[2],
    root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    changelogPath = path.join(root, 'CHANGELOG.md');

if (!version) {
    console.error('Usage: node scripts/extract-changelog.mjs <version>');
    process.exit(1);
}

const
    changelog = fs.readFileSync(changelogPath, 'utf8'),
    escaped = version.replace(/\./g, '\\.'),
    pattern = new RegExp(
        `^## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|\\Z)`,
        'm'
    ),
    match = changelog.match(pattern);

if (!match) {
    console.error(`No CHANGELOG.md section found for version ${version}.`);
    process.exit(1);
}

process.stdout.write(`## ${version}\n\n${match[1].trim()}\n`);
