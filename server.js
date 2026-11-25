#!/usr/bin/env node
/*
 * Local server (no dependencies, Node 18+).
 *  - serves the static site from public/
 *  - handles /api/* with the shared football-data.org proxy (lib/football-proxy.mjs)
 *
 * The API key comes from env var FOOTBALL_DATA_API_KEY, then FOOTBALL_DATA_API_KEY=...
 * in .env, then the default key in lib/football-proxy.mjs.
 *
 *   node server.js            # http://localhost:8000
 *   PORT=3000 node server.js
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 8000;

function loadKey() {
  if (process.env.FOOTBALL_DATA_API_KEY) return process.env.FOOTBALL_DATA_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const m = env.match(/^\s*FOOTBALL_DATA_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
    if (m) return m[1].trim();
  } catch (e) { /* no .env */ }
  return '';
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon'
};

function serveStatic(res, urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch (e) { rel = '/'; }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

(async () => {
  const { handleApi } = await import('./lib/football-proxy.mjs');
  const envKey = loadKey();

  http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try {
        const out = await handleApi(new Request(url, { method: req.method }), envKey);
        res.writeHead(out.status, Object.fromEntries(out.headers));
        res.end(Buffer.from(await out.arrayBuffer()));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: e.message }));
      }
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    serveStatic(res, url.pathname);
  }).listen(PORT, () => {
    console.log(`Football Tracker running at http://localhost:${PORT}`);
  });
})();
