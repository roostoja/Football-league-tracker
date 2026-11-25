// Vercel Function: handles every request under /api/*.
import { handleApi } from '../lib/football-proxy.mjs';

export function GET(request) {
  return handleApi(request, process.env.FOOTBALL_DATA_API_KEY);
}
