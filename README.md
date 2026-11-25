# Football League Tracker

A simple static website showing recent results, top scorers and match details for:

- Premier League
- La Liga
- Serie A
- UEFA Champions League

## Features

- **Dashboard**: the latest games and top 5 scorers for every league
- **League pages**: recent games grouped by date and the top 15 scorers
- **Match pages**: the score, venue and referee, team statistics (possession, xG, shots, corners, passes, cards…), a goal and card timeline, and a **Watch recap video** button that opens a YouTube highlights search for that game
- All kick-off times are shown in Estonian time (`Europe/Tallinn`, 24-hour clock)
- Works on phones, and has a dark mode

## Running locally

Requires [Node.js](https://nodejs.org) 18 or newer. There are no dependencies and no build step.

```bash
node server.js
```

Then open http://localhost:8000. The API key is already included, so live data works straight away.

## Deploying

football-data.org blocks requests made directly from a browser (CORS), so the site needs a small `/api` proxy that adds the key. The repo includes ready-made functions for these hosts, all sharing `lib/football-proxy.mjs`:

| Host | Proxy | Config |
| --- | --- | --- |
| Cloudflare Workers (deploy command `npx wrangler deploy`) | `worker.js` | `wrangler.toml` (assets from `public/`) |
| Cloudflare Pages (no `wrangler.toml` needed) | `functions/api/[[path]].js` | set the output directory to `public` |
| Netlify | `netlify/functions/api.mjs` | `netlify.toml` (publishes `public/`) |
| Vercel | `api/[...path].mjs` | `vercel.json` (publishes `public/`) |

Connect the repository with the host's default settings; no build command is needed. Purely static hosts such as GitHub Pages can't run the proxy, so the site can't load data there.

**API key:** the default key is stored in `lib/football-proxy.mjs` (and `.env` for the local server). To change it, edit those files or set the `FOOTBALL_DATA_API_KEY` environment variable on the host. You can also paste a key into the site's **Settings** dialog; it's then stored in that browser only.

## Data source

All data comes from [football-data.org](https://www.football-data.org) through the `/api` proxy. Opening `public/index.html` directly as a file doesn't work; use `node server.js` or a supported host.

Free-tier notes:
- All four competitions are included.
- The limit is 10 requests a minute, so responses are cached for 5 minutes.
- Detailed match statistics (possession, shots…) come only with paid plans. With a free key the match page shows the score, goals and cards.

## Structure

```
public/                    the website (the only folder that gets published)
  index.html               page shell, navigation, settings dialog
  css/styles.css           styles (light/dark)
  js/live-data.js          football-data.org client (calls /api)
  js/app.js                router and views (dashboard, league, match)
lib/football-proxy.mjs     shared /api proxy with 5-minute caching
server.js                  local Node server
worker.js, functions/, netlify/, api/  proxy entry points for Cloudflare, Netlify, Vercel
```
