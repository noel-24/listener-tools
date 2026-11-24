import { mkdir, readdir, readFile, writeFile, copyFile } from 'node:fs/promises';
const publicDir = new URL('../public/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
const assets = {};
async function collect(relative = '') {
    for (const entry of await readdir(new URL(relative, publicDir), { withFileTypes: true })) {
        const path = relative + entry.name;
        if (entry.isDirectory()) await collect(path + '/');
        else assets['/' + path] = await readFile(new URL(path, publicDir), 'utf8');
    }
}
await collect();
await mkdir(output, { recursive: true });
await writeFile(new URL('assets.js', output), 'export default ' + JSON.stringify(assets));
await writeFile(new URL('channels.js', output), 'export default ' + await readFile(new URL('../data/channels.json', import.meta.url), 'utf8'));
await copyFile(new URL('../worker.js', import.meta.url), new URL('worker.js', output));
