import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('static preview serves the game but never exposes backend profiles, API code, or secrets', async t => {
  const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());
  const [output]=await once(child.stdout,'data');
  const base=String(output).match(/http:\/\/127\.0\.0\.1:\d+/)[0];
  assert.equal((await fetch(base+'/js/free-chat.js')).status,200);
  for(const path of ['/llm_set/overall.md','/llm_set/manifest.json','/local-chat/engine.mjs','/.local-llm/config.json','/js/..%2Fllm_set/manifest.json','/source/anything.png']){
    const response=await fetch(base+path);
    assert.ok([403,404].includes(response.status),path);
  }
});
