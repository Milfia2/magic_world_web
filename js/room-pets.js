const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function clampRoomPetPoint(point) {
  return {x:clamp(point.x,4,96),y:clamp(point.y,12,96)};
}

export function createRoomPetController({canvas,elements,onMove}) {
  const pets=elements.map(element=>({
    element,
    id:element.dataset.value,
    point:clampRoomPetPoint({x:+element.dataset.x,y:+element.dataset.y}),
    drag:null,
    suppress:false,
  }));
  const paint=pet=>{
    pet.element.style.left=`${pet.point.x}%`;
    pet.element.style.top=`${pet.point.y}%`;
    pet.element.style.zIndex=String(10+Math.round(pet.point.y));
  };
  pets.forEach(pet=>{
    const element=pet.element;
    paint(pet);
    const down=event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      const box=canvas.getBoundingClientRect();
      const anchor={x:box.left+box.width*pet.point.x/100,y:box.top+box.height*pet.point.y/100};
      pet.drag={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,offsetX:event.clientX-anchor.x,offsetY:event.clientY-anchor.y,moved:false};
      try{element.setPointerCapture?.(event.pointerId);}catch{}
      element.classList.add('dragging');
    };
    const move=event=>{
      if(!pet.drag||pet.drag.pointerId!==event.pointerId)return;
      const box=canvas.getBoundingClientRect();
      if(Math.hypot(event.clientX-pet.drag.startX,event.clientY-pet.drag.startY)>5)pet.drag.moved=true;
      pet.point=clampRoomPetPoint({
        x:100*(event.clientX-box.left-pet.drag.offsetX)/box.width,
        y:100*(event.clientY-box.top-pet.drag.offsetY)/box.height,
      });
      paint(pet);event.preventDefault();
    };
    const up=event=>{
      if(!pet.drag||pet.drag.pointerId!==event.pointerId)return;
      const moved=pet.drag.moved;pet.drag=null;element.classList.remove('dragging');
      if(moved){pet.suppress=true;onMove(pet.id,{...pet.point});setTimeout(()=>{pet.suppress=false;},0);}
    };
    const click=event=>{if(pet.suppress){event.preventDefault();event.stopImmediatePropagation();pet.suppress=false;}};
    element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('click',click,true);
    pet.cleanup=()=>{element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('click',click,true);};
  });
  return {destroy(){pets.forEach(pet=>pet.cleanup());}};
}
