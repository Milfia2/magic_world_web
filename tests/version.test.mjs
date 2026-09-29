import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_VERSION, VERSION_HISTORY } from '../js/version.js';

test('displayed app version matches package metadata and the newest history entry',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.equal(APP_VERSION,pkg.version);
  assert.equal(VERSION_HISTORY[0].version,APP_VERSION);
  assert.match(APP_VERSION,/^\d+\.\d+\.\d+$/);
});

test('version history entries are unique and contain dated release notes',()=>{
  assert.equal(new Set(VERSION_HISTORY.map(item=>item.version)).size,VERSION_HISTORY.length);
  for(const release of VERSION_HISTORY){
    assert.match(release.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(release.title);
    assert.ok(release.changes.length>0);
  }
});
