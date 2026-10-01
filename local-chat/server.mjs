import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ChatEngine, ChatError } from './engine.mjs';

export async function localConfig() {
  const dir = new URL('../.local-llm/', import.meta.url), file = new URL('config.json', dir);
  await mkdir(dir, { recursive: true });
  try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const config = { model: 'qwen3:4b', ollamaUrl: 'http://127.0.0.1:11435', port: 8787, password: randomBytes(24).toString('base64url'), allowedOrigins: ['https://milfia2.github.io', 'http://127.0.0.1:4173', 'http://localhost:4173'] };
  await writeFile(file, JSON.stringify(config, null, 2), { flag: 'wx', mode: 0o600 });
  return config;
}
export function ollamaGenerator(config, fetcher = fetch) {
  let active = 0;
  return async (messages, signal) => {
    if (active >= 1) throw new ChatError(429, '目前有人正在交談，請稍後再試。');
    active++;
    try {
      const response = await fetcher(`${config.ollamaUrl}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
        body: JSON.stringify({ model: config.model, messages, stream: false, think: false, keep_alive: '10m',
          format: { type: 'object', properties: { reply: { type: 'string' }, deviation: { type: 'string', enum: ['none', 'mild', 'strong'] } }, required: ['reply', 'deviation'], additionalProperties: false },
          options: { num_ctx: 8192, num_predict: 450, temperature: 0.7 } }),
      });
      if (!response.ok) throw new Error('model unavailable');
      const data = await response.json(); return JSON.parse(data.message.content);
    } catch (e) {
      if (e instanceof ChatError) throw e;
      throw new ChatError(503, signal.aborted ? '對話已取消。' : '本機模型暫時無法回覆，請稍後再試。');
    } finally { active--; }
  };
}
const hash = value => createHash('sha256').update(value).digest();
export function createChatServer(config, engine = new ChatEngine({ generate: ollamaGenerator(config) })) {
  const failed = new Map();
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    const origin = req.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) return send(403, { error: '這個網站尚未獲准連線。' });
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      res.writeHead(204); return res.end();
    }
    const ip = req.socket.remoteAddress;
    const failures = failed.get(ip);
    if (failures && Date.now() - failures.at < 60000 && failures.count >= 20) return send(429, { error: '嘗試過於頻繁，請一分鐘後再試。' });
    const provided = req.headers.authorization || '';
    if (!timingSafeEqual(hash(provided), hash(`Bearer ${config.password}`))) {
      if (failed.size > 1000) failed.clear();
      failed.set(ip, { at: Date.now(), count: failures && Date.now() - failures.at < 60000 ? failures.count + 1 : 1 });
      return send(401, { error: '連線密碼不正確。' });
    }
    if (req.method !== 'POST' || !['/api/session', '/api/chat'].includes(req.url)) return send(404, { error: '找不到服務。' });
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: '需要 JSON。' });
    try {
      const chunks=[]; let size=0;
      for await (const chunk of req) { size+=chunk.length; if(size>128000)throw new ChatError(413,'訊息太長。'); chunks.push(chunk); }
      const raw=Buffer.concat(chunks).toString('utf8');
      let body; try { body = JSON.parse(raw); } catch { throw new ChatError(400, '格式不正確。'); }
      if (!body || Array.isArray(body) || typeof body !== 'object') throw new ChatError(400, '格式不正確。');
      if (req.url === '/api/session') {
        return send(200, { protocol:2 });
      }
      const controller=new AbortController();
      const cancel=()=>{if(!res.writableEnded)controller.abort();};
      res.once('close',cancel);
      try { send(200, await engine.chat(body,controller.signal)); }
      finally { res.off('close',cancel); }
    } catch (e) { send(e.status || 500, { error: e instanceof ChatError ? e.message : '服務暫時無法處理，請稍後再試。' }); }
  });
}
export function isEntrypoint(entryPath, moduleUrl = import.meta.url) {
  if (!entryPath) return false;
  try { return realpathSync(entryPath) === realpathSync(fileURLToPath(moduleUrl)); }
  catch { return false; }
}
if (isEntrypoint(process.argv[1])) {
  const config = await localConfig();
  createChatServer(config).listen(config.port, '127.0.0.1', () => console.log(`Local character chat: http://127.0.0.1:${config.port} (password in .local-llm/config.json)`));
}
