import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {createHallContactTracker} from '../js/hall-interactions.js';
const pet=(id,x=0)=>({id,x,y:100,width:80,height:100});
test('supported pairs show packaged artwork regardless of ordering',async()=>{
  for(const [a,b] of [['abby','thea'],['caleb','abby'],['caleb','thea'],['thea','zephyr']]){
    for(const ids of [[a,b],[b,a]]){
      const events=[];createHallContactTracker(e=>events.push(e))(ids.map(id=>pet(id)),0);
      assert.equal(events.length,1);
      assert.equal(events[0].x,40);
      await access(new URL('../'+events[0].image,import.meta.url));
    }
  }
});
test('contact requires overlap and re-entry after cooldown, unsupported pairs stay silent',()=>{
  const events=[],update=createHallContactTracker(e=>events.push(e));
  update([pet('abby'),pet('thea',200)],0);assert.equal(events.length,0);
  update([pet('abby'),pet('thea',30)],10);assert.equal(events.length,1);
  update([pet('abby'),pet('thea',30)],5000);assert.equal(events.length,1);
  update([pet('abby'),pet('thea',200)],5100);
  update([pet('abby'),pet('thea',30)],5200);assert.equal(events.length,2);
  update([pet('abby'),pet('thea',200)],5300);
  update([pet('abby'),pet('thea',30)],5400);assert.equal(events.length,2);
  update([pet('abby'),pet('zephyr')],10000);assert.equal(events.length,2);
});
