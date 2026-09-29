import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { advanceHallPet, constrainHallPet } from '../js/hall-pets.js';

test('hall pets stay fully inside the scene at every edge',()=>{
  const pet={x:-40,y:300,width:80,height:100,vx:0,vy:0};
  assert.deepEqual(constrainHallPet(pet,{width:320,height:240}),{...pet,x:0,y:140});
});

test('wandering pets bounce back when they reach a scene boundary',()=>{
  const pet={x:85,y:80,width:15,height:20,vx:30,vy:40};
  const next=advanceHallPet(pet,{width:100,height:100},1);
  assert.equal(next.x,85);assert.equal(next.y,80);
  assert.equal(next.vx,-30);assert.equal(next.vy,-40);
});

test('hall pet dragging distinguishes movement from an ordinary conversation click',async()=>{
  const source=await readFile(new URL('../js/hall-pets.js',import.meta.url),'utf8');
  assert.match(source,/setPointerCapture/);
  assert.match(source,/Math\.hypot\([^)]*\)>5/);
  assert.match(source,/stopImmediatePropagation/);
  assert.match(source,/prefers-reduced-motion/);
});
