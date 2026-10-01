import { LOCATION_PREFERENCES, SPAWN_POINTS, SCHEDULE_HOURS } from './character-spawns.js';
import { shuffled } from './scene-layout.js';

function hash(text) {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}
function randomFor(key) {
  let seed = hash(key);
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function scheduleWindow(date = new Date()) {
  const day = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
  const slot = Math.floor(date.getHours() / SCHEDULE_HOURS);
  const next = new Date(date);
  next.setHours((slot + 1) * SCHEDULE_HOURS, 0, 0, 0);
  return { day, slot, key: `${day}:${slot}`, next };
}
function pickLocation(id, day, slot, previous) {
  const hour = slot * SCHEDULE_HOURS;
  const candidates = Object.entries(LOCATION_PREFERENCES[id]).filter(([scene]) =>
    scene !== previous && SPAWN_POINTS[scene]?.length && (!scene.startsWith('room/') || scene === `room/${id}`));
  const weighted = candidates.map(([scene, weight]) => [scene, weight * (scene.startsWith('room/') && (hour >= 21 || hour < 6) ? 3 : 1)]);
  let roll = randomFor(`${id}:${day}:${slot}:location`)() * weighted.reduce((sum,[,weight])=>sum+weight,0);
  for (const [scene,weight] of weighted) { roll -= weight; if (roll < 0) return scene; }
  return weighted.at(-1)[0];
}
export function dailyLocations(id, date = new Date()) {
  const { day } = scheduleWindow(date);
  const locations=[];
  for (let slot=0;slot<24/SCHEDULE_HOURS;slot++) locations.push(pickLocation(id,day,slot,locations.at(-1)));
  return locations;
}
function fallbackScenes(id, primary, key) {
  const result=SPAWN_POINTS[primary]?.length?[primary]:[];
  const pool=Object.entries(LOCATION_PREFERENCES[id]).filter(([scene])=>scene!==primary&&SPAWN_POINTS[scene]?.length);
  const random=randomFor(`${key}:${id}:overflow`);
  while(pool.length){
    let roll=random()*pool.reduce((sum,[,weight])=>sum+weight,0),index=pool.length-1;
    for(let i=0;i<pool.length;i++){roll-=pool[i][1];if(roll<0){index=i;break;}}
    result.push(pool.splice(index,1)[0][0]);
  }
  return result;
}
function allocateScenes(roster,key){
  const used=new Map(),assigned=new Map();
  const order=shuffled(roster,randomFor(`${key}:assignment-order`)).sort((a,b)=>b.priority-a.priority);
  for(const person of order){
    const scene=fallbackScenes(person.id,person.scene,key).find(candidate=>(used.get(candidate)||0)<(SPAWN_POINTS[candidate]?.length||0));
    if(!scene)throw new Error(`No available scene for ${person.id}`);
    used.set(scene,(used.get(scene)||0)+1);assigned.set(person.id,scene);
  }
  return roster.map(person=>({id:person.id,scene:assigned.get(person.id)}));
}
export function scheduledRoster(date = new Date(), overrides = new Map()) {
  const {slot,key}=scheduleWindow(date);
  const entries=overrides instanceof Map?[...overrides.entries()]:Object.entries(overrides||{});
  const requested=new Map(entries.filter(([,scene])=>SPAWN_POINTS[scene]?.length&&!scene.startsWith('room/')));
  const priorities=new Map([...requested.keys()].map((id,index)=>[id,index+1]));
  const preferred=Object.keys(LOCATION_PREFERENCES).map(id=>({id,scene:requested.get(id)||dailyLocations(id,date)[slot],priority:priorities.get(id)||0}));
  const roster=allocateScenes(preferred,key);
  const occupied=new Map();
  return roster.map(person=>{
    if (!occupied.has(person.scene)) occupied.set(person.scene,shuffled(SPAWN_POINTS[person.scene],randomFor(`${key}:${person.scene}:spots`)));
    const spots=occupied.get(person.scene);
    return {...person,point:spots.shift()};
  });
}
export function residentsForScene(scene, selected, date = new Date(), overrides = new Map()) {
  if (scene === 'map' || scene === 'select') return [];
  return scheduledRoster(date,overrides).filter(person=>person.scene===scene && person.id!==selected &&
    (!scene.startsWith('room/') || scene===`room/${person.id}`));
}
