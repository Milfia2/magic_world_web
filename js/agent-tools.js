// Optional enhancement. Unsupported browsers simply use the visible interface.
export function registerAgentTools({ readProgress, navigate }) {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const tools = [
    {
      name: 'read_campus_progress', title: '查看校園探索進度',
      description: 'Read the selected character, unlocked rooms and visited locations. Does not include private diary text.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => readProgress(),
    },
    {
      name: 'navigate_campus', title: '前往校園地點',
      description: 'Open a campus location and record the visit, like the visible map. A character must already be selected.',
      inputSchema: { type: 'object', properties: { destination: { type: 'string', enum: ['map','atrium','library','classroom','office','observatory','dorms','pitch','forest','village','hall'] } }, required: ['destination'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: input => navigate(input?.destination),
    },
  ];
  for (const tool of tools) {
    try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); }
    catch { /* Optional integration must never prevent the app from starting. */ }
  }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
