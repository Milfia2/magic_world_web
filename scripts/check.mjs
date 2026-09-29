import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { characters, places, stories, asset } from '../js/data.js';
import { DIARY_PATHS } from '../js/room-content.js';
import { PETS } from '../js/pets.js';
const root = resolve(import.meta.dirname, '..');
await access(resolve(root,asset('hall')));
for(const pet of PETS)for(const image of [pet.image,pet.wildImage,pet.happyImage])await access(resolve(root,image));
for(const story of stories)await access(resolve(root,story.path));
execFileSync(process.execPath, ['--check', resolve(root, 'js/pets.js')], { stdio: 'inherit' });
execFileSync(process.execPath, ['--check', resolve(root, 'js/greetings.js')], { stdio: 'inherit' });
execFileSync(process.execPath, ['--check', resolve(root, 'js/head-conversation.js')], { stdio: 'inherit' });
for (const file of ['js/app.js', 'js/data.js', 'js/dialogue.js', 'js/state.js', 'js/scene-layout.js', 'js/character-spawns.js', 'js/schedule.js', 'js/flight.js', 'js/hall-pets.js', 'js/agent-tools.js', 'js/room-access.js', 'js/room-content.js', 'js/library-content.js', 'js/ambient-dialogue.js', 'js/version.js', 'scripts/build.mjs', 'scripts/serve.mjs']) {
  execFileSync(process.execPath, ['--check', resolve(root, file)], { stdio: 'inherit' });
}
const imageIds = ['map', 'office', 'snitch', 'record-paper', ...places.map(p => p.id), ...characters.flatMap(c => ['', '-chibi', '-cat', '-room', '-record', '-riding'].map(s => c.id + s))];
for (const id of imageIds) await access(resolve(root, asset(id)));
for (const paths of Object.values(DIARY_PATHS)) for (const file of Object.values(paths)) await access(resolve(root, file));
for (const file of ['index.html', 'styles.css', 'scene.css', 'js/app.js', 'js/data.js']) {
  const content = await readFile(resolve(root, file), 'utf8');
  if (/(?:src|href)=["']\/(?!\/)|url\(["']?\/(?!\/)/.test(content)) throw new Error(`${file}: origin-root URL breaks GitHub repository subpaths`);
}
console.log(`Syntax valid; ${new Set(imageIds).size} referenced images exist; URLs support GitHub Pages subpaths.`);
