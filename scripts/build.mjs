import { cp, mkdir, copyFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist');
// Refuse stale private files rather than accidentally uploading them with Pages.
for (const folder of ['llm_set', 'local-chat', '.local-llm']) {
  const present = await access(resolve(out, folder)).then(() => true, () => false);
  if (present) throw new Error(`Private backend folder found in dist/${folder}; remove it before building.`);
}
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'styles.css', 'scene.css', 'favicon.svg']) {
  await copyFile(resolve(root, file), resolve(out, file));
}
for (const folder of ['js', 'assets', 'content']) {
  await cp(resolve(root, folder), resolve(out, folder), { recursive: true });
}
await writeFile(resolve(out, '.nojekyll'), '');
console.log('Built dist/ — static assets only, ready for GitHub Pages.');
