const artwork = {
  'abby:thea':'abby_thea',
  'abby:caleb':'caleb_abby',
  'caleb:thea':'caleb_thea',
  'thea:zephyr':'thea_zephyr',
};
export function createHallContactTracker(onContact) {
  const touching=new Set(),lastShown=new Map();
  return (pets,now)=>{
    for(let i=0;i<pets.length;i++)for(let j=i+1;j<pets.length;j++){
      const a=pets[i],b=pets[j],key=[a.id,b.id].sort().join(':');
      if(!artwork[key])continue;
      // Inset the portrait boxes and exclude the name labels below their feet.
      const overlap=a.x+a.width*.85>b.x+b.width*.15&&b.x+b.width*.85>a.x+a.width*.15&&
        a.y+a.height-27>b.y+b.height*.1&&b.y+b.height-27>a.y+a.height*.1;
      if(!overlap){touching.delete(key);continue;}
      if(!touching.has(key)&&now-(lastShown.get(key)??-Infinity)>=3500){
        lastShown.set(key,now);
        onContact({image:`./assets/interactive/${artwork[key]}.png`,x:(a.x+a.width/2+b.x+b.width/2)/2,y:(a.y+b.y)/2+Math.min(a.height,b.height)*.4});
      }
      touching.add(key);
    }
  };
}
export function createHallInteractions(canvas,reduced) {
  const layer=document.createElement('div');
  layer.setAttribute('aria-hidden','true');
  layer.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:8;overflow:hidden';
  canvas.append(layer);
  const animations=new Set();
  const update=createHallContactTracker(({image,x,y})=>{
    const sticker=document.createElement('img');
    sticker.src=image;sticker.alt='';sticker.draggable=false;
    const size=Math.min(180,Math.max(85,canvas.clientWidth*.16));
    sticker.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;object-fit:contain;pointer-events:none;opacity:0;transform:translate(-50%,-50%)`;
    layer.append(sticker);
    const animation=sticker.animate(reduced?[
      {opacity:0},{opacity:.65,offset:.2},{opacity:0},
    ]:[
      {opacity:0,transform:'translate(-50%,-35%) scale(.65)'},
      {opacity:.72,transform:'translate(-50%,-65%) scale(1)',offset:.18},
      {opacity:.5,transform:'translate(-50%,-110%) scale(1.05)',offset:.65},
      {opacity:0,transform:'translate(-50%,-160%) scale(.95)'},
    ],{duration:reduced?900:2200,easing:'ease-out'});
    animations.add(animation);
    animation.onfinish=()=>{animations.delete(animation);sticker.remove();};
  });
  return {update,destroy(){for(const animation of animations)animation.cancel();animations.clear();layer.remove();}};
}
