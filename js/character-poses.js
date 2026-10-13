// 普通動作在各場景皆可抽中；只有實際提供素材的動作才列入。
export const CHARACTER_POSES = {
  abby: { back: {}, read: {}, fire: { scenes: ['atrium'], keepOnTalk: true } },
  caleb: { back: {}, read: {}, write: {} },
  thea: { sit: { scenes: ['forest','atrium'], keepOnTalk: true } ,back: {}, squat: { scenes: ['forest','atrium'], keepOnTalk: true } },
  zephyr: { back: {}, buy: { scenes: ['village'], keepOnTalk: true }, withbroom: { scenes: ['pitch'], keepOnTalk: true } },
};

// Thea 專用位置：原始背景圖百分比；x/y 為圖片底部中心，height 為圖片高度。
// 坐姿須讓臀部對齊椅面／岩石，可調 y 或 height；不改一般站立候選位置。
// 每個陣列可放多個候選位置，抽中該動作時才在這裡選點。
export const THEA_POSE_POINTS = {
  atrium: {
    sit: [{ name: '西婭坐在左側石椅', x: 39, y:93, height: 38 }],
    squat: [{ name: '西婭蹲在噴泉前', x: 52, y: 85, height: 24 }],
  },
  forest: {
    sit: [{ name: '西婭坐在右側岩石',x: 16, y: 100, height: 53 }],
    squat: [{ name: '西婭蹲在小徑旁', x: 46, y: 88, height: 26 }],
  },
};

export function availablePoses(id, scene) {
  if (['map','select','hall'].includes(scene)) return ['front'];
  return ['front', ...Object.entries(CHARACTER_POSES[id] || {}).filter(([pose, rule]) =>
    (!rule.scenes || rule.scenes.includes(scene)) &&
    (!(id==='thea' && ['sit','squat'].includes(pose)) || THEA_POSE_POINTS[scene]?.[pose]?.length)
  ).map(([pose])=>pose)];
}
const pick = (items, random) => items[Math.min(items.length-1,Math.max(0,Math.floor(random()*items.length)))];
export function chooseCharacterPose(id, scene, point, random = Math.random) {
  const pose=pick(availablePoses(id,scene),random);
  const points=id==='thea' ? THEA_POSE_POINTS[scene]?.[pose] : null;
  return {id,pose,point:points?.length?pick(points,random):point};
}
export function poseAsset(id, pose = 'front') { return pose==='front'?id:`${id}-${pose}`; }
export function poseForConversation(id, pose) { return CHARACTER_POSES[id]?.[pose]?.keepOnTalk?pose:'front'; }
export function faceConversation(anchor, id, asset) {
  if (!anchor?.dataset.pose) return;
  const pose=poseForConversation(id,anchor.dataset.pose);
  if (pose===anchor.dataset.pose) return;
  anchor.dataset.pose=pose;
  anchor.querySelector('img').src=asset(poseAsset(id,pose));
}
