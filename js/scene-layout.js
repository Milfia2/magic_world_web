// Source-image percentages keep clickable objects attached to the illustration.
// x/y are object centres; w/h describe the actual illustrated object, not a menu.
export const sceneObjects = {
  atrium: [{ label: '攤開校園地圖', action: 'open-map', x: 16, y: 70, w: 15, h: 12, image: 'map', style: 'laid-map' }],
  library: [
    { label: '一封遲到的入學信', action: 'story', value: 'letter', x: 19, y: 76, w: 13, h: 8 },
    { label: '借來的星光', action: 'story', value: 'stars', x: 34, y: 65, w: 10, h: 7 },
    { label: '森林裡的小腳印', action: 'story', value: 'footprints', x: 94, y: 82, w: 10, h: 15 },
  ],
  classroom: [
    { label: '閱讀黑板上的世界設定', action: 'lore', x: 46, y: 31, w: 40, h: 25 },
    { label: '老師留下的名冊 · 前往辦公室', action: 'open-office', x: 24, y: 88, w: 21, h: 12 },
  ],
  office: [{ label: '桌上的學生名冊', action: 'records', x: 53, y: 65, w: 20, h: 8, image: 'record-paper', style: 'laid-record' }],
  observatory: [
    { label: '透過望遠鏡觀測天氣', action: 'weather-dialog', x: 36, y: 41, w: 26, h: 17 },
    { label: '在星圖旁寫日記', action: 'journal', x: 20, y: 87, w: 28, h: 14 },
  ],
  dorms: [
    { label: '獅院 · 艾比的房間', action: 'open-room', value: 'abby', x: 14, y: 49, w: 13, h: 26 },
    { label: '蛇院 · 澤菲爾的房間', action: 'open-room', value: 'zephyr', x: 29, y: 51, w: 12, h: 25 },
    { label: '獾院 · 西婭的房間', action: 'open-room', value: 'thea', x: 68, y: 52, w: 12, h: 25 },
    { label: '鷹院 · 蓋勒的房間', action: 'open-room', value: 'gaile', x: 84, y: 51, w: 12, h: 28 },
  ],
  village: [{ label: '走進服裝店 · 更換造型', action: 'wardrobe', x: 48, y: 58, w: 18, h: 20 }],
  forest: [],
};
export const roomObjects = {
  abby: { diary: [14, 58], gift: [63, 55] },
  thea: { diary: [21, 62], gift: [61, 60] },
  gaile: { diary: [16, 60], gift: [62, 57] },
  zephyr: { diary: [13, 60], gift: [62, 57] },
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function otherCharacters(ids, selected) { return ids.filter(id => id !== selected); }

// The scene uses object-fit: cover. Project points using the exact same geometry.
export function projectObject(object, source, viewport) {
  const scale = Math.max(viewport.width / source.width, viewport.height / source.height);
  const width = source.width * scale, height = source.height * scale;
  return {
    x: (viewport.width - width) / 2 + width * object.x / 100,
    // Bottom alignment preserves desks and floor-level objects on wide screens.
    y: viewport.height - height + height * object.y / 100,
    width: width * object.w / 100,
    height: height * object.h / 100,
  };
}
const overlaps = (a, b, padding = 9) => a.x < b.x + b.width + padding && a.x + a.width + padding > b.x && a.y < b.y + b.height + padding && a.y + a.height + padding > b.y;
export function shuffled(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Use the whole image, but avoid other people and illustrated interaction areas.
export function scatterCharacters(ids, viewport, obstacles = [], random = Math.random) {
  const size = clamp(viewport.width * .09, 46, 115);
  const card = { width: size + 12, height: size + 27 };
  const maxX = Math.max(8, viewport.width - card.width - 8);
  const maxY = Math.max(8, viewport.height - card.height - 8);
  const columns = shuffled([0, 1, 2, 3], random);
  const rows = shuffled([0, 1, 2, 3], random);
  const placed = [];
  return ids.map((id, index) => {
    const candidates = [];
    for (let n = 0; n < 100; n++) {
      const x = n === 0 ? 8 + (maxX - 8) * (columns[index % 4] + random() * .5) / 3.5 : 8 + random() * (maxX - 8);
      const y = n === 0 ? 8 + (maxY - 8) * (rows[index % 4] + random() * .5) / 3.5 : 8 + random() * (maxY - 8);
      const candidate = { x, y, ...card };
      if (placed.some(p => overlaps(candidate, p))) continue;
      const collisions = obstacles.filter(o => overlaps(candidate, o)).length;
      candidates.push({ ...candidate, collisions });
      if (collisions === 0) break;
    }
    const result = candidates.sort((a, b) => a.collisions - b.collisions)[0] || { x: 8 + index * (maxX - 8) / Math.max(1, ids.length - 1), y: maxY, ...card };
    placed.push(result);
    return { id, ...result, size };
  });
}
