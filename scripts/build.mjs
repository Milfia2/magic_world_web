import { cp, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist');
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'styles.css', 'scene.css', 'favicon.svg']) {
  await copyFile(resolve(root, file), resolve(out, file));
}
for (const folder of ['js', 'assets', 'content']) {
  await cp(resolve(root, folder), resolve(out, folder), { recursive: true });
}
await writeFile(resolve(out, '.nojekyll'), '');
console.log('Built dist/ — static assets only, ready for GitHub Pages.');
