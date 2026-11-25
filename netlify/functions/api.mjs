// Netlify Function: handles every request under /api/*.
import { handleApi } from '../../lib/football-proxy.mjs';

export default async (request) => handleApi(request, process.env.FOOTBALL_DATA_API_KEY);

export const config = { path: '/api/*' };
