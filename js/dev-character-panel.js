import { characters, places } from './data.js';
import { SPAWN_POINTS } from './character-spawns.js';

// Local testing only. Remove this file and the DEV CHARACTER PANEL block in app.js before publishing.
export function mountCharacterPanel({getPlayer, move, reset}) {
  const panel=document.createElement('details');
  panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:100;background:#17232e;color:#fff;padding:12px;border:1px solid #c3a56d;border-radius:8px;width:260px;max-width:calc(100vw - 24px)';
  const summary=document.createElement('summary');summary.textContent='角色位置測試';panel.append(summary);
  const person=document.createElement('select'), destination=document.createElement('select');
  person.setAttribute('aria-label','測試角色');destination.setAttribute('aria-label','指定地點');
  for(const c of characters)person.add(new Option(c.short,c.id));
  for(const p of [...places,{id:'office',name:'老師辦公室'}].filter(p=>SPAWN_POINTS[p.id]?.length))destination.add(new Option(p.name,p.id));
  const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='font-size:12px;margin:8px 0';
  status.textContent='移動後會一起前往目的地；本時段有效，重新整理即清除。';
  const apply=document.createElement('button');apply.textContent='移動並前往';
  apply.onclick=()=>{
    if(!getPlayer()){status.textContent='請先選擇玩家角色。';return;}
    if(person.value===getPlayer()){status.textContent='請選擇其他角色；玩家本人不會出現在場景中。';return;}
    move(person.value,destination.value);
    status.textContent=`${person.selectedOptions[0].textContent}已前往${destination.selectedOptions[0].textContent}。`;
  };
  const clear=document.createElement('button');clear.textContent='恢復行程';
  clear.onclick=()=>{reset();status.textContent='已清除所有臨時地點，恢復正常行程。';};
  panel.append(person,destination,apply,clear,status);document.body.append(panel);
}
