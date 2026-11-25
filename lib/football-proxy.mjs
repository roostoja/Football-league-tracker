/*
 * Shared football-data.org proxy, written against the web-standard
 * Request/Response API so the same code runs in:
 *   - server.js (local Node server)
 *   - Cloudflare Pages Functions  (functions/api/[[path]].js)
 *   - Netlify Functions           (netlify/functions/api.mjs)
 *   - Vercel Functions            (api/[...path].mjs)
 *
 * Why a proxy: football-data.org only allows browser (CORS) requests from
 * http://localhost, so the browser can't call it directly from a real website.
 *
 * Routes:
 *   GET /api/v4/...   -> forwarded to https://api.football-data.org/v4/...
 *   GET /api/espn/... -> forwarded to https://site.api.espn.com/apis/site/v2/sports/soccer/...
 *                        (ESPN's public API, no key; proxied so visitors share one cache
 *                        and ad blockers that block ESPN domains don't break the site)
 */

// Committed at the repository owner's request so deploys need no setup.
// An environment variable FOOTBALL_DATA_API_KEY overrides it.
export const DEFAULT_API_KEY = '44470162222f4db3a206cdd6b3b8328d';

const UPSTREAM = 'https://api.football-data.org';
const ESPN_UPSTREAM = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
// Only the endpoints the site uses are forwarded, so the key can't be used for anything else.
const FD_PATH = /^\/api\/v4\/(competitions\/(PL|PD|SA|CL)\/(matches|scorers)|matches\/\d+)$/;
// Only these ESPN endpoints are forwarded: {league}/scoreboard and {league}/summary.
const ESPN_PATH = /^\/api\/espn\/(eng\.1|esp\.1|ita\.1|uefa\.champions)\/(scoreboard|summary)$/;
const CACHE_TTL_MS = 5 * 60 * 1000; // free plan: 10 requests/minute
const memCache = new Map(); // survives between requests on a warm instance

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function cachedResponse(entry, state) {
  return new Response(entry.body, {
    status: entry.status,
    headers: {
      'Content-Type': entry.type,
      // Lets CDNs (Netlify, Vercel, Cloudflare) cache successful responses too.
      'Cache-Control': entry.status === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store',
      'X-Cache': state
    }
  });
}

/**
 * @param {Request} request
 * @param {string} [envKey] API key from the platform's environment, if any.
 *   The key never reaches the browser, and visitors can't supply their own.
 * @returns {Promise<Response>}
 */
export async function handleApi(request, envKey) {
  const url = new URL(request.url);
  const serverKey = (envKey || DEFAULT_API_KEY || '').trim();

  if (request.method !== 'GET' && request.method !== 'HEAD') return json(405, { message: 'Method not allowed' });
  if (url.pathname.startsWith('/api/espn/')) {
    const m = ESPN_PATH.exec(url.pathname);
    if (!m) return json(404, { message: 'Not found' });
    return fetchCached('espn:' + url.pathname + url.search, `${ESPN_UPSTREAM}/${m[1]}/${m[2]}${url.search}`, {});
  }
  if (!FD_PATH.test(url.pathname)) return json(404, { message: 'Not found' });
  if (!serverKey) return json(500, { message: 'No API key configured on the server (FOOTBALL_DATA_API_KEY).' });

  const apiPath = url.pathname.slice(4) + url.search; // strip "/api"
  return fetchCached(apiPath, UPSTREAM + apiPath, { 'X-Auth-Token': serverKey });
}

async function fetchCached(cacheKey, upstreamUrl, headers) {
  const hit = memCache.get(cacheKey);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return cachedResponse(hit, 'HIT');

  let upRes;
  try {
    upRes = await fetch(upstreamUrl, { headers: { ...headers, Accept: 'application/json' } });
  } catch (e) {
    if (hit) return cachedResponse(hit, 'STALE');
    return json(502, { message: 'Could not reach ' + new URL(upstreamUrl).host + ': ' + e.message });
  }
  const entry = {
    t: Date.now(),
    status: upRes.status,
    type: upRes.headers.get('content-type') || 'application/json',
    body: await upRes.arrayBuffer()
  };
  if (entry.status === 200) {
    memCache.set(cacheKey, entry);
    if (memCache.size > 500) memCache.delete(memCache.keys().next().value);
    return cachedResponse(entry, 'MISS');
  }
  // Rate-limited or failing upstream: serve a stale copy if there is one.
  if (hit) return cachedResponse(hit, 'STALE');
  return cachedResponse(entry, 'MISS');
}
