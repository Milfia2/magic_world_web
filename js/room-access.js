import { canVisitRoom } from './state.js';

// Invitations and visits live only in memory, never in saved progress or URLs.
export function createRoomAccess() {
  let invitation = null, visit = null;
  return {
    offer(host, guest, scene, window, visibleIds) {
      invitation = guest && host !== guest && visibleIds.includes(host) &&
        !['hall','map','select'].includes(scene) && !scene.startsWith('room/')
        ? { host, guest, scene, window } : null;
      return !!invitation;
    },
    enter(host, guest, scene, window) {
      if (!invitation || Object.entries({host,guest,scene,window}).some(([key,value])=>invitation[key]!==value)) return false;
      visit = {host,guest}; invitation = null; return true;
    },
    dismiss() { invitation = null; },
    sync(guest, route) {
      invitation = null;
      if (visit && (visit.guest !== guest || route !== `room/${visit.host}`)) visit = null;
    },
    canEnter(state, host) { return canVisitRoom(state,host,visit); },
    host(state, route) { return visit?.guest===state.character && route===`room/${visit.host}` ? visit.host : null; },
  };
}
