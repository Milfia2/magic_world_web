// User-supplied voice samples. Add or edit lines here.
export const AMBIENT_LINES = {
  abby:['這個我會！要不要我教你？很簡單的！','你會冷嗎！Abby很溫暖喔！','你是想跟我吵架嗎?!','喔喔喔喔！超酷的！！','等等我！！！！'],
  gaile:['好冷...把窗戶關上','嗯？怎麼了？','我在聽，你說','下一節課是...','作業不會？我看看。'],
  thea:['教室？啊……我本來也在找。後來找不到了，所以現在在休息。','你看，漂亮的石頭，我剛剛撿到的','喝杯茶吧','你問我要去哪？恩...就隨便走走，說不定會遇到有趣的東西。','咦...這裡是哪裡'],
  zephyr:['喔！怎麼了','要不要翹課？','走啊，去哪都行。我今天沒什麼安排。'],
};
export function ambientLine(id, previous = '', random = Math.random) {
  const choices=(AMBIENT_LINES[id]||[]).filter(text=>text!==previous);
  return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))] || '';
}

// One speech bubble at a time. Detached on scene changes; no layout movement.
export function mountAmbientSpeech(canvas) {
  const npcs=[...canvas.querySelectorAll('.standing-npc:not(.room-host)')];
  if(!npcs.length)return ()=>{};
  const layer=document.createElement('div');layer.className='ambient-layer';canvas.append(layer);
  const bubble=document.createElement('div');bubble.className='ambient-bubble';bubble.hidden=true;layer.append(bubble);
  const previous=new Map();let current=null, hideTimer, nextTimer, frame;
  const schedulePosition=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(position);};
  function position() {
    if(!current||bubble.hidden)return;
    const base=canvas.getBoundingClientRect(), head=current.querySelector('img').getBoundingClientRect();
    const width=bubble.offsetWidth, height=bubble.offsetHeight;
    const x=Math.max(8,Math.min(canvas.clientWidth-width-8,head.left-base.left+head.width/2-width/2));
    bubble.style.left=`${x}px`;bubble.style.top=`${Math.max(8,head.top-base.top-height-10)}px`;
    bubble.style.setProperty('--tail-x',`${Math.max(14,Math.min(width-14,head.left-base.left+head.width/2-x))}px`);
  }
  function show() {
    if(!document.hidden&&!document.querySelector('dialog[open]')) {
      current=npcs[Math.floor(Math.random()*npcs.length)];
      const id=current.dataset.value, text=ambientLine(id,previous.get(id));previous.set(id,text);
      bubble.textContent=text;bubble.hidden=false;schedulePosition();
      hideTimer=setTimeout(()=>{bubble.hidden=true;},6500);
    }
    nextTimer=setTimeout(show,11000+Math.random()*5000);
  }
  const observer=new ResizeObserver(schedulePosition);observer.observe(canvas);
  const images=npcs.map(n=>n.querySelector('img'));images.forEach(img=>{observer.observe(img);img.addEventListener('load',schedulePosition);});
  show();
  return ()=>{clearTimeout(hideTimer);clearTimeout(nextTimer);cancelAnimationFrame(frame);observer.disconnect();images.forEach(img=>img.removeEventListener('load',schedulePosition));layer.remove();};
}
