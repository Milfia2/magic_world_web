import { characters, character, places, stories, lore, asset } from './data.js';
import { loadState, STORAGE_KEY, remember, collectGift, giveGift, beginGreeting, resetProgress } from './state.js';
import { registerAgentTools } from './agent-tools.js';
import { sceneObjects, roomObjects, projectObject, scatterCharacters, clamp } from './scene-layout.js';
import { createFlightController } from './flight.js';
import { dialogueFor } from './dialogue.js';
import { residentsForScene, scheduleWindow } from './schedule.js';
import { CHARACTER_SCALE } from './character-spawns.js';
import { createRoomAccess } from './room-access.js';
import { readDiary, diaryAudience, ROOM_HOST_POINT, ROOM_REACTIONS } from './room-content.js';
import { ambientLine, clickedDialogue, distinctDialogue } from './ambient-dialogue.js';
import { greetingFor } from './greetings.js';
import { mountHeadConversation } from './head-conversation.js';
import { APP_VERSION, VERSION_HISTORY } from './version.js';
import { createHallPetController } from './hall-pets.js';
import { PETS, petsFor, capturePet, hiddenPetPoint } from './pets.js';
import { readLibraryStory } from './library-content.js';
import { FreeChatClient } from './free-chat.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const state = loadState(storage);
let chatStorage;
try { chatStorage = window.sessionStorage; } catch {}
let chatMemoryStorage;
try { chatMemoryStorage = window.localStorage; } catch {}
const freeChat = new FreeChatClient(chatStorage,undefined,chatMemoryStorage);
const roomAccess = createRoomAccess();
const lastSmallTalk = new Map();
const lastHeadDialogue = new Map();
let headConversation = null;
function closeHeadConversation() {
  headConversation?.();headConversation=null;roomAccess.dismiss();
}
let chosen = state.character || 'abby';
let cleanups = [];
let toastTimer;
let snitchActive = false;
let flightController;
let scatterScene = () => {};
let pitchGame = false;
let renderedScheduleKey = '';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (route, text, cls = 'action') => `<a class="${cls}" href="#/${route}">${text}</a>`;
const button = (action, text, value = '', cls = '') => `<button class="${cls}" data-action="${action}" data-value="${value}">${text}</button>`;
const currentRoute = () => location.hash.slice(2) || (state.character ? 'atrium' : 'select');
function save() { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { toast('目前無法儲存進度；仍可繼續探索。'); return false; } }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3500); }
function go(route) { if (currentRoute() === route) render(); else location.hash = `/${route}`; }
function period() { const h = new Date().getHours(); return h >= 6 && h < 18 ? 'day' : 'night'; }
function header(route) {
  const c = character(state.character);
  return `<header class="topbar"><a class="brand" href="#/${c ? 'atrium' : 'select'}"><span class="ornament" aria-hidden="true">✧</span><span class="brand-title">魔法日常<small>MAGIC WORLD</small></span></a><nav class="top-nav" aria-label="主要導覽"><a class="${route === 'map' ? 'active' : ''}" href="#/map">校園地圖</a><a class="${route === 'hall' ? 'active' : ''}" href="#/hall">Q 版大廳</a>${button('chat-settings','對話連線','','text-button')}${button('version-history', `v${APP_VERSION}`, '', 'text-button version-button')}${button('reset-progress', '重置紀錄', '', 'text-button reset-button')}</nav><div class="profile">${c ? `<img src="${asset(c.id + '-chibi')}" alt=""><a href="#/select">${c.short}<small>${c.house} · 切換角色</small></a>` : '<span class="clock">一段日常，一點魔法</span>'}</div></header>`;
}
function chatForm(speaker) {
  if (!state.character || speaker === state.character) return '';
  return `<form class="free-chat-form" data-chat-speaker="${speaker}"><label>以${esc(character(state.character).short)}的身分說話<textarea name="message" rows="2" maxlength="1500" required placeholder="想對${esc(character(speaker).short)}說什麼？"></textarea></label><button type="submit" class="primary">送出</button><p class="chat-status" role="status">${freeChat.connected?'記憶保存在此瀏覽器，每組角色保留最近 10 則訊息。':'先在上方「對話連線」登入，再開始聊天。'}</p></form>`;
}
function chatSettings() {
  showDialog('對話連線',`<form id="chat-connect" class="chat-connect"><label>對話服務網址<input name="endpoint" type="url" required value="${esc(freeChat.url)}" placeholder="https://chat.example.com"></label><label>連線密碼<input name="password" type="password" required autocomplete="off"></label><button type="submit" class="primary">連線</button><p class="chat-status" role="status">連線資訊只保存在這個瀏覽器分頁。主機需保持開啟。</p></form>`);
}
function selection() {
  return `<main id="main" class="selection"><div class="selection-head"><span class="eyebrow">YOUR STORY BEGINS HERE</span><h1>角色選擇</h1><p>選擇帶入角色</p></div><div class="character-grid" role="group" aria-label="選擇帶入角色">${characters.map(c => `<button class="character-card ${c.id === chosen ? 'selected' : ''}" style="--house:${c.color}" data-action="choose" data-value="${c.id}" aria-pressed="${c.id === chosen}"><span class="house-label">${c.house} · ${c.virtue}</span><div class="portrait"><img src="${asset(c.id)}" alt="${c.name}" fetchpriority="high"></div><h2>${c.name}</h2><span class="english">${c.english}</span><p class="quote">${c.intro}</p></button>`).join('')}</div><div class="selection-footer">${button('enter', `以${character(chosen).short}的身分，進入學院　→`, '', 'primary')}<p>探索紀錄會保存在這個瀏覽器，隨時可以回來。</p><div class="secondary-links">${link('map', '先看看校園地圖', '')}${link('hall', '前往 Q 版大廳 ↗', '')}${button('about', '關於這個世界', '', 'text-button')}</div></div></main>`;
}
function showDialog(title, body, actions = '') {
  closeHeadConversation();
  dialog.classList.remove('room-conversation');
  document.querySelector('.immersive')?.classList.remove('room-speaking');
  dialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">MAGIC WORLD</span><h2 id="dialog-title">${title}</h2></div>${button('close', '×', '', 'close')}</div><div class="dialog-body">${body}</div>${actions ? `<div class="dialog-actions">${actions}</div>` : ''}`;
  dialog.querySelector('.close').setAttribute('aria-label', '關閉對話視窗');
  if (!dialog.open) dialog.showModal();
}
function showRoomConversation(id, title, body, actions = '') {
  closeHeadConversation();
  const c=character(id);
  if(!c||currentRoute()!==`room/${id}`||!roomAccess.canEnter(state,id))return;
  dialog.classList.add('room-conversation');
  document.querySelector('.immersive')?.classList.add('room-speaking');
  dialog.innerHTML=`<div class="conversation-bust" aria-hidden="true"><img src="${asset(id)}" alt=""></div><section class="conversation-panel"><div class="dialog-head"><div><span class="eyebrow">${esc(title)}</span><h2 id="dialog-title">${c.name}</h2></div>${button('close','×','','close')}</div><div class="dialog-body">${body}</div><div class="dialog-actions">${actions}${button('close','結束對話')}</div></section>`;
  dialog.querySelector('.close').setAttribute('aria-label','關閉對話視窗');
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('.close').focus({preventScroll:true});
}
function mapView() {
  return `<main id="main" class="map-layout"><div class="map-heading"><div><span class="eyebrow">THE MARAUDER'S NOTEBOOK</span><h1>把日常，走成一場冒險。</h1><p>點選地圖上的地點，看看今天會遇見誰。</p></div>${link(state.character ? 'atrium' : 'select', state.character ? '返回中庭' : '選擇角色')}</div><div class="map-grid"><div class="map-canvas"><img src="${asset('map')}" alt="魔法學院地圖，標示八個可探索地點">${places.map(p => `<a href="#/${p.id}" class="map-pin" style="--x:${p.x}%;--y:${p.y}%" aria-label="前往${p.name}">${state.visited.includes(p.id) ? '✦ ' : ''}${p.name}</a>`).join('')}</div><aside class="map-aside"><section class="panel"><span class="eyebrow">YOUR JOURNEY</span><h2>探索足跡</h2><div class="stats"><div class="stat"><strong>${state.visited.length}/8</strong><small>造訪地點</small></div><div class="stat"><strong>${state.met.length}/4</strong><small>交談朋友</small></div><div class="stat"><strong>${petsFor(state).length}/${PETS.length}</strong><small>寵物夥伴</small></div></div><nav class="destination-list" aria-label="地點清單">${places.map(p => link(p.id, `<i>${p.icon}</i>${p.name}<span>↗</span>`, '')).join('')}</nav></section><section class="panel"><span class="eyebrow">A LITTLE REMINDER</span><p>想拜訪朋友的房間，請先在校園找到本人，交談後選「去房間看看」。離開後需重新邀約，不能直接闖入。</p></section></aside></div></main>`;
}
function hotspot(item) {
  return `<button class="scene-object ${item.style || ''}" data-action="${item.action}" data-value="${item.value || ''}" data-anchor data-x="${item.x}" data-y="${item.y}" data-w="${item.w}" data-h="${item.h}" style="left:${item.x}%;top:${item.y}%;width:${item.w}%;height:${item.h}%" aria-label="${item.label}" title="${item.label}">${item.image ? `<img src="${asset(item.image)}" alt="" draggable="false">` : ''}<span class="object-glint" aria-hidden="true">✧</span><span class="object-label">${item.label}</span></button>`;
}
function scene(id, title, en, desc, options = {}) {
  const isPitch = id === 'pitch' && pitchGame;
  const objects = options.objects || sceneObjects[id] || [];
  const riders = isPitch ? characters.map(c => `<button class="rider" data-rider="${c.id}" data-name="${c.short}" aria-label="操控${c.short}飛行" aria-pressed="${c.id === state.character}"><img src="${asset(c.id+'-riding')}" alt="${c.short}騎著掃帚" draggable="false"><span>${c.short}<small class="pilot-marker">操控中</small></span></button>`).join('') : '';
  return `<main id="main" class="immersive ${period()}" data-scene="${id}"><div class="scene-heading"><div><span class="eyebrow">${en}</span><h1>${title}</h1><p>${desc}</p></div><div class="actions">${options.back ? link(options.back.route, options.back.label) : ''}${state.character ? link('room/'+state.character,'我的房間') : ''}${link('map','⌘ 校園地圖')}</div></div><section class="scene-canvas ${isPitch ? 'flight-field' : ''}" ${isPitch ? 'id="field" tabindex="0"' : ''} aria-label="${isPitch ? '飛行球場；方向鍵或 WASD 移動，Q 遠離，E 靠近' : title+'互動場景'}"><img class="scene-art" src="${asset(id)}" alt="${title}場景" draggable="false" fetchpriority="high"><div class="object-layer">${objects.map(hotspot).join('')}</div>${riders}${id === 'forest' ? '<div id="pet-stage" class="pet-stage"></div>' : ''}${!isPitch ? '<div class="npc-layer" aria-label="場景中的角色"></div>' : ''}</section>${isPitch ? flightControls() : `<div class="scene-tools"><p><span class="ornament">✧</span><span>${currentRoute()==='hall'?'朋友們會自己四處走動；按住角色即可拖曳，輕點則能交談。':id.endsWith('-room')?(roomAccess.host(state,currentRoute())?'本次同行拜訪中，離開後需重新邀約。':'這是你的房間，可以安心休息。'):`朋友各有行程，下次換地點：${scheduleWindow().next.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})}。`}</span></p><div class="actions">${id==='pitch'?button('start-game','開始魁地奇遊戲','','primary'):''}${currentRoute()==='hall'?button('shuffle','重新散開'):''}${button('hints','顯示互動提示')}${id === 'forest' ? button('find-pet','尋找寵物') : ''}${button('inventory','隨身行囊')}</div></div>`}</main>`;
}
function flightControls() {
  return `<div id="flight-controls" class="flight-controls"><div class="flight-topline"><div class="pilot-select" aria-label="選擇操控角色">${characters.map(c=>`<button data-pilot="${c.id}" aria-pressed="${state.character===c.id}"><img src="${asset(c.id+'-chibi')}" alt="">${c.short}</button>`).join('')}</div><div class="actions">${button('launch','放出金探子','','primary')}${button('end-game','結束遊戲')}<span>捕捉 <strong id="catch-count">${state.catches}</strong> 次</span></div></div><div class="flight-bottomline"><div><p class="flight-instruction">操控 <strong id="pilot-name"></strong> · 拖曳／方向鍵／WASD 移動，Q 遠離、E 靠近；聚焦球場後可用滾輪縮放。</p><p id="game-status" role="status">其餘同伴會自由飛行，也會一起追逐金探子。</p><div class="actions"><button data-pause-flight>暫停同伴飛行</button><button data-flight-talk>與操控角色交談</button></div></div><div class="flight-manual"><div class="direction-pad" aria-label="飛行方向"><button data-flight="up" aria-label="往上飛">↑</button><button data-flight="left" aria-label="往左飛">←</button><button data-flight="down" aria-label="往下飛">↓</button><button data-flight="right" aria-label="往右飛">→</button></div><div class="depth-control"><label for="flight-depth">遠近距離</label><div><button data-flight="far" aria-label="往遠處飛，縮小">−</button><input id="flight-depth" type="range" min="0" max="100" value="50" aria-label="遠近距離，數值越大越靠近"><button data-flight="near" aria-label="往近處飛，放大">＋</button></div><small>遠處／縮小 <span>靠近／放大</span></small></div></div></div></div>`;
}
function placeView(id) {
  const p = places.find(p => p.id === id);
  remember(state.visited, id); save();
  return scene(id, p.name, p.en, p.desc);
}
function outfitAsset() { return asset(state.character + (state.outfit === 'uniform' ? '' : state.outfit === 'chibi' ? '-chibi' : '-cat')); }
function roomView(id) {
  const c = character(id);
  if (!c) return null;
  const hostIsHome=residentsForScene(`room/${id}`,state.character).some(person=>person.id===id);
  roomAccess.enterWhileHome(id,state.character,hostIsHome);
  if (!roomAccess.canEnter(state,id)) return scene('dorms', '先敲門，再作客', 'BY INVITATION ONLY', `不能直接進入${c.short}的房間。請在校園找到本人，交談後選擇「去房間看看」一起回來。`, { back: {route:'dorms',label:'← 宿舍大廳'} });
  const points = roomObjects[id];
  return scene(id + '-room', `${c.short}的房間`, `${c.english} · PRIVATE ROOM`, id===state.character?'回到自己的房間，翻翻日記、看看熟悉的小物。':hostIsHome?`${c.short}剛好在房間。點選日記、小物或窗戶，聽聽對方怎麼說。離開後需重新敲門。`:`${c.short}陪你回到了房間。點選日記、小物或窗戶，聽聽對方怎麼說。離開後需重新邀約。`, { back: {route:'dorms',label:'← 離開房間'}, objects: [
    {label:`桌上的日記 · ${c.short}的日記`,action:'room-item',value:`${id}:diary`,x:points.diary[0],y:points.diary[1],w:18,h:9},
    {label:'床頭的小物 · '+c.gift,action:'room-item',value:`${id}:gift`,x:points.gift[0],y:points.gift[1],w:10,h:12},
    {label:'窗邊的風景',action:'room-item',value:`${id}:window`,x:49,y:36,w:23,h:23},
  ] });
}
function officeView() { return scene('office','老師辦公室','THE PROFESSOR’S OFFICE','學生名冊就攤在桌上。靠近一點，翻開大家的故事。',{back:{route:'classroom',label:'← 回教室'}}); }
function hallView() { return scene('hall','Q 版大廳','LITTLE FRIENDS, LITTLE MOMENTS','四位朋友在這裡休息，暫時放下各自的行程。'); }

