# Football League Tracker

A simple static website showing recent results, top scorers and match details for:

- Premier League
- La Liga
- Serie A
- UEFA Champions League

## Features

- **Dashboard**: the latest games and top 5 scorers for every league
- **Coming matches**: all fixtures for the next 7 days across the four leagues, grouped by day, with a league filter and live games marked
- **League pages**: recent games grouped by date and the top 15 scorers
- **Match pages**: the score and half-time score, goal scorers under each team, venue and attendance, team statistics (possession, shots, corners, passes, tackles, cards…), a full timeline of goals with assists, cards, substitutions and missed penalties, and a **Watch recap video** button
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

**API key:** the key is stored in `lib/football-proxy.mjs` (and `.env` for the local server). To change it, edit those files or set the `FOOTBALL_DATA_API_KEY` environment variable on the host. The key is used only on the server: it's never sent to the browser, visitors can't replace it, and the proxy forwards only the few endpoints the site uses (league matches, top scorers, single match).

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Results, goal scorers and assists, cards, substitutions, match statistics, venue | [ESPN](https://www.espn.com/soccer/) public API (`site.api.espn.com`) | Free and needs no key. It's unofficial and undocumented, so it could change without notice. |
| Top scorers | [football-data.org](https://www.football-data.org) | Free key included. |
| Backup results (if ESPN is down) | football-data.org | Score only, no goal details. |
| Recap video | ESPN highlights if they can be played in Estonia, otherwise a YouTube search | ESPN's highlight clips are mostly limited to the UK and Ireland. |

Both APIs are called through the site's `/api` proxy (`lib/football-proxy.mjs`), which caches responses for 5 minutes. Opening `public/index.html` directly as a file doesn't work; use `node server.js` or a supported host.

football-data.org free-tier notes:
- The limit is 10 requests a minute, so responses are cached for 5 minutes.

## Structure

```
public/                    the website (the only folder that gets published)
  index.html               page shell, navigation, settings dialog
  css/styles.css           styles (light/dark)
  js/espn-data.js          ESPN client: results and match details
  js/football-data.js      football-data.org client: top scorers, backup results
  js/data.js               combines the two sources
  js/app.js                router and views (dashboard, league, match)
lib/football-proxy.mjs     shared /api proxy with 5-minute caching
server.js                  local Node server
worker.js, functions/, netlify/, api/  proxy entry points for Cloudflare, Netlify, Vercel
```
