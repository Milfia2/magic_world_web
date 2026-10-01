export const CHAT_DESTINATIONS = Object.freeze({
  atrium: '校園中庭',
  library: '圖書館',
  classroom: '教室',
  observatory: '天文臺',
  dorms: '學院宿舍',
  pitch: '魁地奇球場',
  forest: '禁忌森林',
  village: '活米村',
});
export const CHAT_DESTINATION_IDS = Object.freeze(Object.keys(CHAT_DESTINATIONS));
export const isChatDestination = value => CHAT_DESTINATION_IDS.includes(value);
