/*
 * Demo data source.
 * Generates a deterministic, fictional set of results so the site works
 * without an API key. Fixtures are anchored to the current date so the
 * "recent games" always look recent. Results and statistics are NOT real.
 */
(function () {
  'use strict';

  const LEAGUES = [
    {
      code: 'PL', name: 'Premier League', country: 'England', color: '#5b2a86',
      teams: [
        ['Arsenal', 'ARS', 88, ['Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli', 'Martin Ødegaard']],
        ['Manchester City', 'MCI', 87, ['Erling Haaland', 'Phil Foden', 'Omar Marmoush', 'Bernardo Silva']],
        ['Liverpool', 'LIV', 88, ['Mohamed Salah', 'Cody Gakpo', 'Hugo Ekitiké', 'Dominik Szoboszlai']],
        ['Chelsea', 'CHE', 82, ['Cole Palmer', 'João Pedro', 'Pedro Neto', 'Enzo Fernández']],
        ['Tottenham Hotspur', 'TOT', 76, ['Dominic Solanke', 'Mohammed Kudus', 'Richarlison', 'James Maddison']],
        ['Newcastle United', 'NEW', 79, ['Anthony Gordon', 'Nick Woltemade', 'Harvey Barnes', 'Bruno Guimarães']],
        ['Aston Villa', 'AVL', 77, ['Ollie Watkins', 'Morgan Rogers', 'Donyell Malen', 'John McGinn']],
        ['Manchester United', 'MUN', 75, ['Bryan Mbeumo', 'Matheus Cunha', 'Benjamin Šeško', 'Bruno Fernandes']],
        ['Brighton & Hove Albion', 'BHA', 72, ['Danny Welbeck', 'Kaoru Mitoma', 'Georginio Rutter', 'Yankuba Minteh']],
        ['Crystal Palace', 'CRY', 71, ['Jean-Philippe Mateta', 'Ismaïla Sarr', 'Eddie Nketiah', 'Adam Wharton']]
      ]
    },
    {
      code: 'PD', name: 'La Liga', country: 'Spain', color: '#e2542b',
      teams: [
        ['Real Madrid', 'RMA', 89, ['Kylian Mbappé', 'Vinícius Júnior', 'Jude Bellingham', 'Rodrygo']],
        ['FC Barcelona', 'FCB', 89, ['Robert Lewandowski', 'Lamine Yamal', 'Raphinha', 'Ferran Torres']],
        ['Atlético Madrid', 'ATM', 83, ['Julián Álvarez', 'Alexander Sørloth', 'Antoine Griezmann', 'Giuliano Simeone']],
        ['Athletic Club', 'ATH', 76, ['Nico Williams', 'Gorka Guruzeta', 'Oihan Sancet', 'Iñaki Williams']],
        ['Villarreal', 'VIL', 77, ['Gerard Moreno', 'Georges Mikautadze', 'Ayoze Pérez', 'Tajon Buchanan']],
        ['Real Betis', 'BET', 74, ['Cucho Hernández', 'Antony', 'Isco', 'Abde Ezzalzouli']],
        ['Real Sociedad', 'RSO', 72, ['Mikel Oyarzabal', 'Takefusa Kubo', 'Brais Méndez', 'Orri Óskarsson']],
        ['Sevilla', 'SEV', 70, ['Isaac Romero', 'Akor Adams', 'Rubén Vargas', 'Djibril Sow']],
        ['Valencia', 'VAL', 68, ['Hugo Duro', 'Diego López', 'Arnaut Danjuma', 'Javi Guerra']],
        ['Celta Vigo', 'CEL', 69, ['Borja Iglesias', 'Iago Aspas', 'Williot Swedberg', 'Hugo Álvarez']]
      ]
    },
    {
      code: 'SA', name: 'Serie A', country: 'Italy', color: '#1f6fd1',
      teams: [
        ['Inter', 'INT', 86, ['Lautaro Martínez', 'Marcus Thuram', 'Ange-Yoan Bonny', 'Hakan Çalhanoğlu']],
        ['Napoli', 'NAP', 84, ['Rasmus Højlund', 'Scott McTominay', 'Kevin De Bruyne', 'Matteo Politano']],
        ['AC Milan', 'MIL', 82, ['Christian Pulisic', 'Rafael Leão', 'Santiago Giménez', 'Luka Modrić']],
        ['Juventus', 'JUV', 81, ['Dušan Vlahović', 'Jonathan David', 'Kenan Yıldız', 'Francisco Conceição']],
        ['Atalanta', 'ATA', 79, ['Gianluca Scamacca', 'Ademola Lookman', 'Charles De Ketelaere', 'Nikola Krstović']],
        ['AS Roma', 'ROM', 78, ['Artem Dovbyk', 'Paulo Dybala', 'Matías Soulé', 'Evan Ferguson']],
        ['Lazio', 'LAZ', 74, ['Taty Castellanos', 'Mattia Zaccagni', 'Gustav Isaksen', 'Pedro']],
        ['Fiorentina', 'FIO', 72, ['Moise Kean', 'Edin Džeko', 'Albert Guðmundsson', 'Rolando Mandragora']],
        ['Bologna', 'BOL', 75, ['Riccardo Orsolini', 'Santiago Castro', 'Thijs Dallinga', 'Jens Odgaard']],
        ['Como', 'COM', 73, ['Nico Paz', 'Álvaro Morata', 'Jesús Rodríguez', 'Anastasios Douvikas']]
      ]
    },
    {
      code: 'CL', name: 'UEFA Champions League', country: 'Europe', color: '#14317a',
      teams: [
        ['Real Madrid', 'RMA', 89, ['Kylian Mbappé', 'Vinícius Júnior', 'Jude Bellingham', 'Rodrygo']],
        ['Bayern München', 'FCB', 88, ['Harry Kane', 'Michael Olise', 'Luis Díaz', 'Serge Gnabry']],
        ['Paris Saint-Germain', 'PSG', 88, ['Ousmane Dembélé', 'Khvicha Kvaratskhelia', 'Désiré Doué', 'Gonçalo Ramos']],
        ['Arsenal', 'ARS', 88, ['Bukayo Saka', 'Kai Havertz', 'Gabriel Martinelli', 'Martin Ødegaard']],
        ['Liverpool', 'LIV', 87, ['Mohamed Salah', 'Cody Gakpo', 'Hugo Ekitiké', 'Dominik Szoboszlai']],
        ['FC Barcelona', 'BAR', 88, ['Robert Lewandowski', 'Lamine Yamal', 'Raphinha', 'Ferran Torres']],
        ['Inter', 'INT', 85, ['Lautaro Martínez', 'Marcus Thuram', 'Ange-Yoan Bonny', 'Hakan Çalhanoğlu']],
        ['Manchester City', 'MCI', 86, ['Erling Haaland', 'Phil Foden', 'Omar Marmoush', 'Bernardo Silva']],
        ['Borussia Dortmund', 'BVB', 78, ['Serhou Guirassy', 'Karim Adeyemi', 'Maximilian Beier', 'Julian Brandt']],
        ['Benfica', 'BEN', 76, ['Vangelis Pavlidis', 'Andreas Schjelderup', 'Fredrik Aursnes', 'Heorhiy Sudakov']]
      ]
    }
  ];

  const VENUES = {
    'Arsenal': 'Emirates Stadium', 'Manchester City': 'Etihad Stadium', 'Liverpool': 'Anfield',
    'Chelsea': 'Stamford Bridge', 'Tottenham Hotspur': 'Tottenham Hotspur Stadium',
    'Newcastle United': "St James' Park", 'Aston Villa': 'Villa Park', 'Manchester United': 'Old Trafford',
    'Brighton & Hove Albion': 'American Express Stadium', 'Crystal Palace': 'Selhurst Park',
    'Real Madrid': 'Santiago Bernabéu', 'FC Barcelona': 'Spotify Camp Nou', 'Atlético Madrid': 'Riyadh Air Metropolitano',
    'Athletic Club': 'San Mamés', 'Villarreal': 'Estadio de la Cerámica', 'Real Betis': 'Benito Villamarín',
    'Real Sociedad': 'Reale Arena', 'Sevilla': 'Ramón Sánchez-Pizjuán', 'Valencia': 'Mestalla', 'Celta Vigo': 'Balaídos',
    'Inter': 'San Siro', 'Napoli': 'Stadio Diego Armando Maradona', 'AC Milan': 'San Siro', 'Juventus': 'Allianz Stadium',
    'Atalanta': 'Gewiss Stadium', 'AS Roma': 'Stadio Olimpico', 'Lazio': 'Stadio Olimpico', 'Fiorentina': 'Stadio Artemio Franchi',
    'Bologna': "Stadio Renato Dall'Ara", 'Como': 'Stadio Giuseppe Sinigaglia',
    'Bayern München': 'Allianz Arena', 'Paris Saint-Germain': 'Parc des Princes',
    'Borussia Dortmund': 'Signal Iduna Park', 'Benfica': 'Estádio da Luz'
  };

  const REFEREES = ['M. Oliver', 'A. Taylor', 'J. Gil Manzano', 'D. Orsato', 'S. Vinčić', 'C. Turpin',
    'F. Zwayer', 'I. Kovács', 'D. Massa', 'J. M. Sánchez Martínez', 'S. Marciniak', 'A. Kavanagh'];

  // ---------- seeded RNG ----------
  function hashString(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function poisson(rand, lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }
  function pickWeighted(rand, items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- fixtures ----------
  // Circle-method round robin: returns rounds of [homeIdx, awayIdx].
  function roundRobin(n) {
    const idx = [...Array(n).keys()];
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const a = idx[i], b = idx[n - 1 - i];
        pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
      rounds.push(pairs);
      idx.splice(1, 0, idx.pop());
    }
    return rounds;
  }

  // Most recent given weekday (0=Sun) strictly before "now" (UTC day granularity).
  function lastWeekday(now, weekday) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    do { d.setUTCDate(d.getUTCDate() - 1); } while (d.getUTCDay() !== weekday);
    return d;
  }

  const SCORER_WEIGHTS = [0.42, 0.26, 0.2, 0.12];

  function simulateMatch(rand, league, home, away, id, matchday, utcDate) {
    const diff = (home[2] - away[2]) / 10;
    const lamH = clamp(1.45 + diff * 0.45, 0.35, 3.4);
    const lamA = clamp(1.15 - diff * 0.45, 0.3, 3.0);
    const gH = poisson(rand, lamH);
    const gA = poisson(rand, lamA);

    const goals = [];
    const addGoals = (count, side, team, opp) => {
      for (let i = 0; i < count; i++) {
        const minute = 1 + Math.floor(rand() * 93);
        let type = 'REGULAR', scorer, assist = null;
        const roll = rand();
        if (roll < 0.04) {
          type = 'OWN';
          scorer = opp[3][Math.floor(rand() * opp[3].length)];
        } else {
          scorer = pickWeighted(rand, team[3], SCORER_WEIGHTS);
          if (roll < 0.13) type = 'PENALTY';
          else if (rand() < 0.72) {
            const mates = team[3].filter((p) => p !== scorer);
            assist = mates[Math.floor(rand() * mates.length)];
          }
        }
        goals.push({ minute: Math.min(minute, 90), extra: minute > 90 ? minute - 90 : 0, side, scorer, assist, type });
      }
    };
    addGoals(gH, 'home', home, away);
    addGoals(gA, 'away', away, home);
    goals.sort((a, b) => a.minute - b.minute || a.extra - b.extra);

    // running score + half-time score
    let h = 0, a = 0, htH = 0, htA = 0;
    goals.forEach((g) => {
      if (g.side === 'home') h++; else a++;
      g.score = [h, a];
      if (g.minute <= 45) { htH = h; htA = a; }
    });

    const cards = [];
    const addCards = (side, team) => {
      const n = poisson(rand, 1.9);
      for (let i = 0; i < n; i++) {
        cards.push({ minute: 5 + Math.floor(rand() * 86), side, player: team[3][Math.floor(rand() * 4)], card: 'YELLOW' });
      }
      if (rand() < 0.05) {
        cards.push({ minute: 30 + Math.floor(rand() * 60), side, player: team[3][Math.floor(rand() * 4)], card: 'RED' });
      }
    };
    addCards('home', home);
    addCards('away', away);
    cards.sort((x, y) => x.minute - y.minute);

    const possH = Math.round(clamp(50 + diff * 4 + 3 + (rand() - 0.5) * 14, 28, 74));
    const mkSide = (goalsFor, poss, strengthBonus) => {
      const shots = goalsFor * 2 + poisson(rand, 8 + strengthBonus);
      const onTarget = clamp(goalsFor + poisson(rand, 2.2), goalsFor, shots);
      const passes = Math.round(poss * 9.5 + (rand() - 0.5) * 60);
      return {
        shots, shotsOnTarget: onTarget,
        xg: +(onTarget * 0.22 + (shots - onTarget) * 0.05 + rand() * 0.4).toFixed(2),
        corners: poisson(rand, 4.5 + strengthBonus / 3),
        fouls: poisson(rand, 11),
        offsides: poisson(rand, 1.8),
        passes,
        passAccuracy: Math.round(clamp(70 + poss / 4 + (rand() - 0.5) * 8, 68, 93)),
        saves: 0
      };
    };
    const sH = mkSide(gH, possH, diff > 0 ? diff * 2 : 0);
    const sA = mkSide(gA, 100 - possH, diff < 0 ? -diff * 2 : 0);
    sH.saves = Math.max(0, sA.shotsOnTarget - gA);
    sA.saves = Math.max(0, sH.shotsOnTarget - gH);

    const countCards = (side, c) => cards.filter((x) => x.side === side && x.card === c).length;
    const stats = [
      { key: 'possession', label: 'Possession', home: possH, away: 100 - possH, unit: '%' },
      { key: 'xg', label: 'Expected goals (xG)', home: sH.xg, away: sA.xg },
      { key: 'shots', label: 'Total shots', home: sH.shots, away: sA.shots },
      { key: 'shotsOnTarget', label: 'Shots on target', home: sH.shotsOnTarget, away: sA.shotsOnTarget },
      { key: 'corners', label: 'Corners', home: sH.corners, away: sA.corners },
      { key: 'passes', label: 'Passes', home: sH.passes, away: sA.passes },
      { key: 'passAccuracy', label: 'Pass accuracy', home: sH.passAccuracy, away: sA.passAccuracy, unit: '%' },
      { key: 'saves', label: 'Goalkeeper saves', home: sH.saves, away: sA.saves },
      { key: 'fouls', label: 'Fouls', home: sH.fouls, away: sA.fouls },
      { key: 'offsides', label: 'Offsides', home: sH.offsides, away: sA.offsides },
      { key: 'yellow', label: 'Yellow cards', home: countCards('home', 'YELLOW'), away: countCards('away', 'YELLOW') },
      { key: 'red', label: 'Red cards', home: countCards('home', 'RED'), away: countCards('away', 'RED') }
    ];

    return {
      id,
      league: league.code,
      matchday,
      utcDate: utcDate.toISOString(),
      status: 'FINISHED',
      venue: VENUES[home[0]] || null,
      referee: REFEREES[Math.floor(rand() * REFEREES.length)],
      home: { name: home[0], tla: home[1], crest: null },
      away: { name: away[0], tla: away[1], crest: null },
      score: { home: gH, away: gA },
      halfTime: { home: htH, away: htA },
      goals, cards, stats
    };
  }

  function buildLeague(league, now) {
    const rand = mulberry32(hashString(league.code + now.toISOString().slice(0, 7)));
    const isCL = league.code === 'CL';
    let rounds = roundRobin(league.teams.length);
    if (isCL) rounds = rounds.slice(0, 5); // league-phase matchdays played so far

    // Anchor the last round to the most recent matchday before today.
    const last = isCL ? lastWeekday(now, 2 /* Tue */) : lastWeekday(now, 6 /* Sat */);
    const gapDays = isCL ? 14 : 7;
    const kickoffs = isCL ? [[17, 45], [20, 0]] : [[12, 30], [15, 0], [17, 30], [20, 0]];

    const matches = [];
    rounds.forEach((pairs, r) => {
      const base = new Date(last);
      base.setUTCDate(base.getUTCDate() - (rounds.length - 1 - r) * gapDays);
      pairs.forEach(([hi, ai], i) => {
        const d = new Date(base);
        if (isCL) {
          if (i >= Math.ceil(pairs.length / 2)) d.setUTCDate(d.getUTCDate() + 1); // Wednesday
          if (d > now) d.setUTCDate(d.getUTCDate() - 1);
        } else if (i === pairs.length - 1) {
          d.setUTCDate(d.getUTCDate() + 1); // Sunday game
          if (d > now) d.setUTCDate(d.getUTCDate() - 1);
        }
        const [hh, mm] = kickoffs[i % kickoffs.length];
        d.setUTCHours(hh, mm, 0, 0);
        const id = `${league.code}-${r + 1}-${i + 1}`;
        matches.push(simulateMatch(rand, league, league.teams[hi], league.teams[ai], id, r + 1, d));
      });
    });

    // Top scorers aggregated from the generated season.
    const table = new Map();
    const played = new Map();
    matches.forEach((m) => {
      [m.home.name, m.away.name].forEach((t) => played.set(t, (played.get(t) || 0) + 1));
      m.goals.forEach((g) => {
        if (g.type === 'OWN') return;
        const team = g.side === 'home' ? m.home : m.away;
        const add = (name, field) => {
          const key = name + '|' + team.name;
          const row = table.get(key) || { player: name, team: team.name, tla: team.tla, goals: 0, assists: 0, penalties: 0 };
          row[field]++;
          table.set(key, row);
        };
        add(g.scorer, 'goals');
        if (g.type === 'PENALTY') table.get(g.scorer + '|' + team.name).penalties++;
        if (g.assist) add(g.assist, 'assists');
      });
    });
    const scorers = [...table.values()]
      .filter((r) => r.goals > 0)
      .map((r) => ({ ...r, played: played.get(r.team) }))
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.player.localeCompare(b.player));

    matches.sort((a, b) => b.utcDate.localeCompare(a.utcDate));
    return { matches, scorers };
  }

  const cache = {};
  function data(code) {
    if (!cache[code]) {
      const league = LEAGUES.find((l) => l.code === code);
      if (!league) throw new Error('Unknown league ' + code);
      cache[code] = buildLeague(league, new Date());
    }
    return cache[code];
  }

  window.DemoSource = {
    name: 'demo',
    leagues: LEAGUES.map(({ code, name, country, color }) => ({ code, name, country, color })),
    async getRecentMatches(code, limit = 10) {
      return data(code).matches.slice(0, limit);
    },
    async getScorers(code, limit = 10) {
      return data(code).scorers.slice(0, limit);
    },
    async getMatch(code, id) {
      const m = data(code).matches.find((x) => x.id === id);
      if (!m) throw new Error('Match not found');
      return m;
    }
  };
})();
