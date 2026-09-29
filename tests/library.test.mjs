import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stories } from '../js/data.js';
import { readLibraryStory } from '../js/library-content.js';

test('the library exposes exactly the three supplied text files',()=>{
  assert.deepEqual(stories.map(({id,path})=>[id,path]),[
    ['report','./content/library/report.txt'],
    ['secret','./content/library/secret.txt'],
    ['secret2','./content/library/secret2.txt'],
  ]);
});

test('library reader returns every source file without changing its text',async()=>{
  for(const story of stories){
    const original=await readFile(new URL(`../${story.path}`,import.meta.url),'utf8');
    const loaded=await readLibraryStory(story.id,async path=>({ok:true,text:()=>readFile(new URL(`../${path}`,import.meta.url),'utf8')}));
    assert.equal(loaded,original);
  }
});

test('library reader rejects unknown and unavailable stories',async()=>{
  await assert.rejects(readLibraryStory('missing',()=>{throw new Error('should not fetch');}));
  await assert.rejects(readLibraryStory('report',async()=>({ok:false})));
});
