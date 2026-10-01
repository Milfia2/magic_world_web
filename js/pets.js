const pet=(file,name,scale,wildFile=`${file}_wild`)=>({
  id:file.toLowerCase(),name,scale,
  image:`./assets/pets/${file}.png`,
  wildImage:`./assets/pets/${wildFile}.png`,
  happyImage:`./assets/pets/${file}_happy.png`,
});
export const PETS = [
  pet('Bowtruckle','木精',.62),
  pet('fluffy','三頭犬',3.38),
  pet('Kneazle','獅尾貓',2),
  pet('Niffler','玻璃獸',1.3),
  pet('Puffskein','蒲絨絨',.74),
];
export const normalizePetIds=value=>Array.isArray(value)?[...new Set(value.map(id=>typeof id==='string'?id.replace(/-[123]$/,''):id).filter(id=>PETS.some(p=>p.id===id)))]:[];
export const normalizePetPositions=value=>{
  const positions={};
  if(!value||typeof value!=='object'||Array.isArray(value))return positions;
  for(const [id,point] of Object.entries(value))if(PETS.some(pet=>pet.id===id)&&point&&Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=4&&point.x<=96&&point.y>=12&&point.y<=96)positions[id]={x:point.x,y:point.y};
  return positions;
};
export const petsFor = (state,owner=state.character) => state.companions?.[owner] || [];
export function capturePet(state,id){
  if(!Object.hasOwn(state.companions,state.character)||!PETS.some(p=>p.id===id))return false;
  const owned=petsFor(state);
  if(owned.includes(id))return false;
  owned.push(id);return true;
}
export function releasePet(state,id){
  if(!Object.hasOwn(state.companions,state.character)||!petsFor(state).includes(id))return false;
  state.companions[state.character]=petsFor(state).filter(petId=>petId!==id);
  if(state.petPositions?.[state.character])delete state.petPositions[state.character][id];
  return true;
}
export function hiddenPetPoint(random=Math.random){return {x:5+random()*90,y:6+random()*88};}
