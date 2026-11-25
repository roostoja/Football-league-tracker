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

## Running

Requires [Node.js](https://nodejs.org) 18 or newer. There are no dependencies and no build step.

1. Get a free API key from [football-data.org](https://www.football-data.org/client/register).
2. Create a file called `.env` in the project folder. It's git-ignored, so the key never gets committed:

   ```
   FOOTBALL_DATA_API_KEY=your-key-here
   ```

3. Start the server and open http://localhost:8000:

   ```bash
   node server.js
   ```

The server serves the site and forwards `/api/*` requests to football-data.org, adding your key. It's needed because football-data.org blocks requests made directly from a browser (CORS), so a plain static page can't call the API.

You can also skip `.env` and paste the key into the site's **Settings** dialog. It's then stored in your browser only.

## Data sources

- **Live data** (football-data.org): used automatically when the server has a key.
- **Demo data**: generated, fictional results. Used when there's no key, or when you open `index.html` directly without the server. You can also switch to it in **Settings**.

Free-tier notes:
- All four competitions are included.
- The limit is 10 requests a minute, so responses are cached for 5 minutes.
- Detailed match statistics (possession, shots…) come only with paid plans. With a free key the match page shows the score, goals and cards.

## Structure

```
index.html          page shell, navigation, settings dialog
css/styles.css      styles (light/dark)
js/demo-data.js     deterministic demo data generator
js/live-data.js     football-data.org v4 client
js/app.js           router and views (dashboard, league, match)
server.js           static server + football-data.org proxy
```
