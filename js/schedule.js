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
    scene !== previous && (!scene.startsWith('room/') || scene === `room/${id}`));
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
export function scheduledRoster(date = new Date()) {
  const {slot,key}=scheduleWindow(date);
  const roster=Object.keys(LOCATION_PREFERENCES).map(id=>({id,scene:dailyLocations(id,date)[slot]}));
  const occupied=new Map();
  return roster.map(person=>{
    if (!occupied.has(person.scene)) occupied.set(person.scene,shuffled(SPAWN_POINTS[person.scene],randomFor(`${key}:${person.scene}:spots`)));
    const spots=occupied.get(person.scene);
    return {...person,point:spots.shift()};
  });
}
export function residentsForScene(scene, selected, date = new Date()) {
  if (scene === 'map' || scene === 'select') return [];
  return scheduledRoster(date).filter(person=>person.scene===scene && person.id!==selected &&
    (!scene.startsWith('room/') || scene===`room/${person.id}`));
}
