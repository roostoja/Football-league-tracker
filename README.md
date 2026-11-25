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

There's no build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Data sources

By default the site shows **generated demo data**. The results are fictional but stay consistent, so it works offline straight away.

For real data, get a free API key from [football-data.org](https://www.football-data.org/client/register), then open **Settings** on the site, choose *Live data* and paste the key. The key is stored only in your browser's `localStorage`.

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
```
