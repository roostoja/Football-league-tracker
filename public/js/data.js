/*
 * Combined data source used by the app:
 *  - results and match details from ESPN (goal scorers, cards, statistics)
 *  - top scorers from football-data.org
 *  - if ESPN fails, results fall back to football-data.org (score only);
 *    those match ids are prefixed with "fd" so the match page knows where to look.
 */
(function () {
  'use strict';
  const espn = window.EspnSource;
  const fd = window.FootballDataSource;

  window.DataSource = {
    async getRecentMatches(code, limit) {
      try {
        const matches = await espn.getRecentMatches(code, limit);
        if (matches.length) return matches;
      } catch (e) {
        console.warn('ESPN unavailable, using football-data.org:', e);
      }
      const matches = await fd.getRecentMatches(code, limit);
      return matches.map((m) => ({ ...m, id: 'fd' + m.id }));
    },
    async getUpcomingMatches(code, days = 7) {
      try {
        return await espn.getUpcomingMatches(code, days);
      } catch (e) {
        console.warn('ESPN unavailable, using football-data.org:', e);
      }
      return fd.getUpcomingMatches(code, days);
    },
    getScorers(code, limit) {
      return fd.getScorers(code, limit);
    },
    getMatch(code, id) {
      return id.startsWith('fd') ? fd.getMatch(code, id.slice(2)) : espn.getMatch(code, id);
    }
  };
})();
