/* Seahawks × Packers — renders data/sim.js (window.SIM) */
(function () {
  const S = window.SIM;
  const A = 'SEA', B = 'GB';
  const NAME = S.names;
  const VENUE = { SEA: 'Lumen Field (Seattle)', GB: 'Lambeau Field (Green Bay)' };
  const ROUND = { WC: 'Wild Card', DIV: 'Divisional', CCG: 'NFC Championship', SB: 'Super Bowl' };
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (const kid of kids) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return e;
  };
  const pct = (x, d) => {
    if (x == null) return '–';
    if (x > 0 && x < 0.0005) return '<0.1%';
    return (100 * x).toFixed(d == null ? 1 : d) + '%';
  };
  const yellow = (t) => { // 0..1 -> css var ramp (sequential, one hue)
    if (!(t > 0)) return 'var(--y0)';
    const steps = ['--y1', '--y2', '--y3', '--y4', '--y5'];
    const i = Math.min(4, Math.floor(Math.sqrt(t) * 5));
    return 'var(' + steps[i] + ')';
  };
  const team = (abbr) => el('span', { class: abbr === A ? 'sea' : abbr === B ? 'gb' : '' }, NAME[abbr] || abbr);

  // ---------- tooltip
  const tip = $('#tip');
  function bindTip(node, html) {
    const show = (ev) => {
      tip.innerHTML = html; tip.style.opacity = 1;
      const x = Math.min(window.innerWidth - 270, (ev.clientX || 0) + 12), y = (ev.clientY || 0) + 14;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    };
    node.addEventListener('mousemove', show);
    node.addEventListener('mouseenter', show);
    node.addEventListener('mouseleave', () => tip.style.opacity = 0);
    node.addEventListener('click', (ev) => { show(ev); setTimeout(() => tip.style.opacity = 0, 2500); });
    node.setAttribute('tabindex', '0');
    node.addEventListener('focus', () => { const r = node.getBoundingClientRect(); show({ clientX: r.left, clientY: r.bottom }); });
    node.addEventListener('blur', () => tip.style.opacity = 0);
  }

  // ---------- stamp
  const gen = new Date(S.generated);
  $('#stamp').textContent = 'Simulated ' + gen.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) +
    ' · ' + S.n.toLocaleString() + ' seasons · ' + S.games_played + ' of ' + (S.games_played + S.games_remaining) + ' regular-season games played · ' +
    'Seahawks ' + S.base.SEA.w + '–' + S.base.SEA.l + ', Packers ' + S.base.GB.w + '–' + S.base.GB.l;

  // ---------- detector banner
  (function () {
    const d = $('#detect');
    if (S.scheduled_meeting && S.scheduled_meeting.length) {
      for (const g of S.scheduled_meeting) {
        const dt = new Date(g.date);
        d.append(el('div', { class: 'banner live' },
          el('strong', {}, '🏈 It is on the schedule: ' + NAME[g.away] + ' at ' + NAME[g.home]),
          el('span', {}, dt.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' · ' + (g.venue || VENUE[g.home]) + ' · ' + (g.type === 'post' ? 'playoffs' : g.type === 'pre' ? 'preseason' : 'regular season, week ' + g.week))));
      }
    } else {
      d.append(el('div', { class: 'banner' },
        el('strong', {}, 'No Seahawks–Packers game is on the 2026 schedule'),
        el('span', { class: 'small muted' }, 'Checked the preseason and all 18 regular-season weeks. A meeting this season can only come from the NFC playoff bracket, which is set on the night of Sunday, January 10, 2027. Next guaranteed regular-season game: 2027, Seahawks at Lambeau.')));
    }
  })();

  // ---------- tiles
  (function () {
    const t = $('#tiles');
    const m = S.meet || {};
    const at = (host) => Object.keys(m).filter(k => k.endsWith('|' + host)).reduce((a, k) => a + m[k], 0);
    const rows = [
      ['Meet this season', pct(S.meet_total), 'any NFC playoff round', true],
      ['At Lumen Field', pct(at('SEA')), 'Seattle the higher seed', false],
      ['At Lambeau Field', pct(at('GB')), 'Green Bay the higher seed', false],
      ['Seahawks make playoffs', pct(1 - (S.seed.SEA['0'] || 0), 0), 'seed 1: ' + pct(S.seed.SEA['1'] || 0, 0), false],
      ['Packers make playoffs', pct(1 - (S.seed.GB['0'] || 0), 0), 'the whole question', false],
    ];
    for (const [k, v, d, hi] of rows) t.append(el('div', { class: 'tile' + (hi ? ' hi' : '') }, el('div', { class: 'k' }, k), el('div', { class: 'v' }, v), el('div', { class: 'd' }, d)));
  })();

  // ---------- seed-pair rule matrix (pure bracket logic)
  function earliestRound(sa, sb) {
    // enumerate every wild-card and divisional outcome; return the earliest round where seeds sa and sb face off
    const wc = [[2, 7], [3, 6], [4, 5]];
    let best = null;
    const rank = { WC: 0, DIV: 1, CCG: 2 };
    for (const [h, l] of wc) if ((h === sa && l === sb) || (h === sb && l === sa)) return 'WC';
    for (let mask = 0; mask < 8; mask++) {
      const alive = [1];
      wc.forEach(([h, l], i) => alive.push((mask >> i) & 1 ? h : l));
      alive.sort((x, y) => x - y);
      const pairs = [[alive[0], alive[3]], [alive[1], alive[2]]];
      for (const [h, l] of pairs) if ((h === sa && l === sb) || (h === sb && l === sa)) { if (!best || rank.DIV < rank[best]) best = 'DIV'; }
      for (let m2 = 0; m2 < 4; m2++) {
        const surv = pairs.map(([h, l], i) => (m2 >> i) & 1 ? h : l);
        if (surv.includes(sa) && surv.includes(sb)) { if (!best) best = 'CCG'; }
      }
    }
    return best;
  }
  (function () {
    const wrap = $('#seedrules');
    const tbl = el('table');
    const head = el('tr', {}, el('th', {}, 'SEA ↓ / GB →'));
    for (let b = 1; b <= 7; b++) head.append(el('th', {}, String(b)));
    tbl.append(el('thead', {}, head));
    const body = el('tbody');
    for (let a = 1; a <= 7; a++) {
      const tr = el('tr', {}, el('th', {}, String(a)));
      for (let b = 1; b <= 7; b++) {
        if (a === b) { tr.append(el('td', { class: 'empty' }, '·')); continue; }
        const r = earliestRound(a, b);
        const host = a < b ? A : B;
        const td = el('td', { style: 'background:' + (r === 'WC' ? 'var(--y4)' : r === 'DIV' ? 'var(--y3)' : 'var(--y1)') + ';color:#1E2224' }, (r === 'WC' ? 'WC' : r === 'DIV' ? 'Div' : 'CCG') + (host === A ? ' 🏟️L' : ' 🏟️G'));
        bindTip(td, 'Seattle seed ' + a + ', Green Bay seed ' + b + '<br>Earliest meeting: ' + ROUND[r] + '<br>Host: ' + VENUE[host]);
        tr.append(td);
      }
      body.append(tr);
    }
    tbl.append(body);
    wrap.append(tbl);
    wrap.append(el('p', { class: 'foot', style: 'margin-top:6px' }, '🏟️L = Lumen Field, 🏟️G = Lambeau. WC = Wild Card, Div = Divisional, CCG = NFC Championship. The bracket re-seeds after the Wild Card round, so seed 1 can only meet a wild card in the Divisional round if that wild card is the lowest survivor.'));
  })();

  // ---------- remaining schedules
  (function () {
    const wrap = $('#sched');
    for (const t of [A, B]) {
      const card = el('div', { class: 'card' }, el('h3', {}, team(t), ' · ' + S.base[t].w + '–' + S.base[t].l + ' · ' + S.remaining[t].length + ' games left'));
      const tbl = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Wk'), el('th', {}, 'Opponent'), el('th', {}, 'Win chance'), el('th', { class: 'n' }, ''))));
      const tb = el('tbody');
      for (const g of S.remaining[t]) {
        const bar = el('div', { class: 'bar ' + (t === A ? 'sea' : 'gb') }, el('i', { style: 'width:' + (100 * g.p_win_sim).toFixed(0) + '%' }));
        tb.append(el('tr', {}, el('td', {}, String(g.week)), el('td', {}, (g.home ? 'vs ' : '@ ') + NAME[g.opp], el('span', { class: 'muted small' }, ' · ' + new Date(g.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))), el('td', {}, bar), el('td', { class: 'n' }, pct(g.p_win_sim, 0))));
      }
      tbl.append(tb); card.append(el('div', { class: 'tablewrap' }, tbl));
      const played = S.played[t].map(g => (g.pf > g.pa ? 'W' : 'L') + ' ' + (g.home ? 'vs ' : '@ ') + g.opp + ' ' + g.pf + '–' + g.pa).join(' · ');
      card.append(el('p', { class: 'foot', style: 'margin-top:8px' }, 'So far: ' + played));
      wrap.append(card);
    }
  })();

  // ---------- win/loss lattice
  function lattice(t) {
    const L = S.lattice[t], rem = S.remaining[t], base = S.base[t];
    const n = rem.length, maxW = base.w + n;
    const cw = 46, rh = 24, left = 44, top = 34, bottom = 50, right = 70;
    const W = left + n * cw + right, H = top + (maxW - base.w) * rh + bottom;
    const X = (i) => left + i * cw, Y = (w) => top + (maxW - w) * rh;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const mk = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
    const nodeP = {}; for (const nd of L.nodes) nodeP[nd.i + ',' + nd.w] = nd;
    nodeP['0,' + base.w] = { i: 0, w: base.w, p: 1, meet: S.meet_total };
    // grid rows
    for (let w = base.w; w <= maxW; w++) {
      svg.append(mk('line', { class: 'grid', x1: left - 6, x2: X(n) + 6, y1: Y(w), y2: Y(w) }));
      svg.append(mk('text', { x: left - 10, y: Y(w) + 4, 'text-anchor': 'end' }, w + 'W'));
    }
    // column labels
    rem.forEach((g, i) => {
      svg.append(mk('text', { x: X(i + 1), y: H - bottom + 18, 'text-anchor': 'middle' }, (g.home ? 'vs' : '@') + g.opp));
      svg.append(mk('text', { x: X(i + 1), y: H - bottom + 32, 'text-anchor': 'middle', 'font-size': '10' }, 'wk' + g.week));
    });
    svg.append(mk('text', { x: X(0), y: H - bottom + 18, 'text-anchor': 'middle' }, 'now'));
    // edges
    for (const e of L.edges) {
      if (e.p < 0.0015) continue;
      const x1 = X(e.i), y1 = Y(e.w), x2 = X(e.i + 1), y2 = Y(e.w + (e.won ? 1 : 0));
      const ln = mk('line', { x1, y1, x2, y2, stroke: e.meet > 0.02 ? yellow(e.meet) : 'var(--neutral-mark)', 'stroke-width': Math.max(1, 14 * Math.sqrt(e.p)).toFixed(1), 'stroke-linecap': 'round', opacity: e.meet > 0.02 ? 1 : 0.55 });
      svg.append(ln);
    }
    // nodes
    for (const key in nodeP) {
      const nd = nodeP[key];
      if (nd.p < 0.0015) continue;
      const r = Math.max(4, 16 * Math.sqrt(nd.p));
      const g = mk('g', { class: 'node' });
      const c = mk('circle', { cx: X(nd.i), cy: Y(nd.w), r, fill: yellow(nd.meet), stroke: nd.meet > 0.02 ? 'var(--y5)' : 'var(--rule)', 'stroke-width': 1.5 });
      const hit = mk('circle', { cx: X(nd.i), cy: Y(nd.w), r: Math.max(r, 12), fill: 'transparent' });
      g.append(c, hit);
      const rec = nd.w + '–' + (nd.i + base.l - (nd.w - base.w));
      bindTip(g, '<b>' + NAME[t] + ' ' + rec + '</b> after ' + (nd.i === 0 ? 'today' : 'game ' + nd.i + ' (' + (rem[nd.i - 1].home ? 'vs ' : '@ ') + rem[nd.i - 1].opp + ')') +
        '<br>Chance of this record: ' + pct(nd.p) + '<br>Meet the ' + (t === A ? 'Packers' : 'Seahawks') + ' from here: <b>' + pct(nd.meet) + '</b>');
      if (nd.i === n && nd.p >= 0.01) svg.append(mk('text', { class: 'rec', x: X(n) + r + 5, y: Y(nd.w) + 4 }, rec + ' · ' + pct(nd.meet, 0)));
      svg.append(g);
    }
    const wrap = el('div', { class: 'card' }, el('h3', {}, team(t), el('span', { class: 'muted', style: 'font-weight:400' }, ' · each remaining game, win = up, loss = flat')));
    wrap.append(el('div', { class: 'latt' }, svg));
    return wrap;
  }
  $('#trees').append(lattice(A), lattice(B));
  (function () {
    const lg = $('#treelegend');
    lg.append(el('span', {}, 'Meeting chance from that record:'));
    [['none', 'var(--y0)'], ['low', 'var(--y1)'], ['', 'var(--y2)'], ['', 'var(--y3)'], ['', 'var(--y4)'], ['high', 'var(--y5)']].forEach(([l, c]) => lg.append(el('span', {}, el('i', { class: 'sw', style: 'background:' + c }), l)));
    lg.append(el('span', {}, '· node size = probability of the record · label at the end = final record and its meeting chance'));
  })();

  // ---------- joint final-record heatmap
  (function () {
    const recs = S.records.filter(r => r.p >= 0.002);
    const as = [...new Set(recs.map(r => r.a))].sort((x, y) => y - x);
    const bs = [...new Set(recs.map(r => r.b))].sort((x, y) => x - y);
    const idx = {}; for (const r of S.records) idx[r.a + ',' + r.b] = r;
    const tbl = el('table');
    const head = el('tr', {}, el('th', {}, 'SEA wins ↓ / GB wins →'));
    for (const b of bs) head.append(el('th', {}, String(b)));
    tbl.append(el('thead', {}, head));
    const body = el('tbody');
    for (const a of as) {
      const tr = el('tr', {}, el('th', {}, String(a)));
      for (const b of bs) {
        const r = idx[a + ',' + b];
        if (!r || r.p < 0.002) { tr.append(el('td', { class: 'empty' }, '')); continue; }
        const td = el('td', { style: 'background:' + yellow(r.meet) + (r.meet > 0.25 ? ';color:#1E2224' : '') }, r.meet >= 0.005 ? pct(r.meet, 0) : '');
        bindTip(td, '<b>Seahawks ' + a + '–' + (17 - a) + ', Packers ' + b + '–' + (17 - b) + '</b><br>Chance of this pair of records: ' + pct(r.p) + '<br>They meet given these records: <b>' + pct(r.meet) + '</b>');
        tr.append(td);
      }
      body.append(tr);
    }
    tbl.append(body);
    $('#records').append(tbl);
    // table view
    const t2 = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Seahawks'), el('th', {}, 'Packers'), el('th', { class: 'n' }, 'P(records)'), el('th', { class: 'n' }, 'P(meet | records)'))));
    const b2 = el('tbody');
    for (const r of S.records.filter(r => r.p >= 0.002).sort((x, y) => y.meet * y.p - x.meet * x.p)) b2.append(el('tr', { class: r.meet > 0.1 ? 'hi' : '' }, el('td', {}, r.a + '–' + (17 - r.a)), el('td', {}, r.b + '–' + (17 - r.b)), el('td', { class: 'n' }, pct(r.p)), el('td', { class: 'n' }, pct(r.meet))));
    t2.append(b2); $('#recordstable').append(t2);
  })();

  // ---------- scenarios (seed permutations)
  function parseSig(sig) {
    // "WC:2>7|WC:3>6|WC:5>4|DIV:5@1" -> list of {rnd, hi, lo, winner, meet}
    return sig.split('|').map(s => {
      const [rnd, rest] = s.split(':');
      if (rest.includes('@')) { const [aw, hm] = rest.split('@').map(Number); return { rnd, away: aw, home: hm, meet: true }; }
      const [w, l] = rest.split('>').map(Number); return { rnd, winner: w, loser: l, meet: false };
    });
  }
  function bracketFor(pair, path, after) {
    // Build the NFC bracket games from a path signature using modal seed->team map.
    const st = pair.seedteam || {};
    const modal = {}; for (let s = 1; s <= 7; s++) modal[s] = (st['NFC' + s] && st['NFC' + s][0]) ? st['NFC' + s][0][0] : '?';
    const modalAFC = {}; for (let s = 1; s <= 7; s++) modalAFC[s] = (st['AFC' + s] && st['AFC' + s][0]) ? st['AFC' + s][0][0] : '?';
    modal[pair.a] = A; modal[pair.b] = B;
    const seeds = { SEA: pair.a, GB: pair.b };
    const games = parseSig(path.sig);
    const cols = { WC: [], DIV: [], CCG: [], SB: [] };
    let met = false, meetRound = null, meetHost = null;
    const wcPairs = [[2, 7], [3, 6], [4, 5]];
    const results = {}; // seed -> alive?
    const gameEl = (rnd, hi, lo, winner, cls, venue) => {
      const home = modal[hi], away = modal[lo];
      const g = el('div', { class: 'game ' + cls });
      const row = (seed, tm, won, lost) => el('div', { class: 't ' + (won ? 'w' : lost ? 'l' : '') }, el('span', {}, el('span', { class: 'seed' }, '#' + seed), tm === A ? el('span', { class: 'sea' }, NAME[tm]) : tm === B ? el('span', { class: 'gb' }, NAME[tm]) : NAME[tm] || '?'));
      g.append(row(lo, away, winner === lo, winner === hi), row(hi, home, winner === hi, winner === lo));
      if (venue) g.append(el('div', { class: 'venue' }, venue));
      return g;
    };
    // walk rounds using the signature order (WC games first)
    const sigWC = games.filter(g => g.rnd === 'WC');
    const alive = [1];
    wcPairs.forEach(([h, l], i) => {
      const g = sigWC.find(x => (x.meet ? (x.home === h && x.away === l) : ((x.winner === h && x.loser === l) || (x.winner === l && x.loser === h))));
      if (g && g.meet) {
        met = true; meetRound = 'WC'; meetHost = modal[h];
        cols.WC.push(gameEl('WC', h, l, null, 'meet', '🏟️ ' + VENUE[meetHost]));
        alive.push(h); // unknown winner; continue with after data
      } else if (g) {
        const involves = [h, l].includes(seeds.SEA) || [h, l].includes(seeds.GB);
        cols.WC.push(gameEl('WC', h, l, g.winner, involves ? 'path' : 'req'));
        alive.push(g.winner);
      } else {
        cols.WC.push(gameEl('WC', h, l, null, 'after'));
        alive.push(h);
      }
    });
    if (!met) {
      alive.sort((x, y) => x - y);
      const pairs = [[alive[0], alive[3]], [alive[1], alive[2]]];
      const sigD = games.filter(g => g.rnd === 'DIV');
      const alive2 = [];
      for (const [h, l] of pairs) {
        const g = sigD.find(x => (x.meet ? (x.home === h && x.away === l) : ((x.winner === h && x.loser === l) || (x.winner === l && x.loser === h))));
        if (g && g.meet) { met = true; meetRound = 'DIV'; meetHost = modal[h]; cols.DIV.push(gameEl('DIV', h, l, null, 'meet', '🏟️ ' + VENUE[meetHost])); alive2.push(h); }
        else if (g) { const involves = [h, l].includes(seeds.SEA) || [h, l].includes(seeds.GB); cols.DIV.push(gameEl('DIV', h, l, g.winner, involves ? 'path' : 'req')); alive2.push(g.winner); }
        else { cols.DIV.push(gameEl('DIV', h, l, null, 'after')); alive2.push(h); }
      }
      if (!met) {
        alive2.sort((x, y) => x - y);
        const [h, l] = alive2;
        const g = games.find(x => x.rnd === 'CCG');
        if (g && g.meet) { met = true; meetRound = 'CCG'; meetHost = modal[h]; cols.CCG.push(gameEl('CCG', h, l, null, 'meet', '🏟️ ' + VENUE[meetHost])); }
      }
    }
    // continuation after the meeting (modal)
    const af = after && after[0];
    if (af) {
      const winnerSeed = seeds[af.meet_winner];
      const note = (txt) => el('div', { class: 'game after' }, el('div', { class: 't w' }, txt));
      if (meetRound === 'WC') cols.DIV.push(note('Winner (' + NAME[af.meet_winner] + ') most likely then: ' + (af.nfc === af.meet_winner ? 'wins through to the NFC title' : 'falls before the title game')));
      if (meetRound !== 'CCG') cols.CCG.push(el('div', { class: 'game after' }, el('div', { class: 't w' }, el('span', { class: 'seed' }, 'NFC champion'), team(af.nfc)), el('div', { class: 'small muted' }, 'most likely, given this scenario')));
      cols.SB.push(el('div', { class: 'game after' },
        el('div', { class: 't ' + (af.sb === af.nfc ? 'w' : 'l') }, el('span', {}, el('span', { class: 'seed' }, 'NFC'), team(af.nfc))),
        el('div', { class: 't ' + (af.sb === af.afc ? 'w' : 'l') }, el('span', {}, el('span', { class: 'seed' }, 'AFC'), NAME[af.afc])),
        el('div', { class: 'venue' }, 'Super Bowl LXI · SoFi Stadium · Feb 14, 2027 · ' + pct(af.p, 0) + ' of these scenarios end exactly this way')));
    }
    const br = el('div', { class: 'bracket' });
    for (const r of ['WC', 'DIV', 'CCG', 'SB']) { const c = el('div', { class: 'bcol' }, el('h4', {}, ROUND[r])); for (const g of cols[r]) c.append(g); if (!cols[r].length) c.append(el('div', { class: 'small muted' }, r === 'WC' ? 'Seed 1 rests' : '')); br.append(c); }
    return { br, meetRound, meetHost };
  }
  (function () {
    const wrap = $('#scen');
    const tbl = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Seahawks'), el('th', {}, 'Packers'), el('th', { class: 'n' }, 'How likely'), el('th', { class: 'n' }, 'They meet'), el('th', {}, 'Most likely meeting'))));
    const tb = el('tbody');
    const seedTxt = (s) => s === 0 ? 'miss playoffs' : 'seed ' + s;
    const rows = S.pairs.filter(p => p.p >= 0.001);
    // aggregate rows for "one team misses"
    const missB = S.pairs.filter(p => p.b === 0).reduce((a, p) => a + p.p, 0);
    const missA = S.pairs.filter(p => p.a === 0 && p.b !== 0).reduce((a, p) => a + p.p, 0);
    tb.append(el('tr', {}, el('td', {}, 'any'), el('td', {}, 'miss playoffs'), el('td', { class: 'n' }, pct(missB)), el('td', { class: 'n' }, '0%'), el('td', { class: 'muted' }, 'no meeting possible')));
    tb.append(el('tr', {}, el('td', {}, 'miss playoffs'), el('td', {}, 'in'), el('td', { class: 'n' }, pct(missA)), el('td', { class: 'n' }, '0%'), el('td', { class: 'muted' }, 'no meeting possible')));
    for (const p of rows) {
      if (p.a === 0 || p.b === 0) continue;
      const meetP = Object.values(p.meet || {}).reduce((a, b) => a + b, 0);
      let best = null; for (const k in (p.meet || {})) if (!best || p.meet[k] > p.meet[best]) best = k;
      const desc = best ? ROUND[best.split('|')[0]] + ' at ' + (best.split('|')[1] === A ? 'Lumen' : 'Lambeau') + ' (' + pct(p.meet[best], 0) + ')' : '—';
      const tr = el('tr', { class: (meetP >= 0.05 ? 'hi ' : '') + 'clickable' }, el('td', {}, seedTxt(p.a)), el('td', {}, seedTxt(p.b)), el('td', { class: 'n' }, pct(p.p)), el('td', { class: 'n' }, pct(meetP, 0)), el('td', {}, desc));
      const detail = el('tr', { hidden: '' }); const td = el('td', { colspan: '5', style: 'padding:0' }); detail.append(td);
      tr.addEventListener('click', () => {
        if (!td.childElementCount) {
          const box = el('div', { class: 'scen' });
          if (p.paths && p.paths.length) {
            p.paths.slice(0, 2).forEach((path, i) => {
              const { br, meetRound, meetHost } = bracketFor(p, path, p.after);
              box.append(el('p', {}, el('strong', {}, (i === 0 ? 'Most likely way they meet' : 'Second most likely') + ': ' + ROUND[meetRound] + ' at ' + VENUE[meetHost]), el('span', { class: 'muted' }, ' · ' + pct(path.p, 0) + ' of the meetings in this seeding go this way')), br);
            });
            if (p.after && p.after.length) {
              const ul = el('ul', { class: 'small' });
              for (const af of p.after) ul.append(el('li', {}, el('strong', {}, NAME[af.meet_winner]), ' win the head-to-head → NFC champion ', team(af.nfc), ' → Super Bowl vs ', NAME[af.afc], ' → champion ', el('strong', {}, NAME[af.sb]), el('span', { class: 'muted' }, ' (' + pct(af.p, 0) + ')')));
              box.append(el('p', { class: 'small' }, 'From the meeting to the Super Bowl, most common endings:'), ul);
            }
          } else {
            box.append(el('p', { class: 'muted' }, 'No simulated season with this seeding produced a meeting. Most likely NFC bracket for it:'));
            const st = p.seedteam || {}; const ul = el('ul', { class: 'small' });
            for (let s = 1; s <= 7; s++) { const c = st['NFC' + s] || []; ul.append(el('li', {}, '#' + s + ': ' + c.map(([t, q]) => NAME[t] + ' ' + pct(q, 0)).join(', '))); }
            box.append(ul);
          }
          const st = p.seedteam || {};
          const ul2 = el('ul', { class: 'small muted' });
          for (const c of ['NFC', 'AFC']) ul2.append(el('li', {}, c + ' seeds in this scenario: ' + [1, 2, 3, 4, 5, 6, 7].map(s => '#' + s + ' ' + ((st[c + s] && st[c + s][0]) ? NAME[st[c + s][0][0]] + ' (' + pct(st[c + s][0][1], 0) + ')' : '?')).join(' · ')));
          box.append(el('details', {}, el('summary', { class: 'small' }, 'Most likely team at each seed'), ul2));
          td.append(box);
        }
        detail.hidden = !detail.hidden;
      });
      tb.append(tr, detail);
    }
    tbl.append(tb); wrap.append(tbl);
  })();

  // ---------- league table
  (function () {
    const rows = Object.keys(S.league).map(t => ({ t, ...S.league[t], elo: S.elo[t] })).sort((x, y) => y.sb - x.sb);
    const tbl = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Team'), el('th', {}, 'Division'), el('th', { class: 'n' }, 'Elo'), el('th', { class: 'n' }, 'Playoffs'), el('th', { class: 'n' }, 'Div title'), el('th', { class: 'n' }, 'Conf title'), el('th', { class: 'n' }, 'Super Bowl'))));
    const tb = el('tbody');
    for (const r of rows) tb.append(el('tr', { class: (r.t === A || r.t === B) ? 'hi' : '' }, el('td', {}, team(r.t)), el('td', { class: 'muted' }, S.div[r.t]), el('td', { class: 'n' }, Math.round(r.elo)), el('td', { class: 'n' }, pct(r.playoffs, 0)), el('td', { class: 'n' }, pct(r.div, 0)), el('td', { class: 'n' }, pct(r.conf, 0)), el('td', { class: 'n' }, pct(r.sb))));
    tbl.append(tb); $('#league').append(tbl);
  })();

  // ---------- method
  $('#method').innerHTML =
    '<p><strong>Ratings.</strong> Elo fitted over every 2024, 2025 and 2026 game (regular season and playoffs), margin-aware, K = ' + S.params.K + ', home field = ' + S.params.HFA + ' points, one third of each rating regressed to the mean between seasons. No injuries, no betting lines, no bye-week or travel effects.</p>' +
    '<p style="margin-top:6px"><strong>Season.</strong> Every unplayed game is sampled from the Elo win probability, ratings update as the simulated season unfolds, ties are not simulated. Standings use the NFL tiebreakers: head-to-head, division record, common games, conference record, strength of victory, strength of schedule, then a coin flip (the points-based steps are skipped). Wild-card ties across divisions keep one club per division first, as the rule says.</p>' +
    '<p style="margin-top:6px"><strong>Bracket.</strong> 7 seeds, bye for seed 1, re-seeding after Wild Card weekend, higher seed hosts, neutral Super Bowl. ' + S.n.toLocaleString() + ' seasons per run. Data: ESPN scoreboard. Source: <code>model/</code> next to this page.</p>';
})();
