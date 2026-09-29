const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
// Feet stay below a conservative floor line in Q_Lobby.png (1448 × 1086).
export function hallFloorY(bounds){
  const scale=Math.max(bounds.width/1448,bounds.height/1086);
  return bounds.height-1086*scale*(1-.81);
}
const minimumY=(pet,bounds)=>Math.min(Math.max(0,bounds.height-pet.height),Math.max(0,(bounds.floorY??0)-(pet.height-27)));
const horizontalClamp=(pet,bounds)=>clamp(pet.x,0,Math.max(0,bounds.width-pet.width));

export function constrainHallPet(pet,bounds){
  return {...pet,x:horizontalClamp(pet,bounds),y:clamp(pet.y,minimumY(pet,bounds),Math.max(0,bounds.height-pet.height))};
}
export function constrainDraggedHallPet(pet,bounds){
  return {...pet,x:horizontalClamp(pet,bounds),y:clamp(pet.y,0,Math.max(0,bounds.height-pet.height))};
}
export function advanceFallingHallPet(pet,bounds,seconds,gravity=900){
  const ground=minimumY(pet,bounds),fallVelocity=Math.max(0,pet.fallVelocity||0)+gravity*seconds;
  const y=Math.min(ground,pet.y+fallVelocity*seconds);
  return {...pet,y,x:horizontalClamp(pet,bounds),fallVelocity,falling:y<ground};
}

export function advanceHallPet(pet,bounds,seconds){
  let next=constrainHallPet({...pet,x:pet.x+pet.vx*seconds,y:pet.y+pet.vy*seconds},bounds);
  const maxX=Math.max(0,bounds.width-next.width),maxY=Math.max(0,bounds.height-next.height);
  if((next.x<=0&&next.vx<0)||(next.x>=maxX&&next.vx>0))next.vx*=-1;
  if((next.y<=minimumY(next,bounds)&&next.vy<0)||(next.y>=maxY&&next.vy>0))next.vy*=-1;
  return next;
}

export function createHallPetController({canvas,elements,placements,random=Math.random,requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}){
  let frame=0,last=0,destroyed=false;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  const velocity=()=>{const speed=18+random()*22,angle=random()*Math.PI*2;return {vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed*.65};};
  const pets=elements.map((element,index)=>{const placement=placements[index],motion=velocity();return {element,x:placement.x,y:placement.y,width:placement.width,height:placement.height,...motion,turnAt:1500+random()*3500,drag:null,suppress:false};});
  function bounds(){const box={width:canvas.clientWidth,height:canvas.clientHeight};return {...box,floorY:hallFloorY(box)};}
  function paint(pet){
    pet.element.style.left=`${pet.x}px`;pet.element.style.top=`${pet.y}px`;
    pet.element.style.zIndex=String(20+Math.round(pet.y));pet.element.style.setProperty('--pet-facing',pet.vx<0?'-1':'1');
  }
  function applyPlacement(pet,placement){
    pet.element.style.width=`${placement.width}px`;pet.element.style.setProperty('--npc-size',`${placement.size}px`);
    Object.assign(pet,constrainHallPet({...pet,x:placement.x,y:placement.y,width:placement.width,height:placement.height},bounds()),velocity());
    pet.turnAt=1500+random()*3500;paint(pet);
  }
  pets.forEach((pet,index)=>{
    const element=pet.element;applyPlacement(pet,placements[index]);if(!reduced)element.classList.add('walking');
    const down=event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      const origin=canvas.getBoundingClientRect();
      pet.drag={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,offsetX:event.clientX-origin.left-pet.x,offsetY:event.clientY-origin.top-pet.y,moved:false};
      try{element.setPointerCapture?.(event.pointerId);}catch{}
      pet.falling=false;pet.fallVelocity=0;element.classList.remove('falling');
      element.classList.add('dragging');element.classList.remove('walking');
    };
    const move=event=>{
      if(!pet.drag||pet.drag.pointerId!==event.pointerId)return;
      const origin=canvas.getBoundingClientRect();
      if(Math.hypot(event.clientX-pet.drag.startX,event.clientY-pet.drag.startY)>5)pet.drag.moved=true;
      const next=constrainDraggedHallPet({...pet,x:event.clientX-origin.left-pet.drag.offsetX,y:event.clientY-origin.top-pet.drag.offsetY},bounds());
      pet.x=next.x;pet.y=next.y;paint(pet);event.preventDefault();
    };
    const up=event=>{
      if(!pet.drag||pet.drag.pointerId!==event.pointerId)return;
      const moved=pet.drag.moved;pet.drag=null;element.classList.remove('dragging');
      if(moved){pet.suppress=true;setTimeout(()=>{pet.suppress=false;},0);}
      const ground=minimumY(pet,bounds());pet.falling=pet.y<ground;pet.fallVelocity=0;
      if(reduced&&pet.falling){pet.y=ground;pet.falling=false;paint(pet);}
      if(pet.falling)element.classList.add('falling');
      else {element.classList.remove('falling');if(!reduced)element.classList.add('walking');Object.assign(pet,velocity());}
      pet.turnAt=performance.now()+1200+random()*2500;
    };
    const click=event=>{if(pet.suppress){event.preventDefault();event.stopImmediatePropagation();pet.suppress=false;}};
    element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('click',click,true);
    pet.cleanup=()=>{element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('click',click,true);};
  });
  function tick(now){
    if(destroyed)return;
    const seconds=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!reduced)for(const pet of pets)if(!pet.drag){
      if(pet.falling){
        Object.assign(pet,advanceFallingHallPet(pet,bounds(),seconds));
        if(!pet.falling){pet.element.classList.remove('falling');pet.element.classList.add('walking');Object.assign(pet,velocity());}
      } else {
        if(now>=pet.turnAt){Object.assign(pet,velocity());pet.turnAt=now+1800+random()*4200;}
        Object.assign(pet,advanceHallPet(pet,bounds(),seconds));
      }
      paint(pet);
    }
    frame=requestFrame(tick);
  }
  frame=requestFrame(tick);
  return {
    scatter(nextPlacements){pets.forEach((pet,index)=>applyPlacement(pet,nextPlacements[index]));},
    resize(sizing){pets.forEach((pet,index)=>{const size=sizing[index];pet.element.style.width=`${size.width}px`;pet.element.style.setProperty('--npc-size',`${size.size}px`);pet.width=size.width;pet.height=size.height;Object.assign(pet,constrainHallPet(pet,bounds()));paint(pet);});},
    snapshot(){return pets.map(({element,drag,cleanup,suppress,...pet})=>({...pet}));},
    destroy(){destroyed=true;cancelFrame(frame);pets.forEach(pet=>pet.cleanup());},
  };
}
