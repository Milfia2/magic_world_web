import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRoomAccess } from '../js/room-access.js';
import { readDiary, diaryAudience, DIARY_PATHS, ROOM_REACTIONS } from '../js/room-content.js';
import { AMBIENT_LINES, ambientLine } from '../js/ambient-dialogue.js';

const state={character:'abby',met:['thea','caleb','zephyr']};
function invited(){const access=createRoomAccess();access.offer('thea','abby','forest','day:1',['thea']);return access;}
test('only a visible ordinary-scene encounter offers a visit',()=>{
  const access=createRoomAccess();
  for(const scene of ['hall','map','select','room/thea'])assert.equal(access.offer('thea','abby',scene,'day:1',['thea']),false);
  assert.equal(access.offer('thea','abby','forest','day:1',[]),false);
  assert.equal(access.offer('abby','abby','forest','day:1',['abby']),false);
  assert.equal(access.canEnter(state,'thea'),false);
  assert.equal(access.canEnter(state,'abby'),true);
});
test('a guest can enter directly only while the host is in their room',()=>{
  const access=createRoomAccess();
  assert.equal(access.enterWhileHome('thea','abby',false),false);
  assert.equal(access.canEnter(state,'thea'),false);
  assert.equal(access.enterWhileHome('thea','abby',true),true);
  assert.equal(access.canEnter(state,'thea'),true);
  access.sync('abby','dorms');
  assert.equal(access.canEnter(state,'thea'),false);
});
test('the visit is bound to the host, guest, encounter location and time window',()=>{
  for(const args of [['caleb','abby','forest','day:1'],['thea','zephyr','forest','day:1'],['thea','abby','pitch','day:1'],['thea','abby','forest','day:2']])assert.equal(invited().enter(...args),false);
  const access=invited();assert.equal(access.enter('thea','abby','forest','day:1'),true);
  access.sync('abby','room/thea');assert.equal(access.host(state,'room/thea'),'thea');
  assert.equal(access.canEnter(state,'thea'),true);
  assert.equal(access.enter('thea','abby','forest','day:1'),false);
});
test('leaving, switching characters, dismissing an invitation, and reload revoke access',()=>{
  for(const [guest,route] of [['abby','dorms'],['abby','room/caleb'],['zephyr','room/thea']]){
    const access=invited();access.enter('thea','abby','forest','day:1');access.sync(guest,route);access.sync('abby','room/thea');
    assert.equal(access.canEnter(state,'thea'),false);
  }
  const access=invited();access.dismiss();assert.equal(access.enter('thea','abby','forest','day:1'),false);
  assert.equal(createRoomAccess().canEnter(state,'thea'),false);
});
test('all private and shared TXT diaries are packaged with distinct audience paths',async()=>{
  const privateTexts=[],sharedTexts=[];
  for(const id of Object.keys(DIARY_PATHS)){
    assert.equal(DIARY_PATHS[id].self,`./content/diaries/${id}_self.txt`);
    assert.equal(DIARY_PATHS[id].shared,`./content/diaries/${id}.txt`);
    const fetcher=async path=>({ok:true,text:()=>readFile(new URL('../'+path,import.meta.url),'utf8')});
    const privateText=await readDiary(id,'self',fetcher);
    const sharedText=await readDiary(id,'shared',fetcher);
    assert.ok(privateText.length>80);assert.ok(sharedText.length>80);
    assert.notEqual(privateText,sharedText);
    privateTexts.push(privateText);sharedTexts.push(sharedText);
    for(const item of ['diary','gift','window'])assert.ok(ROOM_REACTIONS[id][item].action&&ROOM_REACTIONS[id][item].text);
  }
  assert.equal(new Set(privateTexts).size,4);assert.equal(new Set(sharedTexts).size,4);
  await assert.rejects(readDiary('unknown','self',()=>{throw new Error('should not fetch');}));
  await assert.rejects(readDiary('abby','unknown',()=>{throw new Error('should not fetch');}));
  await assert.rejects(readDiary('abby','self',async()=>({ok:false})));
  await assert.rejects(readDiary('abby','shared',async()=>({ok:true,text:async()=>''})));
  assert.equal(await readDiary('abby','self',async()=>({ok:true,text:async()=>String.fromCharCode(0xfeff)+'<script>plain text</script>\n'})),'<script>plain text</script>');
});
test('diary audience is private for the player, shared for an invited guest, and otherwise denied',()=>{
  assert.equal(diaryAudience('abby','abby','atrium',false),'self');
  assert.equal(diaryAudience('thea','abby','room/thea',true),'shared');
  assert.equal(diaryAudience('thea','abby','room/thea',false),null);
  assert.equal(diaryAudience('thea','abby','atrium',true),null);
  assert.equal(diaryAudience('unknown','abby','room/unknown',true),null);
});
test('clicked small talk uses the supplied character voice without immediate repetition',()=>{
  for(const [id,lines] of Object.entries(AMBIENT_LINES)){
    let prior='';for(let i=0;i<15;i++){const line=ambientLine(id,prior,()=>i/15);assert.ok(lines.includes(line));assert.notEqual(line,prior);prior=line;}
  }
  assert.equal(ambientLine('missing'),'');
  assert.ok(AMBIENT_LINES.abby.includes('等等我！！！！'));
});
