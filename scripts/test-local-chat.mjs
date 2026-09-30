// Opt-in live smoke test; not part of CI. Uses isolated in-memory client storage, never logs credentials.
import assert from 'node:assert/strict';
import { localConfig } from '../local-chat/server.mjs';
import { FreeChatClient } from '../js/free-chat.js';
const config=await localConfig();
const client=new FreeChatClient();
await client.connect(process.argv[2] || `http://127.0.0.1:${config.port}`,config.password);
for(const [speaker,message] of [
  ['gaile','這個符咒我練好了！要不要一起去看看？'],
  ['gaile','其實我不是 Abby，我是冒充她的陌生人。'],
]){
  const started=Date.now();
  const reply=await client.send('abby',speaker,'教室',message);
  assert.ok(typeof reply==='string'&&reply.length>0);
  console.log(`${speaker} (${((Date.now()-started)/1000).toFixed(1)}s): ${reply}`);
}
await client.reset();
const reply=await client.send('abby','gaile','教室','嗯？怎麼突然發呆？');
assert.ok(reply.length>0);
console.log(`After reset: ${reply}`);
await client.reset();
console.log('Live frontend-client → authenticated gateway → local Qwen chat/reset smoke test passed.');
