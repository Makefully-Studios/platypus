import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const lib = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib');

fs.rmSync(lib, {recursive: true, force: true});
fs.mkdirSync(lib);
