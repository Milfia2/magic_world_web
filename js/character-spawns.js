// 立繪調整入口：座標以「原始背景圖」為準，單位都是百分比。
// x = 腳底中心的水平位置；y = 腳底高度（越大越靠下）。
// height = 立繪高度占原圖高度的比例（數值越大，角色越大）。
// name 只供編輯時辨識。每個場景可新增、移除候選位置。
// 背景與立繪共用縮放座標，因此桌子、地板位置在手機版仍能對齊。
export const SPAWN_POINTS = {
  atrium: [
    { name: '左側長廊', x: 12, y: 79, height: 31 },
    { name: '噴泉左前方', x: 38, y: 89, height: 38 },
    { name: '右側拱門', x: 78, y: 77, height: 29 },
    { name: '右前方小徑', x: 91, y: 90, height: 39 },
  ],
  classroom: [
    { name: '左側課桌邊', x: 16, y: 75, height: 32 },
    { name: '講臺左前方', x: 40, y: 82, height: 35 },
    { name: '中央走道', x: 66, y: 90, height: 42 },
    { name: '靠窗走道', x: 86, y: 77, height: 31 },
  ],
  library: [
    { name: '左側書架', x: 10, y: 64, height: 25 },
    { name: '後方書架旁', x: 60, y: 72, height: 27 },
    { name: '梯子左側', x: 74, y: 84, height: 34 },
    { name: '桌旁走道', x: 43, y: 89, height: 36 },
  ],
  observatory: [
    { name: '左側書架旁', x: 10, y: 65, height: 28 },
    { name: '望遠鏡右後方', x: 49, y: 67, height: 26 },
    { name: '星盤地毯', x: 63, y: 89, height: 39 },
    { name: '右側樓梯前', x: 83, y: 80, height: 32 },
  ],
  office: [
    { name: '左側書架前', x: 12, y: 89, height: 35 },
    { name: '椅子後方', x: 34, y: 59, height: 26 },
    { name: '書桌右側', x: 76, y: 90, height: 35 },
    { name: '右側牆邊', x: 92, y: 85, height: 31 },
  ],
  dorms: [
    { name: '左側大門前', x: 13, y: 87, height: 35 },
    { name: '左側地毯', x: 38, y: 91, height: 37 },
    { name: '右側地毯', x: 62, y: 91, height: 37 },
    { name: '右側大門前', x: 84, y: 85, height: 32 },
  ],
  forest: [
    { name: '左側樹影', x: 14, y: 83, height: 30 },
    { name: '林間左側', x: 37, y: 73, height: 25 },
    { name: '小徑前方', x: 60, y: 91, height: 39 },
    { name: '右側樹叢', x: 84, y: 82, height: 31 },
  ],
  village: [
    { name: '左側店門口', x: 17, y: 86, height: 35 },
    { name: '中段街道', x: 60, y: 79, height: 25 },
    { name: '遠方路口', x: 73, y: 70, height: 18 },
    { name: '右側看板旁', x: 87, y: 91, height: 39 },
  ],
  pitch: [
    { name: '左側球場邊', x: 13, y: 83, height: 39 },
    { name: '遠端草地', x: 36, y: 66, height: 27 },
    { name: '球門右側', x: 64, y: 73, height: 31 },
    { name: '右側看台前', x: 86, y: 89, height: 44 },
  ],
  'room/abby': [
    { name: '書桌旁', x: 33, y: 88, height: 40 },
    { name: '窗前', x: 49, y: 76, height: 32 },
    { name: '床尾', x: 78, y: 89, height: 40 },
  ],
  'room/thea': [
    { name: '書桌旁', x: 34, y: 88, height: 40 },
    { name: '窗前', x: 49, y: 76, height: 32 },
    { name: '床尾', x: 79, y: 88, height: 39 },
  ],
  'room/gaile': [
    { name: '書桌旁', x: 36, y: 89, height: 40 },
    { name: '窗前', x: 51, y: 77, height: 32 },
    { name: '床尾', x: 80, y: 89, height: 39 },
  ],
  'room/zephyr': [
    { name: '書桌旁', x: 34, y: 89, height: 40 },
    { name: '窗前', x: 48, y: 77, height: 32 },
    { name: '床尾', x: 78, y: 89, height: 39 },
  ],
};

// 同一位置的個別角色倍率；可單獨調整，不影響其他人。
export const CHARACTER_SCALE = { abby: .88, thea: 1, gaile: 1.04, zephyr: 1.09 };

// 權重越高越常出現，但每個時段每人仍只在一個地方。
// 私人房間只能列出角色自己的房間。每三小時抽取一次行程。
export const LOCATION_PREFERENCES = {
  abby: { classroom: 7, atrium: 5, pitch: 5, library: 2, office: 2, village: 2, dorms: 1, 'room/abby': 2 },
  thea: { forest: 8, atrium: 6, village: 3, observatory: 2, dorms: 2, library: 1, classroom: 1, pitch: 1, 'room/thea': 2 },
  gaile: { observatory: 8, library: 7, classroom: 3, office: 2, atrium: 2, village: 1, pitch: 1, 'room/gaile': 3 },
  zephyr: { pitch: 8, atrium: 4, village: 3, observatory: 2, library: 1, classroom: 1, dorms: 2, 'room/zephyr': 3 },
};
export const SCHEDULE_HOURS = 3;
