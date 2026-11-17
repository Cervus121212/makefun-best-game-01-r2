// STORMKEEPER — local play server: serves game/ at http://localhost:8080
// so the game can be played and photographed in desktop Chrome.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

const server = createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
    const file = join(here, 'game', decodeURIComponent(path));
    if (!file.startsWith(join(here, 'game'))) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(404); res.end('not found');
  }
});

server.listen(8080, () => console.log('stormkeeper: http://localhost:8080'));
