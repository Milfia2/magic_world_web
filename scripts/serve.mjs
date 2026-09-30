import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep, relative } from 'node:path';
const root = resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp' };
const server = http.createServer(async (req,res)=>{
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path = resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!path.startsWith(root+sep)||pathname.split('/').some(part=>part.startsWith('.'))) {res.writeHead(403);res.end();return;}
    const top = relative(root,path).split(sep)[0];
    if (!['index.html','styles.css','scene.css','favicon.svg','js','assets','content'].includes(top)) { res.writeHead(404); res.end('Not found'); return; }
    if(!(await stat(path)).isFile())throw new Error('not file');
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(path));
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Magic World preview: http://127.0.0.1:${server.address().port}`));
