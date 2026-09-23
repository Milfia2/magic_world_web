import { clamp } from './scene-layout.js';

export const depthScale = depth => .48 + clamp(depth, 0, 1) * .86;
export function constrainFlight(position, viewport, size) {
  const depth = clamp(position.depth, 0, 1);
  const scale = depthScale(depth);
  const halfW = Math.min(viewport.width / 2, size.width * scale / 2 + 5);
  const halfH = Math.min(viewport.height / 2, size.height * scale / 2 + 18);
  return { x: clamp(position.x, halfW, viewport.width - halfW), y: clamp(position.y, halfH, viewport.height - halfH), depth };
}

/** Scene-local controller; leaves saved character identity unchanged. */
export function createFlightController({ field, controls, selected, onTalk }) {
  const riders = [...field.querySelectorAll('.rider')];
  const keys = new Set();
  const lifetime = new AbortController();
  const listen = (target, event, fn, options = {}) => target.addEventListener(event, fn, { ...options, signal: lifetime.signal });
  const dimensions = () => ({ width: field.clientWidth, height: field.clientHeight });
  const positions = new Map();
  let active = selected, pointer = null, frame, last = 0, clock = 0, target = null;
  let paused = false;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const viewport = dimensions();
  riders.forEach((rider, i) => positions.set(rider.dataset.rider, { x: viewport.width * (.17 + i * .22), y: viewport.height * (.3 + (i % 2) * .31), depth: .15 + i * .2 }));
  function select(id, focus = false) {
    if (!positions.has(id)) return;
    active = id;
    riders.forEach(rider => {
      rider.classList.toggle('controlled', rider.dataset.rider === id);
      rider.setAttribute('aria-pressed', rider.dataset.rider === id);
    });
    controls.querySelectorAll('[data-pilot]').forEach(el => el.setAttribute('aria-pressed', el.dataset.pilot === id));
    controls.querySelector('#flight-depth').value = Math.round(positions.get(id).depth * 100);
    controls.querySelector('#pilot-name').textContent = riders.find(r => r.dataset.rider === id).dataset.name;
    if (focus) field.focus({ preventScroll: true });
  }
  function draw(rider) {
    const id = rider.dataset.rider, old = positions.get(id);
    const p = constrainFlight(old, dimensions(), { width: rider.offsetWidth, height: rider.offsetHeight });
    positions.set(id, p);
    rider.style.left = `${p.x}px`; rider.style.top = `${p.y}px`;
    rider.style.setProperty('--depth', depthScale(p.depth));
    rider.style.zIndex = 5 + Math.round(p.depth * 20);
    rider.dataset.depth = p.depth.toFixed(2);
  }
  function setDepth(depth) {
    positions.get(active).depth = clamp(depth, 0, 1);
    controls.querySelector('#flight-depth').value = Math.round(positions.get(active).depth * 100);
    riders.forEach(draw);
  }
  const bindings = { arrowleft:'left', a:'left', arrowright:'right', d:'right', arrowup:'up', w:'up', arrowdown:'down', s:'down', q:'far', e:'near' };
  listen(field, 'keydown', e => {
    if (e.target.matches('input,select,textarea')) return;
    const key = bindings[e.key.toLowerCase()];
    if (key) { e.preventDefault(); keys.add(key); }
  });
  listen(window, 'keyup', e => { const key = bindings[e.key.toLowerCase()]; if(key) keys.delete(key); });
  const clearInput = () => { keys.clear(); pointer = null; };
  listen(window, 'blur', clearInput);
  listen(document, 'visibilitychange', clearInput);
  listen(field, 'focusout', e => { if (!field.contains(e.relatedTarget)) keys.clear(); });
  listen(field, 'pointerdown', e => {
    if (e.target.closest('.snitch') || e.button !== 0) return;
    const rider = e.target.closest('[data-rider]');
    if (rider) select(rider.dataset.rider);
    field.focus({ preventScroll: true });
    const rect = field.getBoundingClientRect(), p = positions.get(active);
    pointer = { id: e.pointerId, dx: rider ? e.clientX - rect.left - p.x : 0, dy: rider ? e.clientY - rect.top - p.y : 0 };
    field.setPointerCapture(e.pointerId);
    movePointer(e);
  });
  function movePointer(e) {
    if (!pointer || pointer.id !== e.pointerId) return;
    const rect = field.getBoundingClientRect(), p = positions.get(active);
    p.x = e.clientX - rect.left - pointer.dx;
    p.y = e.clientY - rect.top - pointer.dy;
    riders.forEach(draw);
  }
  listen(field, 'pointermove', movePointer);
  listen(field, 'pointerup', clearInput);
  listen(field, 'pointercancel', clearInput);
  listen(field, 'lostpointercapture', clearInput);
  listen(field, 'click', e => { const rider = e.target.closest('[data-rider]'); if (rider) select(rider.dataset.rider); });
  listen(field, 'wheel', e => {
    if (document.activeElement !== field && !field.contains(document.activeElement)) return;
    e.preventDefault(); setDepth(positions.get(active).depth - e.deltaY * .001);
  }, { passive: false });
  listen(controls, 'click', e => {
    const pilot = e.target.closest('[data-pilot]'); if (pilot) select(pilot.dataset.pilot, true);
    const step = e.target.closest('[data-flight]');
    // Click/keyboard activation gets a discrete move in addition to press-and-hold.
    if (step) { advance(step.dataset.flight, .09); riders.forEach(draw); }
    if (e.target.closest('[data-flight-talk]')) onTalk(active);
    if (e.target.closest('[data-pause-flight]')) {
      paused = !paused;
      e.target.closest('[data-pause-flight]').textContent = paused ? '繼續同伴飛行' : '暫停同伴飛行';
    }
  });
  controls.querySelectorAll('[data-flight]').forEach(el => {
    listen(el, 'pointerdown', e => { e.preventDefault(); keys.add(el.dataset.flight); el.setPointerCapture(e.pointerId); });
    for (const event of ['pointerup','pointercancel','lostpointercapture']) listen(el, event, () => keys.delete(el.dataset.flight));
  });
  listen(controls.querySelector('#flight-depth'), 'input', e => setDepth(Number(e.target.value) / 100));
  function advance(direction, dt) {
    const p = positions.get(active), v = dimensions();
    const speed = Math.max(140, Math.min(v.width, v.height) * .55);
    if (direction === 'left') p.x -= speed * dt;
    if (direction === 'right') p.x += speed * dt;
    if (direction === 'up') p.y -= speed * dt;
    if (direction === 'down') p.y += speed * dt;
    if (direction === 'far') setDepth(p.depth - dt * .65);
    if (direction === 'near') setDepth(p.depth + dt * .65);
  }
  function tick(now) {
    const dt = Math.min((now - (last || now)) / 1000, .04); last = now;
    const modalOpen = document.querySelector('dialog[open]');
    if (!document.hidden && !modalOpen) {
      clock += dt;
      keys.forEach(key => advance(key, dt));
      riders.forEach((rider, index) => {
        if (rider.dataset.rider !== active && !paused && !reduceMotion) {
          const p = positions.get(rider.dataset.rider), v = dimensions();
          const aim = target || { x: v.width * (.5 + Math.sin(clock * .25 + index * 2.1) * .33), y: v.height * (.5 + Math.cos(clock * .32 + index * 1.7) * .27) };
          p.x += (aim.x - p.x) * Math.min(1, dt * (target ? 1.3 : .5));
          p.y += (aim.y - p.y) * Math.min(1, dt * (target ? 1.3 : .5));
          p.depth = .38 + Math.sin(clock * .24 + index * 1.7) * .25;
        }
        draw(rider);
      });
    }
    frame = requestAnimationFrame(tick);
  }
  const resize = new ResizeObserver(() => riders.forEach(draw)); resize.observe(field);
  select(active); riders.forEach(draw); frame = requestAnimationFrame(tick);
  return {
    chase(point) { target = point; },
    destroy() { lifetime.abort(); resize.disconnect(); cancelAnimationFrame(frame); clearInput(); },
  };
}
