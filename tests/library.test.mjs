import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stories } from '../js/data.js';
import { readLibraryStory } from '../js/library-content.js';

test('the library exposes all four supplied text files',()=>{
  assert.deepEqual(stories.map(({id,path})=>[id,path]),[
    ['report','./content/library/report.txt'],
    ['report2','./content/library/report2.txt'],
    ['secret','./content/library/secret.txt'],
    ['secret2','./content/library/secret2.txt'],
  ]);
});

test('both reports are ordered columns by the same author',()=>{
  const reports=stories.filter(story=>story.series==='最前線記者專欄');
  assert.deepEqual(reports.map(({id,column})=>[id,column]),[['report',1],['report2',2]]);
  assert.equal(new Set(reports.map(story=>story.author)).size,1);
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
