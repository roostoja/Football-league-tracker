// Cloudflare Pages Function: handles every request under /api/*.
import { handleApi } from '../../lib/football-proxy.mjs';

export async function onRequest(context) {
  const { request, env } = context;
  // Use Cloudflare's edge cache so repeated visits don't use up the API's rate limit.
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheable = request.method === 'GET';
  if (cache && cacheable) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }
  const res = await handleApi(request, env.FOOTBALL_DATA_API_KEY);
  if (cache && cacheable && res.status === 200) context.waitUntil(cache.put(request, res.clone()));
  return res;
}
