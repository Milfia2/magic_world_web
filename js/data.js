// Profiles follow the user-supplied Character Bible; internal IDs preserve v1 saves.
export const characters = [
  { id: 'abby', name: '艾比·柏金斯', short: '艾比', english: 'ABBY PERKINS', house: '獅院', schoolHouse: 'Gryffindor', virtue: '勇氣', color: '#c56f6a', intro: '「這個我會！要不要我教你？」', gift: '勇氣書籤', height:148, birthday:'8 月 1 日', subject:'符咒學', greeting:'你來得正好！我剛練會一個符咒，等一下，先別走！' },
  { id: 'thea', name: '西婭·赫姆斯', short: '西婭', english: 'THEA HOLMES', house: '獾院', schoolHouse: 'Hufflepuff', virtue: '自在', color: '#dcb862', intro: '「嗯……再往前看看吧。」', gift: '花草茶包', height:168, birthday:'10 月 29 日', subject:'奇獸飼育學', greeting:'你看，漂亮的石頭，我剛剛撿到的。……要坐一下嗎？' },
  { id: 'caleb', name: '蓋勒·布拉德雷', short: '蓋勒', english: 'CALEB BRADLEY', house: '鷹院', schoolHouse: 'Ravenclaw', virtue: '傾聽', color: '#93a9de', intro: '「先坐一下吧，我去拿熱的。」', gift: '星圖筆記', height:175, birthday:'9 月 17 日', subject:'天文學', greeting:'你的東西落在教室了。我順路帶過來，看看有沒有少。' },
  { id: 'zephyr', name: '澤菲爾·哈特', short: '澤菲爾', english: 'ZEPHYR HART', house: '蛇院', schoolHouse: 'Slytherin', virtue: '牽掛', color: '#81b59f', intro: '「走啊，去哪都行。」', gift: '銀色緞帶', height:183, birthday:'7 月 6 日', subject:'黑魔法防禦術', position:'魁地奇打擊手', greeting:'走啊，去哪都行。我今天沒什麼安排。……你不會又打算一個人去吧？' },
];
export const places = [
  { id: 'atrium', name: '校園中庭', en: 'THE COURTYARD', desc: '開始今天的冒險。', icon: '✧', x: 49, y: 53 },
  { id: 'library', name: '圖書館', en: 'THE LIBRARY', desc: '校園小秘辛', icon: '▤', x: 20, y: 26 },
  { id: 'classroom', name: '教室', en: 'THE CLASSROOM', desc: '認識魔法世界', icon: '◇', x: 15, y: 51 },
  { id: 'observatory', name: '天文臺', en: 'THE OBSERVATORY', desc: '抬頭看看遠方的天空', icon: '☾', x: 50, y: 17 },
  { id: 'dorms', name: '學院宿舍', en: 'THE DORMITORIES', desc: '休息的地方', icon: '⌂', x: 79, y: 27 },
  { id: 'pitch', name: '魁地奇球場', en: 'THE QUIDDITCH PITCH', desc: '握緊掃帚，追上那一道金色的光。', icon: '⚑', x: 86, y: 53 },
  { id: 'forest', name: '禁忌森林', en: 'THE FORBIDDEN WOODS', desc: '樹林裡似乎有什麼東西在注視著你', icon: '♧', x: 81, y: 84 },
  { id: 'village', name: '活米村', en: 'HOGSMEADE', desc: '閃亮亮換裝小鎮', icon: '♙', x: 17, y: 84 },
];
export const stories = [
  { id: 'report', title: '〈同心圓〉', label: '預言家日報', author: '預言家日報最前線記者', series: '最前線記者專欄', column: 1, path: './content/library/report.txt' },
  { id: 'report2', title: '〈Bubble gum〉', label: '預言家日報', author: '預言家日報最前線記者', series: '最前線記者專欄', column: 2, path: './content/library/report2.txt' },
  { id: 'report3', title: '〈怦然心動〉', label: '預言家日報', author: '預言家日報最前線記者', series: '最前線記者專欄', column: 3, path: './content/library/report3.txt' },
  { id: 'secret', title: '校園秘辛：一年級女同學 A 的獨白', label: '校園秘辛', path: './content/library/secret.txt' },
  { id: 'secret2', title: '校園秘辛：二年級學生 B 的目擊紀錄', label: '校園秘辛', path: './content/library/secret2.txt' },
];
export const lore = [
  ['四個學院', '獅院珍視勇氣，獾院相信善意，鷹院追尋知識，蛇院懷抱志向。不同的起點，都能通往同一場友誼。'],
  ['校園探索', '四人原本就是熟識的朋友，分屬不同學院。在場景裡找到朋友、打聲招呼，就能約好到他的宿舍作客。'],
  ['相遇與收藏', '在宿舍找到的小物可以送給朋友。在森林找到的寵物會入住你的房間，和圖書館讀過的故事一起成為旅行紀錄。'],
];
export const asset = (name) => name==='hall'?'./assets/Q_Lobby.png':`./assets/${name}.webp`;
export const character = (id) => characters.find(c => c.id === id);
