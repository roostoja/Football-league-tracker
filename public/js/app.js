(function () {
  'use strict';

  const TZ = 'Europe/Tallinn';
  const LEAGUES = [
    { code: 'PL', name: 'Premier League', country: 'England', color: '#5b2a86' },
    { code: 'PD', name: 'La Liga', country: 'Spain', color: '#e2542b' },
    { code: 'SA', name: 'Serie A', country: 'Italy', color: '#1f6fd1' },
    { code: 'CL', name: 'UEFA Champions League', country: 'Europe', color: '#14317a' }
  ];
  const app = document.getElementById('app');

  // ---------- data source selection ----------
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val);
    } catch (e) { return null; }
    return null;
  }
  const source = () => window.DataSource;

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const league = (code) => LEAGUES.find((l) => l.code === code);

  const fmtDate = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
  const fmtLongDate = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

  function crest(team, size) {
    const label = (team.tla || team.name || '?').slice(0, 3);
    let h = 0;
    for (const c of team.name || '') h = (h * 31 + c.charCodeAt(0)) % 360;
    const fallback = (hidden) => `<span class="crest crest-fallback" style="--h:${h};width:${size}px;height:${size}px"${hidden ? ' hidden' : ''}>${esc(label)}</span>`;
    if (!team.crest) return fallback(false);
    // If the crest image fails to load, swap in the initials badge.
    return `<img class="crest" src="${esc(team.crest)}" alt="" width="${size}" height="${size}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">${fallback(true)}`;
  }

  function youtubeUrl(m) {
    const d = new Date(m.utcDate);
    const q = `${m.home.fullName || m.home.name} vs ${m.away.fullName || m.away.name} highlights ${fmtLongDate.format(d).replace(/^\w+, /, '')}`;
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  }

  const minuteLabel = (e) => `${e.minute}${e.extra ? '+' + e.extra : ''}'`;

  // Scorers listed under each team on the scoreboard.
  function goalSummary(m, side) {
    const goals = (m.goals || []).filter((g) => g.side === side);
    if (!goals.length) return '';
    const byPlayer = new Map();
    goals.forEach((g) => {
      const key = (g.scorer || 'Goal') + (g.type === 'OWN' ? ' (o.g.)' : '');
      const label = minuteLabel(g) + (g.type === 'PENALTY' ? ' pen.' : '');
      byPlayer.set(key, [...(byPlayer.get(key) || []), label]);
    });
    return `<ul class="sb-scorers">${[...byPlayer].map(([p, mins]) =>
      `<li><span aria-hidden="true">⚽</span> ${esc(p)} <span class="muted">${esc(mins.join(', '))}</span></li>`).join('')}</ul>`;
  }

  function matchRow(m, hideDate) {
    const d = new Date(m.utcDate);
    const hw = m.score.home > m.score.away, aw = m.score.away > m.score.home;
    return `
      <a class="match-row${hideDate === true ? ' no-date' : ''}" href="#/match/${esc(m.league)}/${encodeURIComponent(m.id)}">
        <span class="match-when">${hideDate === true ? '' : `<span>${fmtDate.format(d)}</span>`}<span class="muted">${fmtTime.format(d)}</span></span>
        <span class="team home ${hw ? 'win' : ''}"><span class="team-name">${esc(m.home.name)}</span>${crest(m.home, 22)}</span>
        <span class="score">${m.score.home ?? '–'}<span class="sep">:</span>${m.score.away ?? '–'}</span>
        <span class="team away ${aw ? 'win' : ''}">${crest(m.away, 22)}<span class="team-name">${esc(m.away.name)}</span></span>
        <span class="chev" aria-hidden="true">›</span>
      </a>`;
  }

  function scorersTable(rows, compact) {
    if (!rows.length) return '<p class="muted empty">No scorers yet.</p>';
    return `
      <table class="scorers">
        <thead><tr><th class="num">#</th><th>Player</th>${compact ? '' : '<th>Team</th><th class="num">Apps</th>'}<th class="num" title="Assists">A</th><th class="num" title="Goals">G</th></tr></thead>
        <tbody>
          ${rows.map((r, i) => `
            <tr>
              <td class="num muted">${i + 1}</td>
              <td><div class="player">${esc(r.player)}</div>${compact ? `<div class="muted small">${esc(r.team)}</div>` : ''}</td>
              ${compact ? '' : `<td>${esc(r.team)}</td><td class="num muted">${r.played ?? '–'}</td>`}
              <td class="num muted">${r.assists ?? 0}</td>
              <td class="num goals">${r.goals}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function errorBox(err) {
    return `<div class="error"><strong>Couldn't load data.</strong> ${esc(err.message || err)}</div>`;
  }

  const loading = '<div class="loading" aria-busy="true"><span></span><span></span><span></span></div>';

  function setActiveNav(code) {
    document.querySelectorAll('.league-nav a').forEach((a) => {
      a.classList.toggle('active', a.dataset.code === (code || 'home'));
    });
  }

  // ---------- views ----------
  async function renderDashboard(token) {
    setActiveNav('home');
    document.title = 'Football Tracker';
    app.innerHTML = `
      <section class="page-head">
        <h1>Dashboard</h1>
        <p class="muted">Latest results and top scorers across the four leagues. Times shown in Estonian time (${esc(TZ)}).</p>
      </section>
      <div class="dashboard">
        ${LEAGUES.map((l) => `
          <article class="card league-card" style="--league:${l.color}" id="card-${l.code}">
            <header class="card-head">
              <a href="#/league/${l.code}" class="league-title"><span class="league-dot"></span>${esc(l.name)}</a>
              <a href="#/league/${l.code}" class="more">All games ›</a>
            </header>
            <div class="league-body">
              <div class="recent"><h3>Recent games</h3><div class="slot-matches">${loading}</div></div>
              <div class="top"><h3>Top scorers</h3><div class="slot-scorers">${loading}</div></div>
            </div>
          </article>`).join('')}
      </div>`;

    const src = source();
    // Load leagues sequentially-ish to be gentle with the live API rate limit.
    for (const l of LEAGUES) {
      const card = document.getElementById('card-' + l.code);
      const [matches, scorers] = await Promise.allSettled([src.getRecentMatches(l.code, 6), src.getScorers(l.code, 5)]);
      if (token !== routeToken || !card) return;
      card.querySelector('.slot-matches').innerHTML = matches.status === 'fulfilled'
        ? (matches.value.length ? matches.value.map(matchRow).join('') : '<p class="muted empty">No recent games.</p>')
        : errorBox(matches.reason);
      card.querySelector('.slot-scorers').innerHTML = scorers.status === 'fulfilled'
        ? scorersTable(scorers.value, true) : errorBox(scorers.reason);
    }
  }

  async function renderLeague(code, token) {
    const l = league(code);
    if (!l) return renderNotFound();
    setActiveNav(code);
    document.title = l.name + ' · Football Tracker';
    app.innerHTML = `
      <section class="page-head league-hero" style="--league:${l.color}">
        <a href="#/" class="back">‹ Dashboard</a>
        <h1><span class="league-dot"></span>${esc(l.name)}</h1>
        <p class="muted">${esc(l.country)}</p>
      </section>
      <div class="league-layout">
        <section class="card"><header class="card-head"><h2>Recent games</h2></header><div id="slot-matches">${loading}</div></section>
        <section class="card"><header class="card-head"><h2>Top scorers</h2></header><div id="slot-scorers">${loading}</div></section>
      </div>`;

    const src = source();
    const [matches, scorers] = await Promise.allSettled([src.getRecentMatches(code, 20), src.getScorers(code, 15)]);
    if (token !== routeToken) return;

    const mEl = document.getElementById('slot-matches');
    if (matches.status === 'fulfilled') {
      const groups = new Map();
      matches.value.forEach((m) => {
        const k = fmtDayKey.format(new Date(m.utcDate));
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(m);
      });
      mEl.innerHTML = matches.value.length ? [...groups.values()].map((ms) => `
        <div class="day-group">
          <h3 class="day-label">${fmtLongDate.format(new Date(ms[0].utcDate))}${ms[0].matchday ? ` <span class="muted">· Matchday ${ms[0].matchday}</span>` : ''}</h3>
          ${ms.map((m) => matchRow(m, true)).join('')}
        </div>`).join('') : '<p class="muted empty">No recent games.</p>';
    } else mEl.innerHTML = errorBox(matches.reason);

    document.getElementById('slot-scorers').innerHTML = scorers.status === 'fulfilled'
      ? scorersTable(scorers.value, false) : errorBox(scorers.reason);
  }

  function statRow(s) {
    const h = Number(s.home) || 0, a = Number(s.away) || 0;
    const total = h + a;
    const hp = total ? (h / total) * 100 : 50;
    const u = s.unit || '';
    // For fouls/cards/offsides, fewer is "better" — don't highlight a leader.
    const neutral = ['fouls', 'foulsCommitted', 'offsides', 'yellowCards', 'redCards', 'yellow_cards', 'red_cards'].includes(s.key);
    const lead = neutral || h === a ? '' : h > a ? 'home' : 'away';
    return `
      <div class="stat">
        <div class="stat-vals"><span class="${lead === 'home' ? 'lead' : ''}">${esc(s.home)}${u}</span><span class="stat-label">${esc(s.label)}</span><span class="${lead === 'away' ? 'lead' : ''}">${esc(s.away)}${u}</span></div>
        <div class="stat-bar"><span class="bar-home" style="width:${hp}%"></span><span class="bar-away" style="width:${100 - hp}%"></span></div>
      </div>`;
  }

  function timeline(m) {
    const events = [
      ...m.goals.map((g) => ({ ...g, kind: 'goal' })),
      ...m.cards.map((c) => ({ ...c, kind: 'card' })),
      ...(m.subs || []).map((x) => ({ ...x, kind: 'sub' })),
      ...(m.misses || []).map((x) => ({ ...x, kind: 'miss' }))
    ].sort((x, y) => (x.period || 0) - (y.period || 0) || x.minute - y.minute || (x.extra || 0) - (y.extra || 0));
    const secondHalf = (e) => (e.period ? e.period > 1 : e.minute > 45);
    if (m.hasEvents === false) {
      return `<p class="muted empty">Goal details couldn't be loaded for this match (the backup data source only has the score).${
        m.halfTime && m.halfTime.home != null ? ` Half-time score was ${m.halfTime.home}–${m.halfTime.away}.` : ''}</p>`;
    }
    if (!events.length) return '<p class="muted empty">No goals or cards recorded.</p>';
    let htShown = false;
    const out = [];
    events.forEach((e) => {
      if (!htShown && secondHalf(e)) {
        htShown = true;
        if (m.halfTime && m.halfTime.home != null) out.push(`<li class="tl-break">Half-time ${m.halfTime.home}–${m.halfTime.away}</li>`);
      }
      const min = minuteLabel(e);
      let icon, main, sub = '';
      if (e.kind === 'goal') {
        icon = '<span class="ev ev-goal" title="Goal">⚽</span>';
        main = esc(e.scorer || 'Goal');
        const tags = [];
        if (e.type === 'PENALTY') tags.push('pen.');
        if (e.type === 'OWN') tags.push('o.g.');
        if (e.header) tags.push('header');
        if (tags.length) main += ` <span class="muted">(${tags.join(', ')})</span>`;
        if (e.score) main += ` <span class="ev-score">${e.score[0]}–${e.score[1]}</span>`;
        if (e.assist) sub = `Assist: ${esc(e.assist)}`;
      } else if (e.kind === 'sub') {
        icon = '<span class="ev ev-sub" title="Substitution">⇄</span>';
        main = `<span class="sub-in">${esc(e.playerIn || '')}</span>`;
        if (e.playerOut) sub = `Off: ${esc(e.playerOut)}`;
      } else if (e.kind === 'miss') {
        icon = '<span class="ev ev-miss" title="Penalty missed">✕</span>';
        main = `${esc(e.player || 'Penalty')} <span class="muted">(penalty missed)</span>`;
      } else {
        icon = `<span class="ev ev-card ${e.card === 'RED' ? 'red' : 'yellow'}" title="${e.card === 'RED' ? 'Red' : 'Yellow'} card"></span>`;
        main = esc(e.player || (e.card === 'RED' ? 'Red card' : 'Yellow card'));
      }
      out.push(`
        <li class="tl-item ${e.side}${e.kind === 'sub' ? ' tl-minor' : ''}">
          <span class="tl-min">${min}</span>
          <span class="tl-body">${icon}<span><span class="tl-main">${main}</span>${sub ? `<span class="tl-sub muted">${sub}</span>` : ''}</span></span>
        </li>`);
    });
    if (!htShown && m.halfTime && m.halfTime.home != null) out.push(`<li class="tl-break">Half-time ${m.halfTime.home}–${m.halfTime.away}</li>`);
    out.push(`<li class="tl-break">Full-time ${m.score.home}–${m.score.away}</li>`);
    return `<ol class="timeline">${out.join('')}</ol>`;
  }

  async function renderMatch(code, id, token) {
    const l = league(code);
    if (!l) return renderNotFound();
    setActiveNav(code);
    app.innerHTML = loading;
    let m;
    try {
      m = await source().getMatch(code, id);
    } catch (err) {
      if (token === routeToken) app.innerHTML = `<a href="#/league/${esc(code)}" class="back">‹ ${esc(l.name)}</a>${errorBox(err)}`;
      return;
    }
    if (token !== routeToken) return;
    document.title = `${m.home.name} ${m.score.home}–${m.score.away} ${m.away.name} · Football Tracker`;
    const d = new Date(m.utcDate);
    const meta = [
      `${fmtLongDate.format(d)}, ${fmtTime.format(d)}`,
      m.matchday ? `Matchday ${m.matchday}` : null,
      m.venue,
      m.attendance ? `Attendance: ${m.attendance.toLocaleString('en-GB')}` : null,
      m.referee ? `Referee: ${m.referee}` : null
    ].filter(Boolean);

    app.innerHTML = `
      <a href="#/league/${esc(code)}" class="back">‹ ${esc(l.name)}</a>
      <section class="card scoreboard" style="--league:${l.color}">
        <div class="sb-league"><span class="league-dot"></span>${esc(l.name)}</div>
        <div class="sb-main">
          <div class="sb-team">${crest(m.home, 64)}<span>${esc(m.home.name)}</span>${goalSummary(m, 'home')}</div>
          <div class="sb-score">
            <div class="sb-goals">${m.score.home ?? '–'}<span class="sep">–</span>${m.score.away ?? '–'}</div>
            <div class="sb-status">Full-time${m.halfTime && m.halfTime.home != null ? ` · HT ${m.halfTime.home}–${m.halfTime.away}` : ''}</div>
          </div>
          <div class="sb-team">${crest(m.away, 64)}<span>${esc(m.away.name)}</span>${goalSummary(m, 'away')}</div>
        </div>
        <ul class="sb-meta">${meta.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <a class="btn recap" href="${esc(m.recap ? m.recap.url : youtubeUrl(m))}" target="_blank" rel="noopener noreferrer"${m.recap ? ` title="${esc(m.recap.title)}"` : ''}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          Watch recap video
        </a>
        ${m.recap ? `<div class="recap-alt small"><a href="${esc(youtubeUrl(m))}" target="_blank" rel="noopener noreferrer">Or find highlights on YouTube</a></div>` : ''}
      </section>
      <div class="match-layout">
        <section class="card">
          <header class="card-head"><h2>Match statistics</h2></header>
          ${m.stats.length ? `
            <div class="stats-head"><span>${esc(m.home.tla || m.home.name)}</span><span>${esc(m.away.tla || m.away.name)}</span></div>
            <div class="stats">${m.stats.map(statRow).join('')}</div>`
            : '<p class="muted empty">Detailed statistics are not available for this match.</p>'}
        </section>
        <section class="card">
          <header class="card-head"><h2>Timeline</h2></header>
          ${timeline(m)}
        </section>
      </div>`;
  }

  function renderNotFound() {
    app.innerHTML = '<div class="card empty-page"><h1>Page not found</h1><p><a href="#/">Back to dashboard</a></p></div>';
  }

  // ---------- router ----------
  let routeToken = 0;
  function route() {
    const token = ++routeToken;
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
    window.scrollTo(0, 0);
    if (!parts[0]) return renderDashboard(token);
    if (parts[0] === 'league' && parts[1]) return renderLeague(parts[1], token);
    if (parts[0] === 'match' && parts[1] && parts[2]) return renderMatch(parts[1], parts[2], token);
    return renderNotFound();
  }

  // ---------- settings ----------
  const dialog = document.getElementById('settings');
  const form = document.getElementById('settings-form');

  document.getElementById('open-settings').addEventListener('click', () => {
    form.apiKey.value = store('fdApiKey') || '';
    dialog.showModal();
  });
  form.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    const key = form.apiKey.value.trim();
    store('fdApiKey', key || null);
    try { sessionStorage.clear(); } catch (err) { /* ignore */ }
    route();
  });

  // League nav
  document.querySelector('.league-nav').innerHTML =
    `<a href="#/" data-code="home">Dashboard</a>` +
    LEAGUES.map((l) => `<a href="#/league/${l.code}" data-code="${l.code}" style="--league:${l.color}"><span class="league-dot"></span>${esc(l.name)}</a>`).join('');

  window.addEventListener('hashchange', route);
  try { localStorage.removeItem('dataSource'); } catch (e) { /* old setting, no longer used */ }
  route();
})();
