// Fixed port on purpose: IndexedDB belongs to the origin, so a new port would look like lost data.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = 4173;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  const send = (status, body, type = 'text/plain; charset=utf-8') => {
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(body);
  };
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(400, 'Bad request');
  }
  const file = resolve(join(ROOT, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(ROOT + sep)) return send(403, 'Forbidden');
  const type = MIME[extname(file).toLowerCase()];
  if (!type) return send(404, 'Not found');
  try {
    send(200, await readFile(file), type);
  } catch {
    send(404, 'Not found');
  }
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `พอร์ต ${PORT} ถูกใช้งานอยู่ ปฏิทินอาจเปิดอยู่แล้วที่ http://127.0.0.1:${PORT}` : err.message);
  process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => console.log(`ปฏิทินพร้อมใช้งานที่ http://127.0.0.1:${PORT} (ปิดหน้าต่างนี้เพื่อหยุด)`));
