import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const
    root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    outputDir = path.join(root, 'docs', 'api'),
    repo = process.env.PLATYPUS_DOCS_REPO ?? 'https://github.com/Makefully-Studios/platypus.git',
    ghPagesBin = path.join(
        root,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'gh-pages.cmd' : 'gh-pages'
    );

const
    result = spawnSync(
        ghPagesBin,
        [
            '-d', outputDir,
            '-r', repo,
            '-b', 'gh-pages',
            '-m', 'Publish API docs'
        ],
        {cwd: root, stdio: 'inherit'}
    );

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

console.log('Published to https://makefully-studios.github.io/platypus/');