function arrangeScene() {
  const canvas = document.querySelector('.scene-canvas:not(.flight-field)');
  if (!canvas) return;
  let layer = canvas.querySelector('.npc-layer');
  if (!layer) { layer = document.createElement('div'); layer.className = 'npc-layer'; layer.setAttribute('aria-label','場景中的角色'); canvas.appendChild(layer); }
  const isHall = currentRoute()==='hall';
  // A denied room URL displays the shared dorm hallway, never the private room.
  const artId = document.querySelector('.immersive').dataset.scene;
  const sceneId = artId.endsWith('-room') ? `room/${artId.slice(0,-5)}` : artId;
  const host=roomAccess.host(state,currentRoute());
  const residents = host ? [{id:host,point:ROOM_HOST_POINT}] : isHall ? characters.map(c=>({id:c.id})) : residentsForScene(sceneId,state.character);
  const ids=residents.map(c=>c.id);
  layer.innerHTML = residents.map(({id,point})=>{const c=character(id);return `<button class="scene-npc ${isHall?'hall-pet':'standing-npc'} ${host?'room-host':''}" data-action="${isHall?'hall-talk':'talk'}" data-value="${id}" ${point?`data-spot="${point.name}"`:''} aria-label="與${c.short}交談"><img src="${asset(id+(isHall?'-chibi':''))}" alt="${c.short}" draggable="false"><span>${c.short} <i aria-hidden="true">✧</i></span></button>`;}).join('');
  const image = canvas.querySelector('.scene-art, :scope > img');
  const anchors = [...canvas.querySelectorAll('[data-anchor]')];
  let hallPets;
  function position() {
    const viewport = {width:canvas.clientWidth,height:canvas.clientHeight};
    if (!viewport.width || !viewport.height) return;
    if (image.naturalWidth) anchors.forEach(el=>{
      const item = {x:+el.dataset.x,y:+el.dataset.y,w:+el.dataset.w,h:+el.dataset.h};
      const p = projectObject(item,{width:image.naturalWidth,height:image.naturalHeight},viewport);
      el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.width=`${Math.max(40,p.width)}px`;el.style.height=`${Math.max(36,p.height)}px`;
      el.classList.toggle('label-left',p.x > viewport.width*.75);
      el.classList.toggle('label-right',p.x < viewport.width*.25);
    });
    const origin=canvas.getBoundingClientRect();
    const obstacles=[...canvas.querySelectorAll('[data-anchor],.map-pin,.pet-button')].map(el=>{const r=el.getBoundingClientRect();return{x:r.left-origin.left,y:r.top-origin.top,width:r.width,height:r.height};});
    if(isHall) {
      const size=clamp(viewport.width*.09,46,115);
      const sizing=ids.map(id=>({id,size,width:size+12,height:size+27}));
      if(hallPets)hallPets.resize(sizing);
      else {
        const placements=scatterCharacters(ids,viewport,obstacles);
        hallPets=createHallPetController({canvas,elements:[...layer.querySelectorAll('.hall-pet')],placements});
      }
    } else if(image.naturalWidth) {
      residents.forEach(({id,point})=>{
        const el=layer.querySelector(`[data-value="${id}"]`);
        const p=projectObject({x:point.x,y:point.y,w:0,h:point.height*CHARACTER_SCALE[id]}, {width:image.naturalWidth,height:image.naturalHeight}, viewport);
        el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.setProperty('--standing-height',`${host?Math.min(p.height,viewport.height*.84):p.height}px`);el.style.zIndex=Math.round(p.y);
      });
    }
  }
  scatterScene=isHall?()=>{
    if(!hallPets)return position();
    const viewport={width:canvas.clientWidth,height:canvas.clientHeight};
    const origin=canvas.getBoundingClientRect();
    const obstacles=[...canvas.querySelectorAll('[data-anchor]')].map(el=>{const r=el.getBoundingClientRect();return{x:r.left-origin.left,y:r.top-origin.top,width:r.width,height:r.height};});
    hallPets.scatter(scatterCharacters(ids,viewport,obstacles));
  }:position;
  const resize=new ResizeObserver(position);resize.observe(canvas);
  image.addEventListener('load',position); position();
  cleanups.push(()=>{resize.disconnect();image.removeEventListener('load',position);hallPets?.destroy();scatterScene=()=>{};});
}

