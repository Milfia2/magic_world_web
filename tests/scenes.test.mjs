import test from 'node:test';
import assert from 'node:assert/strict';
import { otherCharacters, projectObject, scatterCharacters, sceneObjects } from '../js/scene-layout.js';
import { constrainFlight, depthScale } from '../js/flight.js';
import { characters } from '../js/data.js';
import { dialogueFor } from '../js/dialogue.js';
function seeded(seed) { return () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }
const ids=characters.map(c=>c.id);
test('every selected identity excludes only that character from encounters',()=>{
  ids.forEach(id=>{const others=otherCharacters(ids,id);assert.equal(others.length,3);assert.equal(others.includes(id),false);});
  assert.equal(otherCharacters(ids,null).length,4);
});
test('objects follow the bottom-aligned background cover projection on both aspect ratios',()=>{
  const object={x:53,y:65,w:20,h:14};
  assert.deepEqual(projectObject(object,{width:1000,height:750},{width:1000,height:750}),{x:530,y:487.5,width:200,height:105});
  assert.deepEqual(projectObject(object,{width:1000,height:750},{width:1000,height:500}),{x:530,y:237.5,width:200,height:105});
  const mobile=projectObject(object,{width:1000,height:750},{width:360,height:270});
  assert.equal(mobile.x,190.8);assert.equal(mobile.y,175.5);
});
test('encounters stay in bounds, avoid each other and the desk interaction across desktop and mobile sizes',()=>{
  for(const viewport of [{width:1280,height:720},{width:360,height:270},{width:320,height:240}]) {
    const item=projectObject(sceneObjects.office[0],{width:1448,height:1086},viewport);
    const obstacle={x:item.x-item.width/2,y:item.y-item.height/2,width:item.width,height:item.height};
    for(let seed=1;seed<=30;seed++) {
      const result=scatterCharacters(ids.slice(1),viewport,[obstacle],seeded(seed));
      for(const [i,p] of result.entries()) {
        assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=viewport.width&&p.y+p.height<=viewport.height);
        const overlap=q=>p.x<q.x+q.width&&p.x+p.width>q.x&&p.y<q.y+q.height&&p.y+p.height>q.y;
        assert.equal(overlap(obstacle),false);
        assert.equal(result.slice(0,i).some(overlap),false);
      }
    }
  }
});
test('the Q hall scatter helper can produce varied placements',()=>{
  const a=scatterCharacters(ids.slice(1),{width:1280,height:720},[],seeded(4));
  const b=scatterCharacters(ids.slice(1),{width:1280,height:720},[],seeded(28));
  assert.notDeepEqual(a,b);assert.deepEqual(a.map(p=>p.id),ids.slice(1));
});
test('flight depth changes apparent size and all movement remains in the viewport',()=>{
  assert.ok(depthScale(0)<depthScale(1));
  for(const width of [320,1280]) for(const depth of [-1,0,.5,1,3]) for(const x of [-100,2000]) for(const y of [-100,2000]) {
    const p=constrainFlight({x,y,depth},{width,height:width*.75},{width:100,height:100});
    const half=100*depthScale(p.depth)/2;
    assert.ok(p.depth>=0&&p.depth<=1);
    assert.ok(p.x-half>=0&&p.x+half<=width);
    assert.ok(p.y-half>=0&&p.y+half<=width*.75);
  }
});
test('every friendship pairing and conversation topic has distinct authored lines',()=>{
  const replies=new Set();
  for(const speaker of ids) for(const player of ids.filter(id=>id!==speaker)) {
    const speech=dialogueFor(speaker,player,'atrium','friends');assert.ok(speech.action&&speech.text);replies.add(speech.text);
  }
  assert.equal(replies.size,12);
  for(const topic of ['lost','upset','gift']) assert.equal(new Set(ids.map(id=>dialogueFor(id,null,'atrium',topic).text)).size,4);
  for(const id of ids)for(const scene of ['library','classroom','office','observatory','pitch','forest','village','room/abby'])assert.ok(dialogueFor(id,null,scene).text);
  assert.equal(characters.find(c=>c.id==='thea').english,'THEA HOLMES');
  assert.equal(characters.find(c=>c.id==='gaile').english,'CALEB BRADLEY');
});
