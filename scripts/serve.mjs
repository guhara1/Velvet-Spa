/** dist/ 정적 서버 (로컬 확인용) — node scripts/serve.mjs [port] */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'dist';
const PORT = Number(process.argv[2] ?? 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const candidates = [join(ROOT, url), join(ROOT, url, 'index.html'), join(ROOT, `${url}.html`)];
  for (const f of candidates) {
    try {
      const st = await stat(f);
      if (!st.isFile()) continue;
      res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' });
      res.end(await readFile(f));
      return;
    } catch { /* 다음 후보 */ }
  }
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
  res.end(await readFile(join(ROOT, '404.html')).catch(() => 'not found'));
}).listen(PORT, () => console.log(`▶ http://localhost:${PORT}`));
