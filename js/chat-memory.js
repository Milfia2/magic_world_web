export const CHAT_MEMORY_KEY = 'magic-world:chat-memory:v1';
const ids = ['abby','gaile','thea','zephyr'];
export function validatePair(value = {}) {
  const history=value.history ?? [];
  if (!Array.isArray(history) || history.length>10 || history.length%2) throw new Error('Invalid history');
  const clean=history.map((entry,index)=>{
    if (!entry || entry.role!==(index%2?'assistant':'user') || typeof entry.content!=='string' || !entry.content.trim() || entry.content.length>(index%2?3200:1500)) throw new Error('Invalid history entry');
    return {role:entry.role,content:entry.content};
  });
  const suspicion=value.suspicion ?? 0;
  if (!Number.isInteger(suspicion) || suspicion<0 || suspicion>3) throw new Error('Invalid suspicion');
  if (value.echoSeen!==undefined && typeof value.echoSeen!=='boolean') throw new Error('Invalid echo state');
  return {history:clean,suspicion,echoSeen:value.echoSeen===true};
}
export class BrowserChatMemory {
  constructor(storage) { this.storage=storage; this.value={generation:'initial',resetEcho:false,pairs:{}}; this.persistent=!!storage; }
  read() {
    if (!this.storage) return this.value;
    let encoded;
    try { encoded=this.storage.getItem(CHAT_MEMORY_KEY); }
    catch { this.persistent=false;throw new Error('瀏覽器無法讀取對話記憶，請檢查網站儲存權限。'); }
    try {
      const raw=JSON.parse(encoded||'null');
      if (!raw || typeof raw.generation!=='string' || !raw.pairs || typeof raw.pairs!=='object') return this.value={generation:'initial',resetEcho:false,pairs:{}};
      const pairs={};
      for (const [key,pair] of Object.entries(raw.pairs)) {
        const parts=key.split(':');
        if(parts.length!==2 || parts[0]===parts[1] || !parts.every(id=>ids.includes(id)))continue;
        try { pairs[key]={...validatePair(pair),revision:typeof pair.revision==='string'?pair.revision:''}; } catch {}
      }
      this.value={generation:raw.generation,resetEcho:raw.resetEcho===true,pairs};
    } catch { this.value={generation:'initial',resetEcho:false,pairs:{}}; }
    return this.value;
  }
  write(value) {
    if(this.storage) {
      try { this.storage.setItem(CHAT_MEMORY_KEY,JSON.stringify(value));this.persistent=true; }
      catch { this.persistent=false;throw new Error('瀏覽器無法儲存對話記憶，請檢查網站儲存權限或可用空間。'); }
    }
    this.value=value;
  }
  reset() { this.write({generation:crypto.randomUUID(),resetEcho:true,pairs:{}}); }
  snapshot(key) {
    const state=this.read();
    return {generation:state.generation,resetEcho:state.resetEcho,pair:state.pairs[key]||{history:[],suspicion:0,echoSeen:false,revision:''}};
  }
  commit(key,snapshot,pair) {
    const current=this.read();
    if(current.generation!==snapshot.generation || (current.pairs[key]?.revision||'')!==snapshot.pair.revision) throw new Error('對話記憶已在其他分頁更新或重置，請重新交談。');
    this.write({...current,pairs:{...current.pairs,[key]:{...validatePair(pair),revision:crypto.randomUUID()}}});
  }
}
