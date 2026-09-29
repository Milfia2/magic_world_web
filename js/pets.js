const pet=(file,name,wildFile=`${file}_wild`)=>({
  id:file.toLowerCase(),name,
  image:`./assets/pets/${file}.png`,
  wildImage:`./assets/pets/${wildFile}.png`,
  happyImage:`./assets/pets/${file}_happy.png`,
});
export const PETS = [
  pet('Bowtruckle','護樹羅鍋'),
  pet('fluffy','三頭犬'),
  pet('Kneazle','獅尾貓','Kneazle3'),
  pet('Niffler','玻璃獸'),
  pet('Puffskein','蒲絨絨'),
];
export const normalizePetIds=value=>Array.isArray(value)?[...new Set(value.map(id=>typeof id==='string'?id.replace(/-[123]$/,''):id).filter(id=>PETS.some(p=>p.id===id)))]:[];
export const petsFor = (state,owner=state.character) => state.companions?.[owner] || [];
export function capturePet(state,id){
  if(!Object.hasOwn(state.companions,state.character)||!PETS.some(p=>p.id===id))return false;
  const owned=petsFor(state);
  if(owned.includes(id))return false;
  owned.push(id);return true;
}
export function hiddenPetPoint(random=Math.random){return {x:5+random()*90,y:6+random()*88};}
