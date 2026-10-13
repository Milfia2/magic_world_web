import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { CHARACTER_POSES, THEA_POSE_POINTS, availablePoses, chooseCharacterPose, poseAsset, faceConversation } from '../js/character-poses.js';
import { asset } from '../js/data.js';

const point={name:'原本位置',x:40,y:90,height:40};
test('ordinary poses and front remain eligible alongside location-specific poses',()=>{
  for(const scene of ['atrium','forest','village','pitch','classroom','library','observatory','dorms','room/thea']){
    for(const id of Object.keys(CHARACTER_POSES))assert.ok(availablePoses(id,scene).includes('front'));
    assert.equal(availablePoses('abby',scene).includes('fire'),scene==='atrium');
    assert.equal(availablePoses('zephyr',scene).includes('buy'),scene==='village');
    assert.equal(availablePoses('zephyr',scene).includes('withbroom'),scene==='pitch');
    for(const pose of ['sit','squat'])assert.equal(availablePoses('thea',scene).includes(pose),['atrium','forest'].includes(scene));
    assert.ok(availablePoses('caleb',scene).includes('write'));
  }
  for(const scene of ['hall','map','select'])assert.deepEqual(availablePoses('thea',scene),['front']);
});
test('every pose is reachable; only Thea sitting and squatting use independent points',()=>{
  for(const id of Object.keys(CHARACTER_POSES))for(const scene of ['atrium','forest','pitch','village','library']){
    const choices=availablePoses(id,scene);
    choices.forEach((pose,i)=>{
      const actual=chooseCharacterPose(id,scene,point,()=> (i+.5)/choices.length);
      assert.equal(actual.pose,pose);
      if(id==='thea'&&['sit','squat'].includes(pose))assert.ok(THEA_POSE_POINTS[scene][pose].includes(actual.point));
      else assert.equal(actual.point,point);
    });
  }
  assert.deepEqual(point,{name:'原本位置',x:40,y:90,height:40});
});
test('clicking ordinary art changes the image to front; special art and position stay unchanged',()=>{
  for(const [id,poses] of Object.entries(CHARACTER_POSES))for(const [pose,rule] of Object.entries(poses)){
    const image={src:asset(poseAsset(id,pose))};
    const anchor={dataset:{pose},querySelector:()=>image};
    faceConversation(anchor,id,asset);
    assert.equal(anchor.dataset.pose,rule.keepOnTalk?pose:'front');
    assert.equal(image.src,asset(rule.keepOnTalk?poseAsset(id,pose):id));
    faceConversation(anchor,id,asset);
    assert.equal(anchor.dataset.pose,rule.keepOnTalk?pose:'front');
  }
});
test('all declared pose images exist in deployable assets',async()=>{
  for(const [id,poses] of Object.entries(CHARACTER_POSES))for(const pose of Object.keys(poses))await access(new URL('../'+asset(poseAsset(id,pose)),import.meta.url));
});
