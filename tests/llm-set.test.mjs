import { test as nodeTest } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root=new URL('../llm_set/',import.meta.url);
const available=await access(new URL('manifest.json',root)).then(()=>true,()=>false);
const test=(name,fn)=>nodeTest(name,{skip:!available && 'Private backend documents are installed locally, not in Git.'},fn);
const manifest=available?JSON.parse(await readFile(new URL('manifest.json',root),'utf8')):null;
const ids=['abby','gaile','thea','zephyr'];

test('LLM manifest always loads only the short common world prompt',async()=>{
  assert.equal(manifest.always,'./prompts/world.md');
  const world=await readFile(new URL(manifest.always,root),'utf8');
  assert.ok(world.length>100&&world.length<1200);
  assert.doesNotMatch(world,/Abby Perkins|Caleb Bradley|Thea Holmes|Zephyr｜/);
});

test('each speaker has separate short, full, optional examples, and recent memory files',async()=>{
  assert.deepEqual(Object.keys(manifest.characters),ids);
  for(const id of ids){
    const entry=manifest.characters[id];
    assert.notEqual(entry.short,entry.full);
    for(const key of ['short','full','examples','recent_memory'])await access(new URL(entry[key],root));
    const recent=JSON.parse(await readFile(new URL(entry.recent_memory,root),'utf8'));
    assert.equal(recent.character_id,id);
    assert.ok(Array.isArray(recent.events));
    assert.ok(recent.events.length<=manifest.recent_memory_limit.max);
  }
});

test('relationship routing contains exactly one file for every character pair',async()=>{
  assert.equal(Object.keys(manifest.relationships).length,6);
  const seen=new Set();
  for(const [pair,path] of Object.entries(manifest.relationships)){
    const participants=pair.split(':');
    assert.equal(participants.length,2);
    assert.ok(participants.every(id=>ids.includes(id)));
    assert.equal(new Set(participants).size,2);
    const canonical=[...participants].sort((a,b)=>ids.indexOf(a)-ids.indexOf(b)).join(':');
    assert.equal(pair,canonical);assert.equal(seen.has(pair),false);seen.add(pair);
    await access(new URL(path,root));
  }
});

test('assembly order keeps examples optional and scopes profiles to the current speaker',()=>{
  assert.match(manifest.profile_policy,/exactly one/i);
  assert.deepEqual(manifest.recent_memory_limit,{min:3,max:10,allow_fewer_when_unavailable:true});
  assert.ok(manifest.assembly_order.includes('current_character.short_or_full'));
  assert.ok(manifest.assembly_order.includes('relationships.for_current_participants_only'));
  assert.equal(manifest.assembly_order.at(-1),'current_character.examples.optional');
});
