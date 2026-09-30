import { CHAT_API_URL } from './chat-config.js';
import { BrowserChatMemory } from './chat-memory.js';

export function normalizeChatUrl(value) {
  const url = new URL(value);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('請使用 HTTPS 網址；本機預覽可以使用 localhost。');
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('請只填服務網址，例如 https://chat.example.com。');
  return url.origin;
}
export class FreeChatClient {
  constructor(storage, fetcher = globalThis.fetch.bind(globalThis), memoryStorage) {
    this.storage = storage; this.fetcher = fetcher; this.pending = false; this.revision = 0;
    try { this.saved = JSON.parse(storage?.getItem('magic-world:chat') || '{}'); } catch { this.saved = {}; }
    this.saved ||= {};
    this.memory = new BrowserChatMemory(memoryStorage);
  }
  save() { try { this.storage?.setItem('magic-world:chat', JSON.stringify(this.saved)); } catch {} }
  get url() { return this.saved.url || CHAT_API_URL || (['localhost', '127.0.0.1'].includes(globalThis.location?.hostname) ? 'http://127.0.0.1:8787' : ''); }
  get connected() { return !!(this.saved.password && this.saved.protocol===2); }
  async request(path, body, signal) {
    let response;
    try {
      response = await this.fetcher(`${this.url}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.saved.password}` }, body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(95000)]) : AbortSignal.timeout(15000) });
    } catch (e) { throw new Error(e.name === 'AbortError' ? '對話已取消。' : '無法連到對話服務。請確認主機已開啟、網址與連線設定正確。'); }
    let data; try { data = await response.json(); } catch { throw new Error('對話服務回傳無效資料。'); }
    if (!response.ok) { const error = new Error(data.error || '連線失敗。'); error.status = response.status; throw error; }
    return data;
  }
  async connect(url, password) {
    const nextUrl = normalizeChatUrl(url);
    if (!password.trim()) throw new Error('請輸入連線密碼。');
    this.controller?.abort(); this.revision++;
    const previous = this.saved;
    this.saved = { url: nextUrl, password: password.trim() };
    try {
      const data = await this.request('/api/session', {});
      if(data.protocol!==2)throw new Error('後端版本不支援瀏覽器記憶，請更新後端。');
      this.saved.protocol=2; this.save();
    } catch (e) { this.saved = previous; this.save(); throw e; }
  }
  async reset() {
    this.controller?.abort(); this.revision++;
    this.memory.reset(); return true;
  }
  async send(player, speaker, scene, message) {
    if (!this.connected) throw new Error('請先按「對話連線」填入服務網址與密碼。');
    if (this.pending) throw new Error('請等待上一句回覆完成。');
    this.pending = true; this.controller = new AbortController(); const revision = this.revision;
    try {
      const key=`${player}:${speaker}`, snapshot=this.memory.snapshot(key);
      const response=await this.request('/api/chat',{protocol:2,player,speaker,scene,message,memory:snapshot.pair,resetEcho:snapshot.resetEcho},this.controller.signal);
      if (revision !== this.revision) throw new Error('紀錄已重置。');
      if(response.protocol!==2 || typeof response.reply!=='string' || !response.reply.trim())throw new Error('對話服務回傳無效資料。');
      this.memory.commit(key,snapshot,{history:[...snapshot.pair.history,{role:'user',content:message.trim()},{role:'assistant',content:response.reply}].slice(-10),suspicion:response.suspicion,echoSeen:true});
      return response.reply;
    } finally { this.pending = false; }
  }
}
