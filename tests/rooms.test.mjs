import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRoomAccess } from '../js/room-access.js';
import { readDiary, DIARY_PATHS, ROOM_REACTIONS } from '../js/room-content.js';
import { AMBIENT_LINES, ambientLine } from '../js/ambient-dialogue.js';

const state={character:'abby',met:['thea','gaile','zephyr']};
function invited(){const access=createRoomAccess();access.offer('thea','abby','forest','day:1',['thea']);return access;}
test('only a visible ordinary-scene encounter offers a visit',()=>{
  const access=createRoomAccess();
  for(const scene of ['hall','map','select','room/thea'])assert.equal(access.offer('thea','abby',scene,'day:1',['thea']),false);
  assert.equal(access.offer('thea','abby','forest','day:1',[]),false);
  assert.equal(access.offer('abby','abby','forest','day:1',['abby']),false);
  assert.equal(access.canEnter(state,'thea'),false);
  assert.equal(access.canEnter(state,'abby'),true);
});
test('the visit is bound to the host, guest, encounter location and time window',()=>{
  for(const args of [['gaile','abby','forest','day:1'],['thea','zephyr','forest','day:1'],['thea','abby','pitch','day:1'],['thea','abby','forest','day:2']])assert.equal(invited().enter(...args),false);
  const access=invited();assert.equal(access.enter('thea','abby','forest','day:1'),true);
  access.sync('abby','room/thea');assert.equal(access.host(state,'room/thea'),'thea');
  assert.equal(access.canEnter(state,'thea'),true);
  assert.equal(access.enter('thea','abby','forest','day:1'),false);
});
test('leaving, switching characters, dismissing an invitation, and reload revoke access',()=>{
  for(const [guest,route] of [['abby','dorms'],['abby','room/gaile'],['zephyr','room/thea']]){
    const access=invited();access.enter('thea','abby','forest','day:1');access.sync(guest,route);access.sync('abby','room/thea');
    assert.equal(access.canEnter(state,'thea'),false);
  }
  const access=invited();access.dismiss();assert.equal(access.enter('thea','abby','forest','day:1'),false);
  assert.equal(createRoomAccess().canEnter(state,'thea'),false);
});
test('all four TXT diaries are packaged text and every room object has its owner response',async()=>{
  const texts=[];
  for(const id of Object.keys(DIARY_PATHS)){
    const text=await readDiary(id,async path=>({ok:true,text:()=>readFile(new URL('../'+path,import.meta.url),'utf8')}));
    assert.ok(text.length>80);texts.push(text);
    for(const item of ['diary','gift','window'])assert.ok(ROOM_REACTIONS[id][item].action&&ROOM_REACTIONS[id][item].text);
  }
  assert.equal(new Set(texts).size,4);
  await assert.rejects(readDiary('unknown',()=>{throw new Error('should not fetch');}));
  await assert.rejects(readDiary('abby',async()=>({ok:false})));
  await assert.rejects(readDiary('abby',async()=>({ok:true,text:async()=>''})));
  assert.equal(await readDiary('abby',async()=>({ok:true,text:async()=>'\uFEFF<script>plain text</script>\n'})),'<script>plain text</script>');
});
test('head bubbles use the supplied character voice and avoid immediately repeating lines',()=>{
  for(const [id,lines] of Object.entries(AMBIENT_LINES)){
    let prior='';for(let i=0;i<15;i++){const line=ambientLine(id,prior,()=>i/15);assert.ok(lines.includes(line));assert.notEqual(line,prior);prior=line;}
  }
  assert.equal(ambientLine('missing'),'');
  assert.ok(AMBIENT_LINES.abby.includes('等等我！！！！'));
});
