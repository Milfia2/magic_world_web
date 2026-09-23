// Profiles follow the user-supplied Character Bible; internal IDs preserve v1 saves.
export const characters = [
  { id: 'abby', name: '艾比·柏金斯', short: '艾比', english: 'ABBY PERKINS', house: '獅院', schoolHouse: 'Gryffindor', virtue: '勇氣', color: '#c56f6a', intro: '「這個我會！要不要我教你？」', gift: '勇氣書籤', height:148, birthday:'8 月 1 日', subject:'符咒學', greeting:'你來得正好！我剛練會一個符咒，等一下，先別走！' },
  { id: 'thea', name: '西婭·赫姆斯', short: '西婭', english: 'THEA HOLMES', house: '獾院', schoolHouse: 'Hufflepuff', virtue: '自在', color: '#dcb862', intro: '「嗯……再往前看看吧。」', gift: '花草茶包', height:168, birthday:'10 月 29 日', subject:'奇獸飼育學', greeting:'你看，漂亮的石頭，我剛剛撿到的。……要坐一下嗎？' },
  { id: 'gaile', name: '蓋勒·布拉德雷', short: '蓋勒', english: 'CALEB BRADLEY', house: '鷹院', schoolHouse: 'Ravenclaw', virtue: '傾聽', color: '#93a9de', intro: '「先坐一下吧，我去拿熱的。」', gift: '星圖筆記', height:175, birthday:'9 月 17 日', subject:'天文學', greeting:'你的東西落在教室了。我順路帶過來，看看有沒有少。' },
  { id: 'zephyr', name: '澤菲爾·哈特', short: '澤菲爾', english: 'ZEPHYR HART', house: '蛇院', schoolHouse: 'Slytherin', virtue: '牽掛', color: '#81b59f', intro: '「走啊，去哪都行。」', gift: '銀色緞帶', height:183, birthday:'7 月 6 日', subject:'黑魔法防禦術', position:'魁地奇打擊手', greeting:'走啊，去哪都行。我今天沒什麼安排。……你不會又打算一個人去吧？' },
];
export const places = [
  { id: 'atrium', name: '校園中庭', en: 'THE COURTYARD', desc: '從一場不期而遇，開始今天的冒險。', icon: '✧', x: 49, y: 53 },
  { id: 'library', name: '圖書館', en: 'THE LIBRARY', desc: '翻開書頁，收藏還沒說完的故事。', icon: '▤', x: 20, y: 26 },
  { id: 'classroom', name: '教室', en: 'THE CLASSROOM', desc: '認識魔法世界，也認識彼此。', icon: '◇', x: 15, y: 51 },
  { id: 'observatory', name: '天文臺', en: 'THE OBSERVATORY', desc: '抬頭看看，遠方的天空今天是什麼模樣？', icon: '☾', x: 50, y: 17 },
  { id: 'dorms', name: '學院宿舍', en: 'THE DORMITORIES', desc: '燈火亮起的地方，有人等著你的故事。', icon: '⌂', x: 79, y: 27 },
  { id: 'pitch', name: '魁地奇球場', en: 'THE QUIDDITCH PITCH', desc: '握緊掃帚，追上那一道金色的光。', icon: '⚑', x: 86, y: 53 },
  { id: 'forest', name: '禁忌森林', en: 'THE FORBIDDEN WOODS', desc: '放輕腳步，樹影裡藏著毛茸茸的新朋友。', icon: '♧', x: 81, y: 84 },
  { id: 'village', name: '活米村', en: 'HOGSMEADE', desc: '為下一次相遇，換上一點不同的心情。', icon: '♙', x: 17, y: 84 },
];
export const stories = [
  { id: 'letter', title: '一封遲到的入學信', label: '序章', text: ['信封滑進門縫的時候，窗外正下著細雨。你撿起它，在厚實的紙面上摸到一枚微微凸起的封印。', '「有些路，要等你準備好才會出現。」信紙只寫了這一句。再抬起頭，窗外已不再是熟悉的街道，而是一座亮著燈的城堡。', '你把信收進口袋，推開門。中庭的鐘聲，剛好敲響。'] },
  { id: 'stars', title: '借來的星光', label: '校園篇', text: ['天文臺的樓梯，比想像中還要長。當你終於推開頂樓的小門，所有的疲倦都在一瞬間消失了。', '有人替你留了一個靠窗的位置。桌上攤著星圖，旁邊放著兩杯冒著熱氣的茶。', '「別急著找星座，」那個聲音說，「先看見你喜歡的那一顆。」'] },
  { id: 'footprints', title: '森林裡的小腳印', label: '奇遇篇', text: ['石板路的盡頭，有一串小小的腳印。你沿著腳印走進樹影，聽見一聲短促的叫喚。', '一隻小貓坐在倒下的樹幹上，彷彿早就知道你會來。牠歪著頭，打量你口袋裡的餅乾。', '你蹲下身伸出手。這一次，森林並沒有那麼陌生。'] },
];
export const lore = [
  ['四個學院', '獅院珍視勇氣，獾院相信善意，鷹院追尋知識，蛇院懷抱志向。不同的起點，都能通往同一場友誼。'],
  ['校園探索', '四人原本就是熟識的朋友，分屬不同學院。在場景裡找到朋友、打聲招呼，就能約好到他的宿舍作客。'],
  ['相遇與收藏', '在宿舍找到的小物可以送給朋友。森林裡的小貓、圖書館讀過的故事，也會成為你的旅行紀錄。'],
];
export const asset = (name) => `./assets/${name}.webp`;
export const character = (id) => characters.find(c => c.id === id);
