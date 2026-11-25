// Cloudflare Worker (used by `wrangler deploy` / Cloudflare Workers Builds).
// Static files in public/ are served by Cloudflare's asset handling; requests
// under /api/* reach this Worker and go to the shared football-data.org proxy.
import { handleApi } from './lib/football-proxy.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    // Edge cache so repeated visits don't use up the API's rate limit (10 requests/minute).
    const cache = caches.default;
    const cacheable = request.method === 'GET';
    if (cacheable) {
      const hit = await cache.match(request);
      if (hit) return hit;
    }
    const res = await handleApi(request, env.FOOTBALL_DATA_API_KEY);
    if (cacheable && res.status === 200) ctx.waitUntil(cache.put(request, res.clone()));
    return res;
  }
};
