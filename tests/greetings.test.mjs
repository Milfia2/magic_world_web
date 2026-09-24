import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, beginGreeting } from '../js/state.js';
import { GREETINGS, greetingFor } from '../js/greetings.js';
import { readFile } from 'node:fs/promises';
import { placeHeadBubble } from '../js/head-conversation.js';
import { AMBIENT_LINES, clickedDialogue, distinctDialogue } from '../js/ambient-dialogue.js';

test('all twelve pairings greet the silent player with NPC-only dialogue',()=>{
  const lines=[];
  for(const player of ['abby','thea','gaile','zephyr'])for(const speaker of ['abby','thea','gaile','zephyr']){
    const line=greetingFor(player,speaker);
    if(player===speaker){assert.equal(line,null);continue;}
    assert.ok(line.action&&line.text);assert.equal('playerText' in line,false);lines.push(line.text);
    assert.equal(line,GREETINGS[player][speaker]);
  }
  assert.equal(new Set(lines).size,12);
  assert.equal(greetingFor(null,'abby'),null);
});
test('first greetings are per selected role, saved across reloads, and never self-greetings',()=>{
  const state=loadState(null);state.character='abby';
  assert.equal(beginGreeting(state,'thea'),true);
  assert.equal(beginGreeting(state,'thea'),false);
  const restored=loadState({getItem:()=>JSON.stringify(state)});
  assert.equal(beginGreeting(restored,'thea'),false);
  restored.character='gaile';assert.equal(beginGreeting(restored,'thea'),true);
  assert.equal(beginGreeting(restored,'gaile'),false);
  assert.equal(beginGreeting(restored,'bad'),false);
  assert.equal(beginGreeting(loadState(null),'abby'),false);
});
test('old encounters do not erase new greeting content and malformed pairs are ignored',()=>{
  const old=loadState({getItem:()=>JSON.stringify({version:1,character:'abby',met:['thea']})});
  assert.equal(beginGreeting(old,'thea'),true);
  const state=loadState({getItem:()=>JSON.stringify({version:1,greeted:['abby:thea','abby:thea','abby:abby','bad:thea',null]})});
  assert.deepEqual(state.greeted,['abby:thea']);
});
test('ordinary scenes no longer mount a timer-driven speech controller',async()=>{
  const source=await readFile(new URL('../js/ambient-dialogue.js',import.meta.url),'utf8');
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/setTimeout|setInterval/);
  assert.doesNotMatch(app,/mountAmbientSpeech/);
  assert.match(app,/showRoomConversation/);
  assert.match(app,/mountHeadConversation/);
  assert.doesNotMatch(app,/greeting\.playerText|player-greeting/);
});
test('head dialogue remains above the portrait and within narrow viewport edges',()=>{
  for(const width of [320,390,1280])for(const x of [0,width/2,width-50]){
    const p=placeHeadBubble({left:x,top:250,width:50},{width:280,height:100},{width,height:800});
    assert.ok(p.left>=8&&p.left+280<=width-8);
    assert.equal(p.top,138);assert.ok(p.tail>=16&&p.tail<=264);
  }
});
test('clicking the same character can advance to a different available line',()=>{
  const lines=[{text:'same'},{text:'same'},{text:'new'}];let index=0;
  assert.equal(distinctDialogue(()=>lines[Math.min(index++,2)],'same').text,'new');
  assert.equal(distinctDialogue(()=>({text:'only'}),'only',3).text,'only');
  const primary={action:'整理了一下辮子。',text:'場景台詞'};
  const next=clickedDialogue('thea',primary,'場景台詞',()=>0);
  assert.notEqual(next.text,'場景台詞');
  assert.ok(AMBIENT_LINES.thea.includes(next.text));
  assert.equal(next.action,'');
});
test('head conversation closes from an outside pointer without treating the character as outside',async()=>{
  const source=await readFile(new URL('../js/head-conversation.js',import.meta.url),'utf8');
  assert.match(source,/addEventListener\('pointerdown',outside,true\)/);
  assert.match(source,/!bubble\.contains\(e\.target\).*!menu\.contains\(e\.target\).*!anchor\.contains\(e\.target\)/);
  assert.doesNotMatch(source,/head-close|結束頭頂對話/);
});
