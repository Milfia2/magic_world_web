// A click-opened bubble follows the character; options stay below the scene.
export function placeHeadBubble(head, bubble, viewport) {
  const left=Math.max(8,Math.min(viewport.width-bubble.width-8,head.left+head.width/2-bubble.width/2));
  return {left,top:Math.max(8,head.top-bubble.height-12),tail:Math.max(16,Math.min(bubble.width-16,head.left+head.width/2-left))};
}
export function mountHeadConversation(anchor, name, text, actions, onClose) {
  const canvas=anchor.closest('.scene-canvas'), image=anchor.querySelector('img');
  const bubble=document.createElement('section');bubble.className='head-conversation';
  bubble.setAttribute('aria-label',`${name}的對話`);bubble.setAttribute('role','region');
  const title=document.createElement('strong');title.textContent=name;
  const words=document.createElement('p');words.textContent=`「${text}」`;words.setAttribute('aria-live','polite');
  bubble.append(title,words);document.body.append(bubble);
  const menu=document.createElement('div');menu.className='head-conversation-options';
  menu.setAttribute('role','group');menu.setAttribute('aria-label',`${name}的對話選項`);menu.innerHTML=actions;canvas.after(menu);
  let frame;
  function position() {
    const bounds=canvas.getBoundingClientRect();bubble.hidden=bounds.bottom<0||bounds.top>innerHeight;
    if(bubble.hidden)return;
    const p=placeHeadBubble(image.getBoundingClientRect(),bubble.getBoundingClientRect(),{width:document.documentElement.clientWidth,height:innerHeight});
    bubble.style.left=`${p.left}px`;bubble.style.top=`${p.top}px`;bubble.style.setProperty('--tail-x',`${p.tail}px`);
  }
  const queue=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(position);};
  const observer=new ResizeObserver(queue);observer.observe(image);observer.observe(bubble);
  const movement=new MutationObserver(queue);movement.observe(anchor,{attributes:true,attributeFilter:['style']});
  window.addEventListener('resize',queue);window.addEventListener('scroll',queue,true);image.addEventListener('load',queue);
  const key=e=>{if(e.key==='Escape'){e.preventDefault();onClose();anchor.focus({preventScroll:true});}};
  const outside=e=>{if(!bubble.contains(e.target)&&!menu.contains(e.target)&&!anchor.contains(e.target))onClose();};
  document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside,true);queue();
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();movement.disconnect();window.removeEventListener('resize',queue);window.removeEventListener('scroll',queue,true);image.removeEventListener('load',queue);document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside,true);bubble.remove();menu.remove();};
}
