#!/usr/bin/env node
/*
 * Tiny dev/production server (no dependencies, Node 18+).
 *  - serves the static site
 *  - proxies /api/* to https://api.football-data.org/* and adds your API key
 *
 * Why a proxy: football-data.org only allows browser (CORS) requests from
 * http://localhost, so calling it directly from a page fails almost everywhere.
 * The proxy also keeps the key on the server instead of in the browser.
 *
 * Key lookup order: request header X-Auth-Token (from the site's Settings),
 * env var FOOTBALL_DATA_API_KEY, then FOOTBALL_DATA_API_KEY=... in a local .env file.
 *
 *   node server.js            # http://localhost:8000
 *   PORT=3000 node server.js
 */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8000;
const UPSTREAM = 'api.football-data.org';

function loadKey() {
  if (process.env.FOOTBALL_DATA_API_KEY) return process.env.FOOTBALL_DATA_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    const m = env.match(/^\s*FOOTBALL_DATA_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
    if (m) return m[1].trim();
  } catch (e) { /* no .env */ }
  return '';
}
const SERVER_KEY = loadKey();

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8'
};

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

// In-memory cache shared by all visitors: the free plan allows only 10 requests/minute.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // apiPath -> { t, status, type, body }

function sendCached(res, hit, state) {
  res.writeHead(hit.status, { 'Content-Type': hit.type, 'Cache-Control': 'no-store', 'X-Cache': state });
  res.end(hit.body);
}

function proxy(req, res, apiPath) {
  const userKey = req.headers['x-auth-token'];
  const key = userKey || SERVER_KEY;
  if (!key) return sendJson(res, 403, { message: 'No API key configured. Add one in Settings or set FOOTBALL_DATA_API_KEY.' });
  const cacheKey = (userKey ? 'u:' + userKey + ':' : '') + apiPath;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return sendCached(res, hit, 'HIT');

  const up = https.request({
    host: UPSTREAM, path: apiPath, method: 'GET',
    headers: { 'X-Auth-Token': key, Accept: 'application/json' }
  }, (upRes) => {
    const chunks = [];
    upRes.on('data', (c) => chunks.push(c));
    upRes.on('end', () => {
      const entry = { t: Date.now(), status: upRes.statusCode, type: upRes.headers['content-type'] || 'application/json', body: Buffer.concat(chunks) };
      if (entry.status === 200) {
        cache.set(cacheKey, entry);
        if (cache.size > 500) cache.delete(cache.keys().next().value);
        return sendCached(res, entry, 'MISS');
      }
      // Rate-limited or failing upstream: fall back to a stale copy if there is one.
      if (hit) return sendCached(res, hit, 'STALE');
      sendCached(res, entry, 'MISS');
    });
  });
  up.on('error', (e) => {
    if (hit) return sendCached(res, hit, 'STALE');
    sendJson(res, 502, { message: 'Could not reach football-data.org: ' + e.message });
  });
  up.setTimeout(15000, () => up.destroy(new Error('timeout')));
  up.end();
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const base = path.basename(file);
  if (!file.startsWith(ROOT + path.sep) || base.startsWith('.') || base === 'server.js') {
    res.writeHead(404); return res.end('Not found');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (url.pathname === '/api/status') return sendJson(res, 200, { proxy: true, serverKey: !!SERVER_KEY });
  if (url.pathname.startsWith('/api/v4/')) return proxy(req, res, url.pathname.slice(4) + url.search);
  serveStatic(req, res, url.pathname);
}).listen(PORT, () => {
  console.log(`Football Tracker running at http://localhost:${PORT}`);
  console.log(SERVER_KEY ? 'Using API key from environment/.env' : 'No server API key set — add one in the site Settings or set FOOTBALL_DATA_API_KEY.');
});
