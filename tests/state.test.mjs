import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, canVisitRoom, collectGift, giveGift, remember, resetProgress } from '../js/state.js';
const from = value => loadState({ getItem: () => JSON.stringify(value) });

test('new visitor and unavailable/corrupt storage can start safely', () => {
  assert.equal(loadState(null).character, null);
  assert.equal(loadState({getItem:()=>'{broken'}).character, null);
  assert.deepEqual(from({version:999}).pets, []);
});
test('saved progress is restored but invalid IDs and unsafe values are discarded', () => {
  const state=from({version:1,character:'thea',met:['abby','abby','invalid'],pets:['zephyr'],visited:['library','unknown'],read:['secret'],catches:-3,outfit:'script',diary:'a'.repeat(4500),petPositions:{thea:{niffler:{x:42,y:73},bad:{x:20,y:20}},abby:{fluffy:{x:-1,y:200}}}});
  assert.equal(state.character,'thea');assert.deepEqual(state.met,['abby']);assert.deepEqual(state.pets,['zephyr']);
  assert.deepEqual(state.visited,['library']);assert.deepEqual(state.read,['secret']);assert.equal(state.catches,0);
  assert.equal(state.outfit,'uniform');assert.equal(state.diary.length,4000);
  assert.deepEqual(state.petPositions.thea,{niffler:{x:42,y:73}});
  assert.deepEqual(state.petPositions.abby,{});
});
test('a prior encounter is not a room key; an active visit or owning the room is required', () => {
  const state=from({version:1,character:'abby'});
  assert.equal(canVisitRoom(state,'abby'),true);assert.equal(canVisitRoom(state,'caleb'),false);
  remember(state.met,'caleb');assert.equal(canVisitRoom(state,'caleb'),false);
  assert.equal(canVisitRoom(state,'caleb',{host:'caleb',guest:'abby'}),true);
  assert.equal(canVisitRoom(state,'caleb',{host:'caleb',guest:'thea'}),false);
  assert.equal(canVisitRoom(state,'unknown'),false);
});
test('a collected gift can be given only once and is consumed', () => {
  const state=loadState(null);
  assert.equal(giveGift(state,'thea'),false);
  collectGift(state,'thea');collectGift(state,'thea');assert.deepEqual(state.inventory,['thea']);
  assert.equal(giveGift(state,'thea'),true);assert.deepEqual(state.inventory,[]);assert.deepEqual(state.gifts,['thea']);
  assert.equal(giveGift(state,'thea'),false);
});
test('progress remains stable across save/reload and character switching', () => {
  const state=from({version:1,character:'abby',diary:'今天遇見了一位新朋友。',catches:2});
  remember(state.read,'report');remember(state.read,'report');remember(state.pets,'caleb');
  state.character='zephyr';const restored=from(state);
  assert.equal(restored.character,'zephyr');assert.deepEqual(restored.read,['report']);
  assert.deepEqual(restored.pets,['caleb']);assert.equal(restored.diary,state.diary);assert.equal(restored.catches,2);
});
test('reset returns every saved field to a fresh visitor state',()=>{
  const state=from({version:1,character:'thea',met:['abby'],greeted:['thea:abby'],visited:['library'],inventory:['abby'],pets:['caleb'],read:['report'],gifts:['zephyr'],outfit:'cat',catches:5,diary:'秘密'});
  const same=resetProgress(state);
  assert.equal(same,state);
  assert.deepEqual(state,loadState(null));
});
