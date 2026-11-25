/*
 * ESPN data source (unofficial public API at site.api.espn.com, no key needed).
 * Provides results plus per-match details: goal scorers and assists, cards,
 * substitutions, team statistics, venue and attendance.
 * Requests go through the site's /api proxy (shared cache, not affected by ad blockers).
 * It is undocumented and may change without notice; data.js falls back to football-data.org.
 */
(function () {
  'use strict';

  const BASE = 'api/espn'; // proxied to site.api.espn.com by lib/football-proxy.mjs
  const SLUGS = { PL: 'eng.1', PD: 'esp.1', SA: 'ita.1', CL: 'uefa.champions' };
  const TTL_MS = 5 * 60 * 1000;
  const COUNTRY = 'EE'; // viewer's country: ESPN videos are often region-locked

  async function get(url) {
    const cacheKey = 'espn:' + url;
    try {
      const hit = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (hit && Date.now() - hit.t < TTL_MS) return hit.d;
    } catch (e) { /* storage unavailable */ }
    const res = await fetch(url);
    if (!res.ok) throw new Error('ESPN API error ' + res.status);
    const data = await res.json();
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: data })); } catch (e) { /* quota */ }
    return data;
  }

  function slug(code) {
    const s = SLUGS[code];
    if (!s) throw new Error('Unknown league ' + code);
    return s;
  }

  const num = (v) => (v == null || v === '' ? null : Number(v));

  function team(c) {
    const t = c.team || {};
    return {
      id: t.id,
      name: t.shortDisplayName || t.displayName,
      fullName: t.displayName,
      tla: t.abbreviation,
      crest: t.logo || (t.logos && t.logos[0] && t.logos[0].href) || null
    };
  }

  function sides(competitors) {
    const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];
    return { home, away };
  }

  // "90'+2'" -> { minute: 90, extra: 2 }
  function parseClock(display) {
    const m = /^(\d+)'?(?:\+(\d+))?/.exec(display || '');
    return m ? { minute: Number(m[1]), extra: m[2] ? Number(m[2]) : 0 } : { minute: 0, extra: 0 };
  }

  const ymd = (d) => d.toISOString().slice(0, 7).replace('-', '');

  function mapScoreboardEvent(e, code) {
    const c = e.competitions[0];
    const { home, away } = sides(c.competitors);
    const st = (c.status && c.status.type) || {};
    return {
      id: String(e.id),
      league: code,
      utcDate: e.date,
      status: st.state === 'post' ? 'FINISHED' : st.state === 'in' ? 'LIVE' : 'SCHEDULED',
      venue: c.venue && c.venue.fullName ? c.venue.fullName : null,
      home: team(home),
      away: team(away),
      score: { home: num(home.score), away: num(away.score) }
    };
  }

  // Map ESPN boxscore stat names to display rows.
  const STAT_ROWS = [
    ['possessionPct', 'Possession', '%'],
    ['totalShots', 'Total shots'],
    ['shotsOnTarget', 'Shots on target'],
    ['wonCorners', 'Corners'],
    ['totalPasses', 'Passes'],
    ['passAccuracy', 'Pass accuracy', '%'],
    ['saves', 'Goalkeeper saves'],
    ['totalTackles', 'Tackles'],
    ['interceptions', 'Interceptions'],
    ['foulsCommitted', 'Fouls'],
    ['offsides', 'Offsides'],
    ['yellowCards', 'Yellow cards'],
    ['redCards', 'Red cards']
  ];

  function teamStats(boxTeam) {
    const out = {};
    (boxTeam && boxTeam.statistics || []).forEach((s) => { out[s.name] = s.displayValue; });
    const passes = Number(out.totalPasses), accurate = Number(out.accuratePasses);
    if (passes > 0 && !Number.isNaN(accurate)) out.passAccuracy = Math.round((accurate / passes) * 100);
    if (out.possessionPct != null) out.possessionPct = Math.round(Number(out.possessionPct));
    return out;
  }

  function pickRecap(videos) {
    const playable = (videos || []).filter((v) => {
      const g = v.geoRestrictions;
      if (!g || !g.countries || !g.countries.length) return true;
      const listed = g.countries.includes(COUNTRY);
      return g.type === 'whitelist' ? listed : !listed;
    });
    // Only real highlight packages count; ESPN marks them in the thumbnail/media name.
    const isHighlight = (x) => /highlight/i.test([x.headline, x.description, x.thumbnail].join(' '));
    const v = playable.find(isHighlight);
    const href = v && v.links && v.links.web && v.links.web.href;
    return href ? { url: href, title: v.headline } : null;
  }

  window.EspnSource = {
    name: 'espn',
    async getRecentMatches(code, limit = 10) {
      // The scoreboard accepts a whole month (YYYYMM); look back up to 3 months.
      const now = new Date();
      const months = [0, 1, 2].map((i) => ymd(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
      let matches = [];
      for (let i = 0; i < months.length; i += 2) {
        const batch = await Promise.all(months.slice(i, i + 2).map((m) => get(`${BASE}/${slug(code)}/scoreboard?dates=${m}`)));
        batch.forEach((d) => (d.events || []).forEach((e) => {
          const st = e.competitions && e.competitions[0] && e.competitions[0].status && e.competitions[0].status.type;
          if (st && st.completed && st.state === 'post') matches.push(mapScoreboardEvent(e, code));
        }));
        if (matches.length >= limit) break;
      }
      const seen = new Set();
      matches = matches.filter((m) => !seen.has(m.id) && seen.add(m.id));
      return matches.sort((a, b) => b.utcDate.localeCompare(a.utcDate)).slice(0, limit);
    },

    // Matches from now until `days` ahead (includes games currently being played).
    async getUpcomingMatches(code, days = 7) {
      const now = new Date();
      const end = new Date(now.getTime() + days * 86400000);
      const months = [...new Set([ymd(now), ymd(end)])];
      const data = await Promise.all(months.map((m) => get(`${BASE}/${slug(code)}/scoreboard?dates=${m}`)));
      const seen = new Set();
      const out = [];
      data.forEach((d) => (d.events || []).forEach((e) => {
        const st = e.competitions && e.competitions[0] && e.competitions[0].status && e.competitions[0].status.type;
        const t = new Date(e.date);
        if (!st || seen.has(e.id)) return;
        const live = st.state === 'in';
        if (live || (st.state === 'pre' && t >= now && t <= end)) {
          seen.add(e.id);
          out.push(mapScoreboardEvent(e, code));
        }
      }));
      return out.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    },

    async getMatch(code, id) {
      const d = await get(`${BASE}/${slug(code)}/summary?event=${encodeURIComponent(id)}`);
      const comp = d.header && d.header.competitions && d.header.competitions[0];
      if (!comp) throw new Error('Match not found');
      const { home, away } = sides(comp.competitors);
      const homeId = home.team.id;
      const sideOf = (t) => (t && String(t.id) === String(homeId) ? 'home' : 'away');
      const ht = (c) => (c.linescores && c.linescores[0] ? num(c.linescores[0].displayValue) : null);

      const goals = [], cards = [], subs = [], misses = [];
      let h = 0, a = 0;
      (d.keyEvents || []).forEach((k) => {
        const type = (k.type && k.type.text) || '';
        const { minute, extra } = parseClock(k.clock && k.clock.displayValue);
        const period = k.period && k.period.number;
        const people = (k.participants || []).map((p) => p.athlete && p.athlete.displayName);
        const side = sideOf(k.team);
        if (k.scoringPlay && !k.shootout) {
          // ESPN credits own goals to the team that benefits, like all goals.
          if (side === 'home') h++; else a++;
          const kind = /own goal/i.test(type) ? 'OWN' : /penalty/i.test(type) ? 'PENALTY' : 'REGULAR';
          goals.push({
            minute, extra, period, side, type: kind, header: /header/i.test(type),
            scorer: people[0], assist: kind === 'REGULAR' ? people[1] || null : null, score: [h, a]
          });
        } else if (/card/i.test(type)) {
          cards.push({ minute, extra, period, side, player: people[0], card: /red/i.test(type) ? 'RED' : 'YELLOW' });
        } else if (/substitution/i.test(type)) {
          subs.push({ minute, extra, period, side, playerIn: people[0], playerOut: people[1] });
        } else if (/penalty - missed|penalty - saved/i.test(type)) {
          misses.push({ minute, extra, period, side, player: people[0] });
        }
      });

      const box = (d.boxscore && d.boxscore.teams) || [];
      const sh = teamStats(box.find((t) => String(t.team.id) === String(homeId)));
      const sa = teamStats(box.find((t) => String(t.team.id) !== String(homeId)));
      const stats = STAT_ROWS
        .filter(([k]) => sh[k] != null && sa[k] != null)
        .map(([k, label, unit]) => ({ key: k, label, home: Number(sh[k]), away: Number(sa[k]), unit }));

      const gi = d.gameInfo || {};
      const officials = gi.officials || [];
      const official = officials.find((o) => /^referee$/i.test((o.position && (o.position.displayName || o.position.name)) || '')) || officials[0];
      return {
        id: String(id),
        league: code,
        utcDate: comp.date,
        status: 'FINISHED',
        venue: gi.venue && gi.venue.fullName ? gi.venue.fullName + (gi.venue.address && gi.venue.address.city ? ', ' + gi.venue.address.city : '') : null,
        attendance: gi.attendance || null,
        referee: official ? official.displayName || official.fullName : null,
        home: team(home),
        away: team(away),
        score: { home: num(home.score), away: num(away.score) },
        halfTime: { home: ht(home), away: ht(away) },
        goals, cards, subs, misses, stats,
        hasEvents: true,
        recap: pickRecap(d.videos)
      };
    }
  };
})();