function recordsDialog() { showDialog('桌上的學生名冊', `<p>翻開名冊，選擇想認識的同學。</p><div class="story-list">${characters.map(c=>button('record',`${c.name} <i>查看 →</i>`,c.id)).join('')}</div>`); }
function versionDialog(){
  showDialog(`版本紀錄 · v${APP_VERSION}`,`<div class="version-history">${VERSION_HISTORY.map((release,index)=>`<section class="version-entry ${index===0?'current':''}"><header><strong>v${esc(release.version)}</strong><time datetime="${esc(release.date)}">${esc(release.date)}</time></header><h3>${esc(release.title)}</h3><ul>${release.changes.map(change=>`<li>${esc(change)}</li>`).join('')}</ul></section>`).join('')}</div>`,button('close','關閉'));
}
async function libraryStory(id){
  const story=stories.find(item=>item.id===id);
  if(!story)return;
  const meta=story.series?`${story.author} · 專欄 ${story.column}`:`${story.label} · 館藏文章`;
  const back=story.series?button('story-series','← 回到專欄目錄',story.series):'';
  showDialog(story.title,`<span class="eyebrow">${esc(meta)}</span><article class="reading reading-source" data-library-story="${esc(story.id)}" aria-live="polite">正在取書……</article>`,back+button('read','讀完了，收藏這篇文章',story.id,'primary'));
  const article=dialog.querySelector(`[data-library-story="${story.id}"]`);
  try{
    const text=await readLibraryStory(story.id);
    if(article?.isConnected&&article.dataset.libraryStory===story.id)article.textContent=text;
  }catch{
    if(article?.isConnected&&article.dataset.libraryStory===story.id)article.textContent='暫時無法讀取這篇文章，請稍後再試。';
  }
}
function storySeries(series){
  const entries=stories.filter(story=>story.series===series).sort((a,b)=>a.column-b.column);
  if(!entries.length)return;
  showDialog(`${entries[0].author}專欄`,`<p>同一位作者的連載文章。</p><div class="story-list">${entries.map(story=>button('story',`<span><small>專欄 ${story.column}</small>${esc(story.title)}</span><i>閱讀 →</i>`,story.id)).join('')}</div>`);
}
function wardrobeDialog() {
  showDialog('活米村的奇妙衣櫥',`<img class="dialog-portrait" src="${outfitAsset()}" alt="目前造型"><p>今天想以哪一種模樣漫遊校園？</p><div class="swatches">${[['uniform','學院制服'],['chibi','Q 版化身'],['cat','貓咪變身']].map(([v,t])=>`<button data-action="outfit" data-value="${v}" aria-pressed="${state.outfit===v}">${t}</button>`).join('')}</div><p class="source-note">找到寵物夥伴，就能解鎖貓咪變身。</p>`);
}
function weatherDialog() {
  showDialog('望遠鏡裡的天空',`<label for="city">觀測城市</label><select id="city"><option value="taipei">臺北</option><option value="london">倫敦</option><option value="edinburgh">愛丁堡</option></select><div id="weather" role="status"></div><p class="weather-credit">天氣資料：<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>`); loadWeather();
}

