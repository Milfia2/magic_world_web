import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleWindow, dailyLocations, scheduledRoster, residentsForScene } from '../js/schedule.js';
import { SPAWN_POINTS, LOCATION_PREFERENCES } from '../js/character-spawns.js';

const ids=Object.keys(LOCATION_PREFERENCES);
test('a local three-hour window stays stable across reloads and ends at the next boundary',()=>{
  const early=new Date(2026,8,23,9,0), late=new Date(2026,8,23,11,59,59);
  assert.deepEqual(scheduledRoster(early),scheduledRoster(late));
  assert.equal(scheduleWindow(late).next.getTime(),new Date(2026,8,23,12).getTime());
  assert.equal(scheduleWindow(new Date(2026,11,31,23)).next.getTime(),new Date(2027,0,1).getTime());
  assert.notEqual(scheduleWindow(late).key,scheduleWindow(new Date(2026,8,23,12)).key);
});
test('each character occupies exactly one valid scene and a distinct candidate point',()=>{
  for(let day=1;day<=60;day++)for(let hour=0;hour<24;hour+=3){
    const roster=scheduledRoster(new Date(2026,8,day,hour));
    assert.deepEqual(roster.map(p=>p.id),ids);
    assert.equal(new Set(roster.map(p=>`${p.scene}:${p.point.name}`)).size,4);
    for(const p of roster){
      assert.ok(LOCATION_PREFERENCES[p.id][p.scene]);
      assert.ok(SPAWN_POINTS[p.scene].includes(p.point));
      if(p.scene.startsWith('room/'))assert.equal(p.scene,`room/${p.id}`);
    }
  }
});
test('each same-day period changes location, and character preferences affect frequency',()=>{
  const count=Object.fromEntries(ids.map(id=>[id,{}]));
  for(let day=1;day<=90;day++)for(const id of ids){
    const route=dailyLocations(id,new Date(2026,8,day));
    for(let i=0;i<route.length;i++){
      if(i)assert.notEqual(route[i],route[i-1]);
      count[id][route[i]]=(count[id][route[i]]||0)+1;
    }
  }
  assert.ok(count.abby.classroom>count.abby.dorms);
  assert.ok(count.thea.forest>count.thea.classroom);
  assert.ok(count.gaile.library>count.gaile.pitch);
  assert.ok(count.zephyr.pitch>count.zephyr.library);
});
test('the selected player never appears in ordinary scenes, map or private room',()=>{
  for(const selected of ids)for(let hour=0;hour<24;hour+=3){
    const date=new Date(2026,8,23,hour);
    const all=Object.keys(SPAWN_POINTS).flatMap(scene=>residentsForScene(scene,selected,date));
    assert.equal(all.length,3);
    assert.equal(all.some(p=>p.id===selected),false);
    assert.deepEqual(residentsForScene(`room/${selected}`,selected,date),[]);
    assert.deepEqual(residentsForScene('map',selected,date),[]);
    assert.deepEqual(residentsForScene('select',selected,date),[]);
  }
});
test('changing the player does not relocate the remaining characters',()=>{
  const date=new Date(2026,8,23,9);
  for(const person of scheduledRoster(date))for(const selected of ids.filter(id=>id!==person.id)){
    assert.deepEqual(residentsForScene(person.scene,selected,date).find(p=>p.id===person.id),person);
  }
});
test('the ordinary pitch can host scheduled residents while most scenes remain empty',()=>{
  let pitchEncounters=0;
  for(let day=1;day<=30;day++)for(let hour=0;hour<24;hour+=3){
    const date=new Date(2026,8,day,hour);
    pitchEncounters+=residentsForScene('pitch','abby',date).length;
    const populated=Object.keys(SPAWN_POINTS).filter(scene=>residentsForScene(scene,'abby',date).length);
    assert.ok(populated.length<=3);
  }
  assert.ok(pitchEncounters>0);
});
