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
export function distinctDialogue(create, previous, attempts = 8) {
  let result=create();
  for(let i=1;i<attempts&&result?.text===previous;i++)result=create();
  return result;
}
export function clickedDialogue(id, primary, previous = '', random = Math.random) {
  const byText=new Map();
  if(primary?.text)byText.set(primary.text,primary);
  for(const text of AMBIENT_LINES[id]||[])if(text&&!byText.has(text))byText.set(text,{action:'',text});
  const all=[...byText.values()];
  const alternatives=all.filter(line=>line.text!==previous);
  const choices=alternatives.length?alternatives:all;
  const index=Math.min(choices.length-1,Math.floor(random()*choices.length));
  return choices[index]||primary||{action:'',text:''};
}

// Lines are now requested explicitly by the conversation's "聊點日常" button.
// No timers or automatic speech on entering a scene.
