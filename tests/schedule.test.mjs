import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleWindow, dailyLocations, scheduledRoster, residentsForScene } from '../js/schedule.js';
import { SPAWN_POINTS, LOCATION_PREFERENCES, SCHEDULE_HOURS } from '../js/character-spawns.js';

const ids=Object.keys(LOCATION_PREFERENCES);
test('the configured local schedule window stays stable and ends at the next boundary',()=>{
  const start=Math.floor(9/SCHEDULE_HOURS)*SCHEDULE_HOURS;
  const early=new Date(2026,8,23,start,0), late=new Date(2026,8,23,start+SCHEDULE_HOURS,0,0,-1);
  const boundary=new Date(2026,8,23,start+SCHEDULE_HOURS);
  assert.deepEqual(scheduledRoster(early),scheduledRoster(late));
  assert.equal(scheduleWindow(late).next.getTime(),boundary.getTime());
  assert.equal(scheduleWindow(new Date(2026,11,31,23)).next.getTime(),new Date(2027,0,1).getTime());
  assert.notEqual(scheduleWindow(late).key,scheduleWindow(boundary).key);
});
test('each character occupies exactly one valid scene and a distinct candidate point',()=>{
  let rerouted=0;
  for(let day=1;day<=60;day++)for(let hour=0;hour<24;hour+=SCHEDULE_HOURS){
    const date=new Date(2026,8,day,hour);
    const roster=scheduledRoster(date);
    assert.deepEqual(roster.map(p=>p.id),ids);
    assert.equal(new Set(roster.map(p=>`${p.scene}:${p.point.name}`)).size,4);
    for(const p of roster){
      if(p.scene!==dailyLocations(p.id,date)[scheduleWindow(date).slot])rerouted++;
      assert.ok(LOCATION_PREFERENCES[p.id][p.scene]);
      assert.ok(SPAWN_POINTS[p.scene].includes(p.point));
      if(p.scene.startsWith('room/'))assert.equal(p.scene,`room/${p.id}`);
    }
  }
  assert.ok(rerouted>0);
});
test('each same-day period changes location, and character preferences affect frequency',()=>{
  const count=Object.fromEntries(ids.map(id=>[id,{}]));
  for(let day=1;day<=90;day++)for(const id of ids){
    const route=dailyLocations(id,new Date(2026,8,day));
    for(let i=0;i<route.length;i++){
      if(i)assert.notEqual(route[i],route[i-1]);
      assert.ok(SPAWN_POINTS[route[i]]?.length);
      count[id][route[i]]=(count[id][route[i]]||0)+1;
    }
  }
  assert.ok(count.abby.classroom>count.abby.dorms);
  assert.ok(count.thea.forest>count.thea.classroom);
  assert.ok(count.caleb.library>count.caleb.pitch);
  assert.ok(count.zephyr.pitch>count.zephyr.library);
});
test('the selected player never appears in ordinary scenes, map or private room',()=>{
  for(const selected of ids)for(let hour=0;hour<24;hour+=SCHEDULE_HOURS){
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
  for(let day=1;day<=30;day++)for(let hour=0;hour<24;hour+=SCHEDULE_HOURS){
    const date=new Date(2026,8,day,hour);
    pitchEncounters+=residentsForScene('pitch','abby',date).length;
    const populated=Object.keys(SPAWN_POINTS).filter(scene=>residentsForScene(scene,'abby',date).length);
    assert.ok(populated.length<=3);
  }
  assert.ok(pitchEncounters>0);
});
test('an invited character takes the destination and displaces its scheduled occupant',()=>{
  let date, occupant;
  search: for(let day=1;day<=30;day++)for(let hour=0;hour<24;hour+=SCHEDULE_HOURS){
    const candidate=new Date(2026,8,day,hour);
    occupant=scheduledRoster(candidate).find(person=>person.scene==='observatory');
    if(occupant){date=candidate;break search;}
  }
  assert.ok(date&&occupant);
  const invited=ids.find(id=>id!==occupant.id);
  const roster=scheduledRoster(date,new Map([[invited,'observatory']]));
  assert.equal(roster.find(person=>person.id===invited).scene,'observatory');
  assert.notEqual(roster.find(person=>person.id===occupant.id).scene,'observatory');
  assert.equal(new Set(roster.map(person=>`${person.scene}:${person.point.name}`)).size,4);
  assert.deepEqual(residentsForScene('observatory',null,date,new Map([[invited,'observatory']])).map(person=>person.id),[invited]);
});
