import { characters, places, stories } from './data.js';
export const STORAGE_KEY = 'magic-world:v1';
const ids = characters.map(c => c.id);
const fresh = () => ({ version: 1, character: null, met: [], visited: [], inventory: [], pets: [], read: [], gifts: [], outfit: 'uniform', catches: 0, diary: '' });
const selectList = (value, allowed) => Array.isArray(value) ? [...new Set(value.filter(x => allowed.includes(x)))] : [];
export function loadState(storage) {
  const defaults = fresh();
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || raw.version !== 1) return defaults;
    return { ...defaults, character: ids.includes(raw.character) ? raw.character : null,
      met: selectList(raw.met, ids), visited: selectList(raw.visited, places.map(p => p.id)),
      inventory: selectList(raw.inventory, ids), pets: selectList(raw.pets, ids),
      read: selectList(raw.read, stories.map(s => s.id)), gifts: selectList(raw.gifts, ids),
      outfit: ['uniform', 'chibi', 'cat'].includes(raw.outfit) ? raw.outfit : 'uniform',
      catches: Number.isSafeInteger(raw.catches) && raw.catches >= 0 ? raw.catches : 0,
      diary: typeof raw.diary === 'string' ? raw.diary.slice(0, 4000) : '' };
  } catch { return defaults; }
}
export function remember(list, id) { if (!list.includes(id)) list.push(id); }
export function canVisitRoom(state, id, visit = null) {
  return ids.includes(id) && !!state.character && (state.character === id || (visit?.host === id && visit.guest === state.character));
}
export function collectGift(state, id) { remember(state.inventory, id); }
export function giveGift(state, id) {
  if (!state.inventory.includes(id) || state.gifts.includes(id)) return false;
  state.inventory = state.inventory.filter(item => item !== id);
  remember(state.gifts, id);
  return true;
}
