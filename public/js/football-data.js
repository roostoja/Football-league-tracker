/*
 * football-data.org API v4 client (top scorers, and fallback results), called through the proxy
 * in server.js (the API's CORS policy blocks direct browser calls).
 * Free tier covers Premier League (PL), La Liga (PD), Serie A (SA) and
 * the Champions League (CL) — get a key at https://www.football-data.org/client/register
 * Free tier limit is 10 requests/minute, so responses are cached for 5 minutes.
 * Detailed match statistics (possession, shots, …) are only returned on paid tiers;
 * the match page shows whatever the API provides.
 */
(function () {
  'use strict';

  const BASE = 'api/v4';
  const TTL_MS = 5 * 60 * 1000;

  async function api(path) {
    const cacheKey = 'fd:' + path;
    try {
      const hit = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (hit && Date.now() - hit.t < TTL_MS) return hit.d;
    } catch (e) { /* storage unavailable */ }

    let res;
    try {
      res = await fetch(BASE + path);
    } catch (e) {
      throw new Error(location.protocol === 'file:'
        ? 'Open the site through the server (node server.js, then http://localhost:8000), not as a file.'
        : 'Network error: ' + e.message);
    }
    if (res.status === 429) throw new Error('API rate limit reached (10 requests/minute on the free tier). Wait a minute and reload.');
    if (res.status === 403 || res.status === 400) throw new Error('The data provider refused the request. Please try again later.');
    if (res.status === 404 || !(res.headers.get('content-type') || '').includes('json')) {
      throw new Error(location.protocol === 'file:'
        ? 'Open the site through the server (node server.js, then http://localhost:8000), not as a file.'
        : 'The /api data proxy is not running on this host. See the README for supported hosts.');
    }
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: data })); } catch (e) { /* ignore */ }
    return data;
  }

  const ymd = (d) => d.toISOString().slice(0, 10);
  const team = (t) => ({ id: t.id, name: t.shortName || t.name, fullName: t.name, tla: t.tla, crest: t.crest || null });

  function mapMatch(m, code) {
    return {
      id: String(m.id),
      league: code || (m.competition && m.competition.code),
      matchday: m.matchday,
      stage: m.stage,
      utcDate: m.utcDate,
      status: m.status,
      venue: m.venue || null,
      referee: (m.referees && m.referees[0] && m.referees[0].name) || null,
      home: team(m.homeTeam),
      away: team(m.awayTeam),
      score: { home: m.score.fullTime.home, away: m.score.fullTime.away },
      halfTime: m.score.halfTime ? { home: m.score.halfTime.home, away: m.score.halfTime.away } : null,
      goals: [], cards: [], stats: [],
      hasEvents: true
    };
  }

  const STAT_FIELDS = [
    ['ball_possession', 'Possession', '%'],
    ['shots', 'Total shots'],
    ['shots_on_goal', 'Shots on target'],
    ['shots_off_goal', 'Shots off target'],
    ['corner_kicks', 'Corners'],
    ['saves', 'Goalkeeper saves'],
    ['fouls', 'Fouls'],
    ['offsides', 'Offsides'],
    ['free_kicks', 'Free kicks'],
    ['yellow_cards', 'Yellow cards'],
    ['red_cards', 'Red cards']
  ];

  window.FootballDataSource = {
    name: 'live',
    async getRecentMatches(code, limit = 10) {
      const now = new Date();
      const from = new Date(now.getTime() - 40 * 86400000);
      const data = await api(`/competitions/${code}/matches?status=FINISHED&dateFrom=${ymd(from)}&dateTo=${ymd(now)}`);
      return (data.matches || [])
        .map((m) => mapMatch(m, code))
        .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
        .slice(0, limit);
    },
    async getUpcomingMatches(code, days = 7) {
      const now = new Date();
      const end = new Date(now.getTime() + days * 86400000);
      const data = await api(`/competitions/${code}/matches?dateFrom=${ymd(now)}&dateTo=${ymd(end)}`);
      return (data.matches || [])
        .filter((m) => ['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED'].includes(m.status) && new Date(m.utcDate) <= end)
        .map((m) => ({ ...mapMatch(m, code), status: ['IN_PLAY', 'PAUSED'].includes(m.status) ? 'LIVE' : 'SCHEDULED' }))
        .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    },
    async getScorers(code, limit = 10) {
      // Always fetch the same list (top 15) so the dashboard and league page share one cached request.
      const data = await api(`/competitions/${code}/scorers?limit=15`);
      return (data.scorers || []).slice(0, limit).map((s) => ({
        player: s.player.name,
        team: s.team.shortName || s.team.name,
        tla: s.team.tla,
        crest: s.team.crest,
        goals: s.goals || 0,
        assists: s.assists || 0,
        penalties: s.penalties || 0,
        played: s.playedMatches
      }));
    },
    async getMatch(code, id) {
      const m = await api(`/matches/${encodeURIComponent(id)}`);
      const match = mapMatch(m, code);
      const sideOf = (t) => (t && t.id === m.homeTeam.id ? 'home' : 'away');

      // The free tier omits goals/bookings entirely (not just empty arrays).
      match.hasEvents = Array.isArray(m.goals);
      match.goals = (m.goals || []).map((g) => ({
        minute: g.minute, extra: g.injuryTime || 0, side: sideOf(g.team),
        scorer: g.scorer && g.scorer.name, assist: g.assist && g.assist.name,
        type: g.type || 'REGULAR', score: g.score ? [g.score.home, g.score.away] : null
      }));
      match.cards = (m.bookings || []).map((b) => ({
        minute: b.minute, side: sideOf(b.team), player: b.player && b.player.name,
        card: b.card === 'YELLOW' ? 'YELLOW' : 'RED'
      }));

      const hs = m.homeTeam.statistics, as = m.awayTeam.statistics;
      if (hs && as) {
        match.stats = STAT_FIELDS
          .filter(([k]) => hs[k] != null && as[k] != null)
          .map(([k, label, unit]) => ({ key: k, label, home: hs[k], away: as[k], unit }));
      }
      return match;
    }
  };
})();