function render() {
  closeHeadConversation();
  cleanups.forEach(fn => fn()); cleanups = []; snitchActive = false;
  dialog.close();
  let route = currentRoute();
  roomAccess.sync(state.character,route);
  if(route!=='pitch')pitchGame=false;
  renderedScheduleKey=scheduleWindow().key;
  if (!state.character && !['select','map','hall'].includes(route)) { toast('先選擇一位角色，開始校園生活。'); go('select'); return; }
  let page;
  if (route === 'select') page = selection();
  else if (route === 'map') page = mapView();
  else if (route === 'hall') page = hallView();
  else if (route === 'office') page = officeView();
  else if (route.startsWith('room/')) page = roomView(route.split('/')[1]);
  else if (places.some(p => p.id === route)) page = placeView(route);
  if (!page) { go(state.character ? 'atrium' : 'select'); return; }
  app.innerHTML = header(route) + page;
  document.title = `${document.querySelector('h1')?.textContent || '魔法學院'} · 魔法日常`;
  if (route === 'forest') findPet();
  if (route.startsWith('room/') && roomAccess.canEnter(state,route.split('/')[1])) renderRoomPets(route.split('/')[1]);
  if (route === 'pitch' && pitchGame) {
    flightController=createFlightController({field:document.querySelector('#field'),controls:document.querySelector('#flight-controls'),selected:state.character,onTalk:talk});
    cleanups.push(()=>{flightController.destroy();flightController=null;});
  } else if (!['select','map'].includes(route)) arrangeScene();
  window.scrollTo(0,0);
  const heading = document.querySelector('h1');
  heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true});
}
function talk(id, topic = 'scene', hall = false) {
  const c = character(id); if (!c) return;
  if(id===state.character)return;
  closeHeadConversation();
  if (!hall && state.character && id !== state.character) { remember(state.met,id); save(); }
  const visibleIds = !hall && !pitchGame && document.querySelector('.immersive')?.dataset.scene === currentRoute()
    ? [...document.querySelectorAll('.standing-npc')].map(el=>el.dataset.value) : [];
  const invited=roomAccess.offer(id,state.character,currentRoute(),scheduleWindow().key,visibleIds);
  const first=topic==='scene'&&beginGreeting(state,id);
  if(first)save();
  const greeting=first?greetingFor(state.character,id):null;
  const dialogueKey=`${state.character}:${id}:${currentRoute()}:${topic}`;
  const previous=lastHeadDialogue.get(dialogueKey);
  let speech;
  if(greeting)speech=greeting;
  else if(topic==='scene')speech=clickedDialogue(id,dialogueFor(id,state.character,currentRoute(),topic),previous);
  else speech=distinctDialogue(()=>dialogueFor(id,state.character,currentRoute(),topic),previous);
  if(topic==='small-talk'){
    const text=ambientLine(id,lastSmallTalk.get(id));lastSmallTalk.set(id,text);
    speech={action:'',text};
  }
  lastHeadDialogue.set(dialogueKey,speech.text);
  const actionName = hall ? 'hall-topic' : 'topic';
  const topics = [['small-talk','聊點日常'],['friends','說說彼此的近況'],['lost','如果一起迷路了？'],['upset','今天有一點低落']].map(([key,label])=>button(actionName,label,`${id}:${key}`)).join('')+chatForm(id);
  const speechBody=`<p class="stage-direction">${esc(speech.action)}</p><p class="spoken-line">「${esc(speech.text)}」</p>`;
  if(roomAccess.host(state,currentRoute())===id){
    showRoomConversation(id,'房間裡的悄悄話',speechBody,topics+(state.inventory.includes(id)?button('gift','送出'+c.gift,id):''));return;
  }
  const anchor=document.querySelector(`.scene-npc[data-value="${id}"],.rider[data-rider="${id}"]`);
  if(anchor)headConversation=mountHeadConversation(anchor,c.short,speech.text,topics+(invited?button('visit-room','去房間看看 →',id,'primary'):'')+button('close-head','結束對話'),closeHeadConversation);
}
async function journal(id = state.character) {
  if(!character(id)){toast('請先選擇角色，再閱讀他的日記。');return;}
  const audience=diaryAudience(id,state.character,currentRoute(),roomAccess.canEnter(state,id));
  if(!audience){toast('需要和房間主人一起，才能翻閱他願意分享的日記。');return;}
  const own=audience==='self';
  showDialog(`${character(id).short}的日記`, `<p class="source-note">${own?'自己的私人日記':'房間主人分享的頁面'}</p><article class="character-diary" aria-live="polite">正在翻開日記……</article>`,button('close','闔上日記'));
  const article=dialog.querySelector('.character-diary');
  try {const text=await readDiary(id,audience);if(article.isConnected)article.textContent=text;}
  catch {if(article.isConnected){article.textContent='暫時無法讀取日記，請稍後再試。';article.insertAdjacentHTML('afterend',button('read-diary','重新讀取',id));}}
}
function roomItem(id, item) {
  if(currentRoute()!==`room/${id}`||!roomAccess.canEnter(state,id)||!ROOM_REACTIONS[id]?.[item])return;
  const c=character(id), own=id===state.character, speech=ROOM_REACTIONS[id][item];
  let actions=item==='diary'?button('read-diary',own?'翻閱私人日記':'翻閱分享頁面',id,'primary'):'';
  const collected=state.inventory.includes(id)||state.gifts.includes(id);
  if(item==='gift'&&!collected)actions+=button('collect',own?'收進行囊':'收下這份小物',id,'primary');
  if(item==='gift'&&collected)actions+='<p class="source-note">這份小物已經收藏過了。</p>';
  const title={diary:'桌上的日記',gift:c.gift,window:'窗邊的風景'}[item];
  showRoomConversation(id,title,own?`<p>這是${c.short}熟悉的房間。${item==='diary'?'日記停在上次寫下的那一頁。':item==='gift'?'小物好好地收在床頭。':'窗外傳來校園遠處的聲音。'}</p>`:`<p class="stage-direction">${esc(speech.action)}</p><p class="spoken-line">「${esc(speech.text)}」</p>`,actions);
}
function inventory() {
  const owned=petsFor(state);
  showDialog('隨身行囊', `<h3>紀念小物</h3>${state.inventory.length ? `<ul class="inventory-list">${state.inventory.map(id=>`<li><span>${character(id).gift}</span>${button('gift','送給'+character(id).short,id)}</li>`).join('')}</ul>` : '<p class="muted">行囊裡還沒有小物，去朋友的宿舍看看吧。</p>'}<h3>寵物夥伴 · ${owned.length}/${PETS.length}</h3><div class="pet-list">${owned.map(id=>{const pet=PETS.find(p=>p.id===id);return `<figure><img src="${pet.image}" alt="${pet.name}"><figcaption>${pet.name}</figcaption></figure>`;}).join('')}</div><p class="muted">${owned.length ? '牠們已經在你的房間安頓下來了。' : '仔細看看森林各個角落，或許能遇見新朋友。'}</p>`);
}
let petId;
function findPet() {
  const stage=document.querySelector('#pet-stage');
  if(!stage||currentRoute()!=='forest'||!state.character)return;
  const available=PETS.filter(p=>!petsFor(state).includes(p.id));
  petId=null;
  if(!available.length){stage.innerHTML=`<div class="panel"><h2>森林夥伴都找到了！</h2><p>牠們正在你的房間等你。</p>${link('room/'+state.character,'回房間看看 →')}</div>`;return;}
  const pet=available[Math.floor(Math.random()*available.length)],point=hiddenPetPoint();
  petId=pet.id;
  stage.innerHTML=`<button class="pet-button forest-pet" style="left:${point.x}%;top:${point.y}%" data-action="catch-pet" data-value="${pet.id}" aria-label="捕捉${pet.name}"><img src="${pet.wildImage}" alt="野生的${pet.name}" draggable="false"></button>`;
}
function renderRoomPets(owner){
  const canvas=document.querySelector('.scene-canvas');
  if(!canvas)return;
  const stage=document.createElement('div');stage.className='room-pets';stage.setAttribute('aria-label','房間裡的寵物');
  stage.innerHTML=petsFor(state,owner).map((id,index)=>{
    const pet=PETS.find(p=>p.id===id);
    return `<button class="room-pet" style="left:${12+(index%5)*19}%;top:${86}%" data-action="pet-greet" data-value="${id}" aria-label="摸摸${pet.name}"><img src="${pet.image}" data-normal="${pet.image}" data-happy="${pet.happyImage}" alt="${pet.name}" draggable="false"></button>`;
  }).join('');
  canvas.append(stage);
}
function launch() {
  if (snitchActive) return;
  const field = document.querySelector('#field'); if (!field) return;
  snitchActive = true;
  field.insertAdjacentHTML('beforeend', `<button class="snitch" data-action="catch" aria-label="捕捉金探子"><img src="${asset('snitch')}" alt="金探子"></button>`);
  const snitch = field.querySelector('.snitch');
  snitch.focus({preventScroll:true});
  document.querySelector('#game-status').textContent='金探子出現了！你有 10 秒的時間。';
  document.querySelector('[data-action=launch]').disabled = true;
  const move = () => {const x=8+Math.random()*Math.max(0,field.clientWidth-110),y=8+Math.random()*Math.max(0,field.clientHeight-110);snitch.style.left=`${x}px`;snitch.style.top=`${y}px`;flightController?.chase({x:x+45,y:y+35});};
  move();
  const interval = setInterval(move,1000);
  const timeout = setTimeout(()=>finish(false),10000);
  function finish(caught) {
    if(!snitchActive)return; snitchActive=false; clearInterval(interval);clearTimeout(timeout);snitch.remove();flightController?.chase(null);
    if(caught){state.catches++;save();document.querySelector('#catch-count').textContent=state.catches;}
    document.querySelector('#game-status').textContent=caught?'抓到了！金色的翅膀在你手心輕輕顫動。':'金探子飛遠了，再試一次吧。';
    const start=document.querySelector('[data-action=launch]');start.disabled=false;start.focus({preventScroll:true});
  }
  snitch.addEventListener('click',()=>finish(true));
  cleanups.push(()=>{clearInterval(interval);clearTimeout(timeout);});
}
async function loadWeather() {
  const el=document.querySelector('#weather'); if(!el)return;
  const cities={taipei:[25.03,121.56],london:[51.51,-.13],edinburgh:[55.95,-3.19]};
  const coords=cities[document.querySelector('#city').value];
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);cleanups.push(()=>{controller.abort();clearTimeout(timeout);});
  el.innerHTML='<p>正在觀測天空……</p>';
  const requestId=String(Math.random());el.dataset.request=requestId;
  try {
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`;
    const res=await fetch(url,{signal:controller.signal});if(!res.ok)throw new Error('weather');const data=await res.json();
    if(!Number.isFinite(data.current?.temperature_2m)||!Array.isArray(data.daily?.time))throw new Error('data');
    if(!el.isConnected||el.dataset.request!==requestId)return;
    const code=data.current.weather_code; const description=code===0?'晴朗':code<=3?'多雲':code<=48?'有霧':code>=95?'雷雨':code>=71&&code<=77?'降雪':'有雨';
    el.innerHTML=`<div class="weather-value">${Math.round(data.current.temperature_2m)}°<span style="font-size:18px">C</span></div><p>${description} · 觀測時間 ${esc(data.current.time.replace('T',' '))}</p><div class="weather-days">${data.daily.time.map((day,i)=>`<div>${esc(day.slice(5))}<strong>${Math.round(data.daily.temperature_2m_min[i])}–${Math.round(data.daily.temperature_2m_max[i])}°</strong></div>`).join('')}</div>`;
  } catch {if(el.isConnected&&el.dataset.request===requestId)el.innerHTML=`<p>暫時無法取得天氣，請稍後重試。</p>${button('weather','重新觀測')}`;} finally {clearTimeout(timeout);}
}
document.addEventListener('click',async e=>{
  const navigation=e.target.closest('a[href^="#/"]');
  if(navigation && dialog.open) dialog.close();
  const target=e.target.closest('[data-action]'); if(!target)return;
  const {action,value}=target.dataset;
  if(action==='close')dialog.close();
  if(action==='version-history')versionDialog();
  if(action==='chat-settings')chatSettings();
  if(action==='reset-progress')showDialog('重置探索紀錄',`<p>確定要重新開始嗎？角色選擇、初次招呼、探索足跡、收藏物品、寵物夥伴、魁地奇紀錄，以及此瀏覽器的角色對話記憶與身分疑慮都會被清除。</p><p>朋友不會記得你先前說過的話，但下次交談時，可能短暫覺得自己忘了什麼。</p><p class="reset-warning">這個動作無法復原。</p>`,button('close','先不要')+button('confirm-reset','確定重置','','danger'));
  if(action==='confirm-reset'){
    try { await freeChat.reset(); } catch(error) { toast(error.message);return; }
    resetProgress(state);
    try{storage?.removeItem(STORAGE_KEY);}catch{}
    roomAccess.dismiss();lastSmallTalk.clear();lastHeadDialogue.clear();chosen='abby';pitchGame=false;
    dialog.close();go('select');toast('探索紀錄已重置。');
  }
  if(action==='close-head'){closeHeadConversation();refreshSchedule();}
  if(action==='start-game'&&currentRoute()==='pitch'){pitchGame=true;render();}
  if(action==='end-game'){pitchGame=false;render();}
  if(action==='open-map')go('map');
  if(action==='open-office')go('office');
  if(action==='open-room')go('room/'+value);
  if(action==='visit-room'){
    if(roomAccess.enter(value,state.character,currentRoute(),scheduleWindow().key)){dialog.close();go('room/'+value);}
    else {dialog.close();toast('邀約已結束，請重新找到本人再邀對方一起回房。');}
  }
  if(action==='room-item'){const [id,item]=value.split(':');roomItem(id,item);}
  if(action==='read-diary')journal(value);
  if(action==='records')recordsDialog();
  if(action==='weather-dialog')weatherDialog();
  if(action==='wardrobe')wardrobeDialog();
  if(action==='lore')showDialog('黑板上的世界設定',`<div class="lore">${lore.map(([title,text])=>`<details open><summary>${title}</summary><p>${text}</p></details>`).join('')}</div>`,link('office','前往老師辦公室 →'));
  if(action==='hints'){const visible=document.querySelector('.scene-canvas').classList.toggle('show-hotspots');target.textContent=visible?'收起互動提示':'顯示互動提示';target.setAttribute('aria-pressed',visible);}
  if(action==='choose'){chosen=value;document.querySelectorAll('.character-card').forEach(el=>{el.classList.toggle('selected',el.dataset.value===value);el.setAttribute('aria-pressed',el.dataset.value===value);});document.querySelector('[data-action=enter]').textContent=`以${character(chosen).short}的身分，進入學院　→`;}
  if(action==='enter'){state.character=chosen;save();go('atrium');}
  if(action==='talk')talk(value);
  if(action==='topic'||action==='hall-topic'){const [id,topic]=value.split(':');talk(id,topic,action==='hall-topic');}
  if(action==='journal')journal();
  if(action==='inventory')inventory();
  if(action==='story')libraryStory(value);
  if(action==='story-series')storySeries(value);
  if(action==='read'){remember(state.read,value);save();render();toast('文章已收進冒險手記。');}
  if(action==='record'){const c=character(value);showDialog(c.name,`<p class="eyebrow">${c.english} · ${c.schoolHouse}</p><dl class="character-facts"><div><dt>身高</dt><dd>${c.height} cm</dd></div><div><dt>生日</dt><dd>${c.birthday}</dd></div><div><dt>擅長科目</dt><dd>${c.subject}</dd></div>${c.position?`<div><dt>球隊位置</dt><dd>${c.position}</dd></div>`:''}</dl><img class="record-img" src="${asset(value+'-record')}" alt="${c.name}的學生資訊紀錄表原稿；年級等未提供欄位保持空白">`,button('records','← 返回學生名冊'));}
  if(action==='collect'){if(currentRoute()!==`room/${value}`||!roomAccess.canEnter(state,value))return;const c=character(value);if(state.inventory.includes(value)||state.gifts.includes(value)){toast('這份紀念小物已經收藏過了。');return;}collectGift(state,value);save();render();toast(`收藏了${c.gift}。`);}
  if(action==='gift'){if(giveGift(state,value)){save();const speech=dialogueFor(value,null,currentRoute(),'gift');(roomAccess.host(state,currentRoute())===value ? (title,body,actions)=>showRoomConversation(value,title,body,actions) : showDialog)('一份小小心意',`<p>${character(value).short}收下了${character(value).gift}。</p><p class="stage-direction">${speech.action}</p><p>「${speech.text}」</p>`,button('close','收下這段回憶','','primary'));}else toast('這份小物已送出，或還沒有找到。');}
  if(action==='find-pet')findPet();
  if(action==='catch-pet'){
    if(currentRoute()!=='forest'||value!==petId||!capturePet(state,value))return;
    petId=null;save();findPet();toast(`${PETS.find(p=>p.id===value).name}已住進${character(state.character).short}的房間！`);
  }
  if(action==='pet-greet'&&currentRoute().startsWith('room/')){
    const owner=currentRoute().split('/')[1];
    if(roomAccess.canEnter(state,owner)&&petsFor(state,owner).includes(value)){
      const pet=PETS.find(p=>p.id===value),img=target.querySelector('img');
      img.src=img.dataset.happy;target.classList.add('happy');
      setTimeout(()=>{if(img.isConnected){img.src=img.dataset.normal;target.classList.remove('happy');}},1400);
      toast(`${pet.name}開心地向你靠過來。`);
    }
  }
  if(action==='outfit'){state.outfit=value;save();wardrobeDialog();toast('新造型已換上。');}
  if(action==='launch')launch();
  if(action==='weather')loadWeather();
  if(action==='shuffle'){scatterScene();toast('往四周看看，朋友們換了個地方。');}
  if(action==='hall-talk')talk(value,'scene',true);
  if(action==='about')showDialog('歡迎來到魔法日常',`<p>四位熟識的朋友，四種不同的校園日常。選擇角色，看看大家今天在哪裡，讀一段故事，或一起飛一圈。</p><p class="source-note">目前版本 v${APP_VERSION} · 角色資料依照提供的 Character Bible；互動台詞為依設定編寫的情境草稿。角色與場景使用專案提供的素材。</p>`,button('version-history','查看版本紀錄'));
});
document.addEventListener('submit',async e=>{
  const form=e.target;
  if(form.id!=='chat-connect'&&!form.matches('.free-chat-form'))return;
  e.preventDefault();
  const status=form.querySelector('.chat-status'), submit=form.querySelector('[type=submit]');
  const data=new FormData(form), player=state.character, route=currentRoute();
  const replyNode=form.closest('.room-conversation')?.querySelector('.spoken-line')||document.querySelector('.head-conversation p');
  submit.disabled=true;
  try{
    if(form.id==='chat-connect'){
      status.textContent='正在連線……';
      await freeChat.connect(data.get('endpoint'),data.get('password'));
      if(form.isConnected){status.textContent='已連線。回到角色身邊即可自由對談。';form.elements.password.value='';}
    }else{
      status.textContent=`${character(form.dataset.chatSpeaker).short}正在想怎麼回應……`;
      const reply=await freeChat.send(player,form.dataset.chatSpeaker,route,data.get('message'));
      if(form.isConnected&&replyNode?.isConnected&&player===state.character&&route===currentRoute()){
        replyNode.textContent=reply;form.elements.message.value='';status.textContent=freeChat.memory.persistent?'對話記憶已儲存在此瀏覽器。':'瀏覽器儲存不可用，記憶只保留至關閉或重新整理頁面。';
      }
    }
  }catch(error){if(form.isConnected)status.textContent=error.message;}
  finally{if(form.isConnected)submit.disabled=false;}
});
document.addEventListener('change',e=>{if(e.target.id==='city')loadWeather();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
window.addEventListener('hashchange',render);
function refreshSchedule() {
  document.querySelector('.immersive')?.classList.toggle('night',period()==='night');
  if(scheduleWindow().key!==renderedScheduleKey&&!dialog.open&&!headConversation&&!pitchGame) {
    if(!['select','map','hall'].includes(currentRoute()))render();
  }
}
setInterval(refreshSchedule,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSchedule();});
dialog.addEventListener('close',()=>{if(dialog.open)return;dialog.classList.remove('room-conversation');document.querySelector('.immersive')?.classList.remove('room-speaking');roomAccess.dismiss();queueMicrotask(refreshSchedule);});
render();
registerAgentTools({
  readProgress: () => ({ character: state.character, visited: [...state.visited], met: [...state.met], pets: [...petsFor(state)], read: [...state.read], catches: state.catches }),
  navigate: async destination => {
    if (!['map','office','hall',...places.map(p=>p.id)].includes(destination)) throw new Error('Unknown destination');
    if (!state.character) throw new Error('Choose a character first');
    history.pushState(null,'',`#/${destination}`); render();
    return { destination, title: document.title, visited: [...state.visited] };
  },
});
