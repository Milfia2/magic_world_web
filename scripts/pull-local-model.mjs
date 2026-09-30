import { localConfig } from '../local-chat/server.mjs';
const config = await localConfig();
const response = await fetch(`${config.ollamaUrl}/api/pull`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, stream: true }) });
if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
const decoder = new TextDecoder(); let pending = '', last = 0;
for await (const chunk of response.body) {
  pending += decoder.decode(chunk, { stream: true });
  const lines = pending.split('\n'); pending = lines.pop();
  for (const line of lines.filter(Boolean)) {
    const item = JSON.parse(line);
    if (item.error) throw new Error(item.error);
    if (Date.now() - last > 10000 || item.status === 'success') {
      console.log(item.status, item.total ? `${Math.round(100 * (item.completed || 0) / item.total)}%` : ''); last = Date.now();
    }
  }
}
