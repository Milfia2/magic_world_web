import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, resetProgress } from '../js/state.js';
import { capturePet, petsFor, PETS, hiddenPetPoint } from '../js/pets.js';
import { constrainHallPet, constrainDraggedHallPet, advanceHallPet, advanceFallingHallPet, hallFloorY } from '../js/hall-pets.js';

test('each creature has normal, wild and happy artwork',()=>{
  assert.equal(PETS.length,5);
  for(const pet of PETS){
    assert.match(pet.image,/\.png$/);assert.match(pet.wildImage,/\.png$/);assert.match(pet.happyImage,/_happy\.png$/);
    assert.notEqual(pet.image,pet.wildImage);assert.notEqual(pet.image,pet.happyImage);
  }
});

test('caught pets belong to their catcher and persist without leaking across roles',()=>{
  const state=loadState(null);state.character='abby';
  assert.equal(capturePet(state,PETS[0].id),true);
  assert.equal(capturePet(state,PETS[0].id),false);
  state.character='thea';assert.deepEqual(petsFor(state),[]);
  assert.equal(capturePet(state,PETS[1].id),true);
  const saved=loadState({getItem:()=>JSON.stringify(state)});
  assert.deepEqual(petsFor(saved,'abby'),[PETS[0].id]);
  assert.deepEqual(petsFor(saved,'thea'),[PETS[1].id]);
  resetProgress(saved);assert.deepEqual(petsFor(saved,'abby'),[]);
});
test('legacy progress stays intact and malformed pet records are filtered',()=>{
  const state=loadState({getItem:()=>JSON.stringify({version:1,character:'abby',pets:['thea'],companions:{abby:['bowtruckle-1','bowtruckle-3','bad'],thea:'bad'}})});
  assert.deepEqual(state.pets,['thea']);assert.deepEqual(petsFor(state),[PETS[0].id]);assert.deepEqual(petsFor(state,'thea'),[]);
  assert.equal(capturePet(state,'bad'),false);
});
test('dragging can lift a hall character above the floor before gravity lands them',()=>{
  const bounds={width:800,height:450};bounds.floorY=hallFloorY(bounds);
  const pet={x:200,y:-100,width:90,height:110,vx:0,vy:0};
  const held=constrainDraggedHallPet(pet,bounds);
  assert.equal(held.y,0);assert.ok(held.y<constrainHallPet(pet,bounds).y);
  let falling={...held,falling:true,fallVelocity:0};
  for(let i=0;i<100&&falling.falling;i++)falling=advanceFallingHallPet(falling,bounds,.02);
  assert.equal(falling.falling,false);assert.equal(falling.y,constrainHallPet(pet,bounds).y);
});
test('hidden pet positions cover upper and lower corners with inset margins',()=>{
  assert.deepEqual(hiddenPetPoint(()=>0),{x:5,y:6});
  assert.deepEqual(hiddenPetPoint(()=>1),{x:95,y:94});
});
test('drag, bounce and resize keep hall feet on the projected floor at desktop and mobile sizes',()=>{
  for(const [width,height] of [[1280,720],[390,292.5],[320,240]]){
    const bounds={width,height};bounds.floorY=hallFloorY(bounds);
    const size=Math.min(115,Math.max(46,width*.09));
    for(const x of [-500,5000])for(const y of [-500,5000]){
      let p=constrainHallPet({x,y,width:size+12,height:size+27,vx:-30,vy:-30},bounds);
      for(let i=0;i<100;i++){
        assert.ok(p.y+size>=bounds.floorY-1e-6);
        assert.ok(p.y+p.height<=height&&p.x>=0&&p.x+p.width<=width);
        p=advanceHallPet(p,bounds,.05);
      }
    }
  }
});
