/* Coffee Dial-In — renders data/log.js, the public export of Postgres (coffee_bags,
   coffee_shots, coffee_experiments, kv coffee-dialin, the untamped coffee_* graph and
   machine telemetry). Nothing here knows a number; every value comes from the database. */
(function () {
  'use strict';
  var D = window.DIALIN || {};
  D.bags = D.bags || []; D.shots = D.shots || []; D.experiments = D.experiments || []; D.rules = D.rules || {};
  D.health = D.health || {}; D.origin = D.origin || {};
  var $ = function (s) { return document.querySelector(s); };
  var NOW = new Date();

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function parseDT(v) {
    if (!v) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
    var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(String(v).replace(' ', 'T'));
    return isNaN(d) ? null : d;
  }
  function fmtDate(v) { var d = parseDT(v); return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (v ? String(v).slice(0, 10) : ''); }
  function fmtTime(d) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' AM', 'am').replace(' PM', 'pm'); }
  function fmtWhen(v) {
    var d = parseDT(v); if (!d) return '';
    var days = Math.floor((NOW - d) / 864e5);
    if (days === 0 && d.getDate() === NOW.getDate()) return 'Today ' + fmtTime(d);
    if (days <= 1) return 'Yesterday ' + fmtTime(d);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + fmtTime(d);
  }
  function daysAgo(v) { var d = parseDT(v); return d ? Math.floor((NOW - d) / 864e5) : null; }
  function fmtAbs(v) { var d = parseDT(v); return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + fmtTime(d) : ''; }
  function n(v) { return v == null || v === '' ? '' : String(+v); }
  function fmtInt(v) { return v == null ? '' : (+v).toLocaleString('en-US'); }
  function verdictClass(v) {
    var t = (v || '').toLowerCase();
    if (/dialed|settled/.test(t)) return 'v-good';
    if (/choke|gush|too |way too|hollow|bitter|sour|messy|slow|fast/.test(t)) return 'v-bad';
    return '';
  }

  /* ---------- hover tooltip (one for the page) ---------- */
  var tip = $('#tip');
  function bindTip(node, text) {
    node.addEventListener('mouseenter', function () { tip.textContent = text; tip.hidden = false; });
    node.addEventListener('mousemove', function (e) { tip.style.left = Math.min(e.clientX + 12, window.innerWidth - 270) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; });
    node.addEventListener('mouseleave', function () { tip.hidden = true; });
    node.setAttribute('title', text);
  }

  /* ---------- health tiles ---------- */
  function tile(label, value, unit, delta, status, statusText, href, meter) {
    var t = el(href ? 'a' : 'div', 'panel tile');
    if (href) { t.href = href; if (/^https?:/.test(href)) { t.target = '_blank'; t.rel = 'noopener'; } }
    t.appendChild(el('div', 'label', label));
    var v = el('div', 'value', value); if (unit) v.appendChild(el('small', null, unit)); t.appendChild(v);
    if (delta) t.appendChild(el('div', 'delta', delta));
    if (meter) { var m = el('div', 'meter' + (status === 'warn' || status === 'serious' ? ' ' + status : '')); var i = el('i'); i.style.width = Math.max(0, Math.min(100, meter)) + '%'; m.appendChild(i); t.appendChild(m); }
    if (statusText) t.appendChild(el('span', 'status ' + (status || ''), statusText));
    return t;
  }
  /* Status ranks, one hue per rank, stated on the tile: good (dot green) · warn (amber) = something to do,
     not a fault · critical (red) = a fault. Unlogged shots are never a fault (they are usually Emily's). */
  function renderHealth() {
    var H = D.health, O = D.origin, T = O.totals || {}, host = $('#tiles');
    // 1. the log: one tile, headline = the count that needs Robby (shots the machine pulled that nobody logged)
    var pulled = H.machine_shots_7d, logged = H.shots_7d || 0;
    var unlogged = pulled == null ? null : Math.max(0, pulled - logged);
    var la = daysAgo(H.last_shot_at);
    var logStatus = unlogged == null ? (la == null ? '' : la <= 3 ? 'good' : 'warn') : unlogged >= 3 ? 'warn' : 'good';
    host.appendChild(tile(
      unlogged == null ? 'Shots logged, 7 days' : 'Unlogged shots, 7 days',
      unlogged == null ? String(logged) : String(unlogged), '',
      (H.last_shot_at ? 'last logged ' + fmtAbs(H.last_shot_at) : 'nothing logged yet') + (pulled != null ? ' · machine pulled ' + pulled + ', log has ' + logged : ''),
      logStatus, unlogged == null ? (la == null ? 'no shots yet' : la <= 3 ? 'log is current' : 'log going quiet') : unlogged >= 3 ? 'amber at 3 or more unlogged' : unlogged === 0 ? 'every pulled shot is logged' : 'under 3 unlogged is fine', '#log'));
    // 2. bags — physical bags vs blends, counted the way the cards show them
    var blends = D.bags.filter(function (b) { return (b.data || {}).blend_of; }).length, physical = D.bags.length - blends;
    var settled = D.bags.filter(function (b) { return ((b.data || {}).dialin || {}).settled; }).length, dialing = D.bags.length - settled;
    var planned = D.bags.filter(function (b) { return b.queued; }).length;
    host.appendChild(tile('Bags on the counter', String(physical), blends ? '+ ' + blends + ' blend' : '', settled + ' settled · ' + dialing + ' dialing in' + (planned ? ' · ' + planned + ' with a planned next shot' : ''),
      dialing ? 'warn' : 'good', dialing ? dialing + ' still need a settled recipe' : 'every bag settled', '#recipes'));
    // 3. backflush
    var bf = H.backflush || {};
    if (bf.last) {
      var left = bf.cadence_days - bf.days_ago;
      host.appendChild(tile('Backflush', String(bf.days_ago), 'days ago', 'last ' + fmtDate(bf.last) + ' · every ' + bf.cadence_days + ' days', left > 14 ? 'good' : left > 0 ? 'warn' : 'critical',
        left > 14 ? 'due in ' + left + ' days' : left > 0 ? 'due in ' + left + ' days — amber inside 2 weeks' : 'overdue by ' + (-left) + ' days', null, 100 * bf.days_ago / bf.cadence_days));
    }
    // 4. origin graph — stale state leads; the catalogue size moves to the footnote when the refresh is failing
    var ls = O.last_scrape, rel = daysAgo(T.last_release), failing = ls && ls.status !== 'ok';
    var st = !ls ? '' : failing ? ((ls.failing_runs || 1) >= 2 ? 'critical' : 'warn') : (rel <= 35 ? 'good' : 'warn');
    var foot = fmtInt(T.offerings_available) + ' live offerings as of ' + fmtDate(T.last_release) + ' · ' + fmtInt(T.roasters) + ' roasters · ' + fmtInt(T.producers) + ' producers';
    if (failing) host.appendChild(tile('Origin graph', String(rel), 'days stale', foot, st,
      'refresh failing since ' + fmtDate(ls.failing_since || ls.fired_at) + (ls.failing_runs > 1 ? ' (' + ls.failing_runs + ' runs, red at 2)' : ' (1 run)') + (ls.last_ok ? ' · last good ' + fmtDate(ls.last_ok) : ''), '#origin'));
    else host.appendChild(tile('Origin graph', fmtInt(T.offerings_available), 'live offerings', fmtInt(T.roasters) + ' roasters · ' + fmtInt(T.producers) + ' producers · newest release ' + fmtDate(T.last_release), st,
      !ls ? 'no refresh recorded' : 'refreshed ' + fmtDate(ls.fired_at) + (rel > 35 ? ' · no new release in ' + rel + ' days' : ''), '#origin'));
    // 5. this page — the data stamp. The page is rebuilt only when the data changed, so the stamp is the data's
    //    age, not the job's heartbeat (that lives in the Sunday claude-health report). A quiet week is not a fault.
    var g = parseDT(D.generated_at), ageD = g ? (NOW - g) / 864e5 : null;
    var pst = ageD == null ? '' : ageD <= 7 ? 'good' : 'warn';
    host.appendChild(tile('Data as of', g ? fmtAbs(g.toISOString()) : '—', '', 'the page is rebuilt whenever a shot, bag, rule or the origin graph changes', pst,
      ageD == null ? '' : ageD <= 7 ? 'changed within 7 days' : Math.round(ageD) + ' days without a change — quiet, or the hourly job is stuck (claude-health will say)', null));
  }

  /* ---------- water panel ---------- */
  function renderWater() {
    var W = D.rules.water, p = $('#water-panel');
    if (!W) { p.appendChild(el('p', 'empty', 'No water recipe recorded.')); return; }
    var row = el('div', 'dial'); row.style.display = 'flex'; row.style.gap = '22px'; row.style.flexWrap = 'wrap'; row.style.alignItems = 'baseline';
    [[W.hardness_ppm, 'ppm hardness'], [W.alkalinity_ppm, 'ppm alkalinity'], [W.epsom_g_per_gal, 'g Epsom / gal'], [W.baking_soda_g_per_gal, 'g baking soda / gal']].forEach(function (x) {
      var d = el('div'); d.appendChild(el('span', 'big', String(x[0]))).style.cssText = 'font-size:26px;font-weight:600'; d.appendChild(el('span', 'unit', x[1])).style.cssText = 'font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-left:5px'; row.appendChild(d);
    });
    p.appendChild(row);
    var note = el('p', 'small ink2', 'Base: ' + W.base + '. ' + W.note + '.'); note.style.marginTop = '8px'; p.appendChild(note);
    var link = el('p', 'small'); link.style.marginTop = '8px';
    var a = el('a', null, 'Open the water calculator with these targets ↗'); a.href = W.url + '?gh=' + W.hardness_ppm + '&kh=' + W.alkalinity_ppm; a.target = '_blank'; a.rel = 'noopener'; link.appendChild(a);
    link.appendChild(document.createTextNode(' · pourover water built from Seattle tap is on its second tab.'));
    p.appendChild(link);
  }

  /* ---------- sparkline: shot time per pulled shot, target band 30–35 s ---------- */
  function sparkline(bag, totalPulled) {
    var pts = D.shots.filter(function (s) { return s.bag === bag && s.status === 'pulled' && s.time_s != null; }).reverse(); // chronological
    if (pts.length < 2) return null;
    var W = 240, H = 48, lo = 10, hi = 45, pad = 6, BAND_LO = 30, BAND_HI = 35;
    var y = function (t) { t = Math.max(lo, Math.min(hi, +t)); return pad + (H - 2 * pad) * (1 - (t - lo) / (hi - lo)); };
    var x = function (i) { return pad + (W - 2 * pad) * (i / (pts.length - 1)); };
    var inBand = function (p) { return +p.time_s >= BAND_LO - 0.5 && +p.time_s < BAND_HI + 0.5; };   // the band as read on a stopwatch, to the nearest second
    // one ring per chart: the shot that set the CURRENT recipe (the newest SETTLED verdict); earlier "dialed" moments get no glyph
    var ringIdx = -1; pts.forEach(function (p, i) { if (/settled/i.test(p.verdict || '')) ringIdx = i; });
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'spark'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Shot time per shot, ' + pts.length + ' of ' + totalPulled + ' shots timed; band is the 30 to 35 second target; filled dots are inside the band');
    var band = document.createElementNS(ns, 'rect'); band.setAttribute('x', 0); band.setAttribute('width', W); band.setAttribute('y', y(BAND_HI)); band.setAttribute('height', y(BAND_LO) - y(BAND_HI)); band.setAttribute('fill', 'var(--band)'); svg.appendChild(band);
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.time_s).toFixed(1); }).join(' '));
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'var(--deemph)'); path.setAttribute('stroke-width', '1.5'); path.setAttribute('stroke-linejoin', 'round'); svg.appendChild(path);
    pts.forEach(function (p, i) {
      if (i === ringIdx) { var ring = document.createElementNS(ns, 'circle'); ring.setAttribute('cx', x(i)); ring.setAttribute('cy', y(p.time_s)); ring.setAttribute('r', 7); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', 'var(--s1)'); ring.setAttribute('stroke-width', '1.5'); svg.appendChild(ring); }
      var c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(p.time_s)); c.setAttribute('r', 3.2);
      c.setAttribute('fill', inBand(p) ? 'var(--ink2)' : 'var(--surface)'); c.setAttribute('stroke', 'var(--ink2)'); c.setAttribute('stroke-width', '1.5');
      var t = document.createElementNS(ns, 'title'); t.textContent = fmtDate(p.shot_at) + ': ' + n(p.time_s) + ' s at ' + n(p.microns) + ' µm / ' + n(p.rpm) + ' rpm' + (inBand(p) ? ' (in the 30–35 s band)' : ' (outside the band)') + (p.verdict ? ' — ' + p.verdict : ''); c.appendChild(t);
      svg.appendChild(c);
    });
    function label(i, anchor) { var p = pts[i], lab = document.createElementNS(ns, 'text'); lab.setAttribute('x', x(i) + (anchor === 'start' ? 6 : -6)); lab.setAttribute('y', y(p.time_s) + (y(p.time_s) < 16 ? 14 : -7)); lab.setAttribute('text-anchor', anchor); lab.setAttribute('font-size', '10'); lab.setAttribute('fill', 'var(--ink2)'); lab.textContent = n(p.time_s) + ' s'; svg.appendChild(lab); }
    label(0, 'start'); label(pts.length - 1, 'end');
    return { svg: svg, count: pts.length, settled: ringIdx >= 0 ? 1 : 0 };
  }

  /* ---------- current recipes ---------- */
  function renderRecipes() {
    var grid = $('#recipe-grid');
    if (!D.bags.length) { grid.appendChild(el('p', 'empty', 'No bags logged yet.')); return; }
    D.bags.forEach(function (b) {
      var d = (b.data || {}), di = d.dialin || {};
      var card = el('div', 'panel recipe');
      var head = el('div');
      head.appendChild(el('div', 'bag', b.short_name));
      var who = [d.roaster, d.process].filter(Boolean).join(' · ');
      if (who) head.appendChild(el('div', 'roaster', who));
      card.appendChild(head);
      card.id = 'bag-' + b.short_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      card.appendChild(el('span', 'pill ' + (di.settled ? 'settled' : 'open'), di.settled ? 'Settled' : 'Dialing in'));
      // The hero number means ONE thing per card, and says which: the setting to use (settled recipe or planned
      // next shot), or the last shot pulled (untested beyond that), or the intake start point (no shots yet).
      var src = di.settled ? 'settled' : b.queued ? 'planned' : b.last_shot && b.last_shot.microns ? 'last' : di.start ? 'start' : null;
      var um = { settled: di.microns, planned: b.queued && b.queued.microns, last: b.last_shot && b.last_shot.microns, start: di.start && di.start.microns }[src];
      var rpm = { settled: di.rpm, planned: b.queued && b.queued.rpm, last: b.last_shot && b.last_shot.rpm, start: di.start && di.start.rpm }[src];
      var eyebrow = { settled: 'Set the grinder to', planned: 'Next shot planned at', last: 'Last shot was pulled at', start: 'Start point, no shot yet' }[src];
      if (src) card.appendChild(el('div', 'eyebrow', eyebrow));
      var dial = el('div', 'dial');
      if (um) { var a = el('div'); a.appendChild(el('span', 'big', n(um))); a.appendChild(el('span', 'unit', 'µm')); dial.appendChild(a); }
      if (rpm) { var r = el('div'); r.appendChild(el('span', 'big', n(rpm))); r.appendChild(el('span', 'unit', 'rpm')); dial.appendChild(r); }
      if (dial.children.length) card.appendChild(dial);
      if (src === 'settled') {
        if (di.recipe) card.appendChild(el('p', 'line', di.recipe));
      } else {
        if (src === 'planned' && b.queued.next_change) card.appendChild(el('p', 'line', b.queued.next_change));
        if (src === 'start' && di.start_note) card.appendChild(el('p', 'line', di.start_note));
        if (b.last_shot) {
          var l = b.last_shot, bits = [];
          if (l.dose_g && l.yield_g) bits.push(n(l.dose_g) + ' g → ' + n(l.yield_g) + ' g');
          if (l.time_s) bits.push(n(l.time_s) + ' s');
          card.appendChild(el('p', 'line small ink2', (src === 'last' ? fmtDate(l.shot_at) + ': ' : 'Last shot ' + fmtDate(l.shot_at) + ': ' + n(l.microns) + ' µm at ' + n(l.rpm) + ' rpm, ') + bits.join(', ') + (l.verdict ? '. ' + l.verdict : '')));
          if (l.next_change && src === 'last') card.appendChild(el('p', 'line small', 'Suggested next: ' + l.next_change));
        } else if (src !== 'start') card.appendChild(el('p', 'line small muted', 'No shots logged yet.'));
      }
      var sp = sparkline(b.short_name, b.shots);
      if (sp) { card.appendChild(sp.svg); card.appendChild(el('div', 'spark-cap', 'Shot time, ' + sp.count + ' of ' + b.shots + ' shots timed · band = 30 to 35 s target, to the nearest second · filled = in band' + (sp.settled ? ' · ring = the shot that set this recipe' : ''))); }
      var gl = el('a', 'small', 'words on this card ↓'); gl.href = '#glossary'; card.appendChild(gl);
      card.appendChild(el('p', 'small muted', b.shots + (b.shots === 1 ? ' shot' : ' shots') + ' logged' + (d.opened ? ' · opened ' + fmtDate(d.opened) : '')));
      grid.appendChild(card);
    });
  }

  /* ---------- origin: provenance chain ---------- */
  function renderChain() {
    var host = $('#chain'), prov = D.origin.provenance || [];
    var linked = {}; prov.forEach(function (p) { linked[p.bag] = p; });
    D.bags.forEach(function (b) {
      var p = linked[b.short_name], hop = el('div', 'hop');
      var c1 = el('div'); c1.appendChild(el('div', 'k', 'Bag')); c1.appendChild(el('div', 'v', b.short_name)); hop.appendChild(c1);
      hop.appendChild(el('div', 'arrow', '→'));
      var c2 = el('div'); c2.appendChild(el('div', 'k', 'Roaster'));
      if (p) {
        var rv = el('div', 'v'); if (p.website) { var ra = el('a', null, p.roaster); ra.href = p.website; ra.target = '_blank'; ra.rel = 'noopener'; rv.appendChild(ra); } else rv.textContent = p.roaster; c2.appendChild(rv);
        c2.appendChild(el('div', 'd', [p.roaster_city, p.roaster_country].filter(Boolean).join(', ')));
      } else if ((b.data || {}).blend_of) { c2.appendChild(el('div', 'v', 'house blend')); c2.appendChild(el('div', 'd', 'mixed at the grinder')); }
      else { c2.appendChild(el('div', 'v', (b.data || {}).roaster || '—')); c2.appendChild(el('div', 'd', 'not in the origin graph yet')); }
      hop.appendChild(c2);
      hop.appendChild(el('div', 'arrow', '→'));
      var c3 = el('div'); c3.appendChild(el('div', 'k', 'Producer / farm'));
      if (p) {
        var o = p.origin || {};
        c3.appendChild(el('div', 'v', p.producer || o.farm || o.producer || 'unresolved producer'));
        var where = [o.farm && o.farm !== p.producer ? o.farm : null, o.region || p.producer_region, o.country || p.producer_country].filter(Boolean).join(' · ');
        if (where) c3.appendChild(el('div', 'd', where));
        var how = [o.process, o.variety, o.elevation].filter(Boolean).join(' · ');
        if (how) c3.appendChild(el('div', 'd', how));
        if (p.also_roasted_by && p.also_roasted_by.length) {
          var chips = el('div', 'chips'); chips.appendChild(el('span', 'd', 'also roasted by'));
          p.also_roasted_by.forEach(function (r) { chips.appendChild(el('span', 'chip', r)); });
          c3.appendChild(chips);
        } else if (p.producer) c3.appendChild(el('div', 'd', 'no other tracked roaster buys from this producer'));
        if (p.url) { var ol = el('a', 'small', 'offering page ↗'); ol.href = p.url; ol.target = '_blank'; ol.rel = 'noopener'; c3.appendChild(ol); }
      } else {
        var dd = b.data || {};
        if (dd.blend_of) { c3.appendChild(el('div', 'v', 'blend of ' + dd.blend_of.join(' + '))); c3.appendChild(el('div', 'd', 'see those two bags above')); }
        else {
          var place = [dd.region, dd.country].filter(function (x, i, arr) { return x && arr.indexOf(x) === i && !(i === 1 && arr[0] && arr[0].indexOf(x) >= 0); }).join(', ');
          c3.appendChild(el('div', 'v', dd.producer || dd.farm || place || 'origin not recorded'));
          var w2 = [(dd.producer || dd.farm) && place, dd.harvest, dd.elevation_masl && dd.elevation_masl + ' masl'].filter(Boolean).join(' · '); if (w2) c3.appendChild(el('div', 'd', w2));
        }
      }
      hop.appendChild(c3);
      host.appendChild(hop);
    });
    if (!D.bags.length) host.appendChild(el('p', 'empty', 'No bags logged.'));
  }

  /* ---------- origin: producers per country (emphasis bars) ---------- */
  function renderCountryBars() {
    var host = $('#country-bars'), rows = (D.origin.countries || []).slice(), onCounter = D.origin.counter_countries || [];
    if (!rows.length) { host.appendChild(el('p', 'empty', 'No origin data.')); return; }
    var total = rows.reduce(function (a, r) { return a + +r.producers; }, 0);
    var isMe = function (c) { return onCounter.indexOf(c) >= 0; };
    // top 10 by producers, plus any country that is on the counter even if it ranks lower; the rest fold into Other
    var top = rows.filter(function (r, i) { return i < 10 || isMe(r.country); }), rest = rows.filter(function (r) { return top.indexOf(r) < 0; });
    if (rest.length) top.push({ country: 'Other (' + rest.length + ' countries)', producers: rest.reduce(function (a, r) { return a + +r.producers; }, 0), roasters: null, other: true });
    var max = Math.max.apply(null, top.map(function (r) { return +r.producers; }));
    $('#country-sub').textContent = fmtInt(total) + ' producers with a live offering across the ' + fmtInt((D.origin.totals || {}).roasters) + ' roasters tracked, by country. ● and blue = a country that is on the counter right now.';
    top.forEach(function (r) {
      var me = !r.other && isMe(r.country);
      var lbl = el('div', 'lbl' + (me ? ' me' : ''), (me ? '● ' : '') + r.country), track = el('div', 'track'), i = el('i'); i.style.width = (100 * r.producers / max) + '%'; track.appendChild(i);
      if (me) i.style.background = 'var(--s1)';
      var num = el('div', 'n', fmtInt(r.producers));
      [lbl, track, num].forEach(function (x) { host.appendChild(x); });
      var text = r.country + ': ' + fmtInt(r.producers) + ' producers' + (r.roasters != null ? ' across ' + r.roasters + ' roasters' : '') + (me ? ' · on the counter now' : '');
      [lbl, track, num].forEach(function (x) { bindTip(x, text); });
    });
  }

  /* ---------- tables ---------- */
  function renderTable(tbl, rows, cols, opts) {
    opts = opts || {};
    var thead = tbl.querySelector('thead'), tbody = tbl.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    var tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', c.num ? 'num' : '', c.label)); });
    thead.appendChild(tr);
    if (!rows.length) { var e = el('tr'); var td = el('td', 'empty', 'Nothing here yet.'); td.colSpan = cols.length; e.appendChild(td); tbody.appendChild(e); return; }
    rows.forEach(function (r) {
      var row = el('tr');
      cols.forEach(function (c) {
        var td = el('td', c.num ? 'num' : (c.wrap ? 'wrap' : ''));
        if (c.render) c.render(td, r); else {
          var v = r[c.key] == null ? '' : r[c.key];
          if (c.date) v = fmtDate(v); else if (c.num) v = c.int ? fmtInt(v) : n(v);
          td.textContent = v;
        }
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  function renderShared() {
    var cols = [
      { key: 'name', label: 'Producer', render: function (td, r) { td.style.whiteSpace = 'nowrap'; td.textContent = (r.in_my_bags ? '● ' : '') + r.name; if (r.in_my_bags) td.style.fontWeight = '600'; } },
      { key: 'country', label: 'Country', render: function (td, r) { td.style.whiteSpace = 'nowrap'; td.textContent = r.country; } },
      { key: 'roasters', label: 'Roasters', num: true },
      { key: 'roasted_by', label: 'Roasted by', render: function (td, r) { td.style.cssText = 'min-width:44ch;overflow-wrap:anywhere'; td.textContent = (r.roasted_by || []).join(', '); } }
    ];
    renderTable($('#shared'), D.origin.shared_producers || [], cols);
  }

  function renderRoasters() {
    var rows = (D.origin.roasters || []).slice(), max = Math.max.apply(null, rows.map(function (r) { return +r.offerings || 0; }).concat([1]));
    var cols = [
      { key: 'name', label: 'Roaster', render: function (td, r) { td.style.whiteSpace = 'nowrap'; if (r.in_my_bags) { td.appendChild(document.createTextNode('● ')); td.style.fontWeight = '600'; } if (r.website) { var a = el('a', null, r.name); a.href = r.website; a.target = '_blank'; a.rel = 'noopener'; td.appendChild(a); } else td.appendChild(document.createTextNode(r.name)); } },
      { key: 'city', label: 'City', render: function (td, r) { td.style.whiteSpace = 'nowrap'; td.textContent = [r.city, r.country].filter(Boolean).join(', '); } },
      { key: 'offerings', label: 'Live offerings', num: true, render: function (td, r) { var w = el('div'); w.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:flex-end'; var bar = el('div'); bar.style.cssText = 'height:8px;width:' + Math.round(80 * (+r.offerings || 0) / max) + 'px;background:' + (r.in_my_bags ? 'var(--s1)' : 'var(--deemph)') + ';border-radius:0 3px 3px 0'; w.appendChild(bar); w.appendChild(el('span', null, fmtInt(r.offerings))); td.appendChild(w); } },
      { key: 'producers', label: 'Producers', num: true, int: true }
    ];
    renderTable($('#roasters'), rows, cols);
  }

  var SHOT_COLS = [
    { key: 'shot_at', label: 'Date', date: true }, { key: 'bag', label: 'Bag' }, { key: 'microns', label: 'µm', num: true }, { key: 'rpm', label: 'RPM', num: true },
    { key: 'dose_g', label: 'Dose (g)', num: true }, { key: 'yield_g', label: 'Yield (g)', num: true }, { key: 'time_s', label: 'Time (s)', num: true }, { key: 'ratio', label: 'Ratio', num: true },
    { key: 'taste', label: 'Taste', wrap: true },
    { key: 'verdict', label: 'Verdict', wrap: true, render: function (td, r) { var v = r.verdict || ''; td.className += ' ' + verdictClass(v); if (r.status === 'queued') { td.className += ' v-open'; v = 'Queued' + (v ? ' — ' + v : ''); } td.textContent = v; } },
    { key: 'next_change', label: 'Next change', wrap: true }, { key: 'by_whom', label: 'By' }
  ];
  var onlySettled = false;
  function renderShots() {
    var bag = $('#bag-filter').value, rows = D.shots.slice();
    if (bag) rows = rows.filter(function (s) { return s.bag === bag; });
    if (onlySettled) rows = rows.filter(function (s) { return /dialed|settled/i.test(s.verdict || ''); });
    renderTable($('#shots'), rows, SHOT_COLS);
    $('#log-count').textContent = rows.length + ' of ' + D.shots.length + ' rows';
  }
  function renderExperiments() {
    renderTable($('#exp'), D.experiments.slice(), [
      { key: 'run_on', label: 'Date', date: true }, { key: 'method', label: 'Method' }, { key: 'variable', label: 'Variable under test', wrap: true }, { key: 'held_constant', label: 'Held constant', wrap: true },
      { key: 'option_a', label: 'A', wrap: true }, { key: 'option_b', label: 'B', wrap: true }, { key: 'winner', label: 'Winner', wrap: true }, { key: 'notes', label: 'Notes', wrap: true }]);
  }

  /* ---------- house rules ---------- */
  function renderReference() {
    var host = $('#reference'), sections = (D.rules.sections || []);
    if (D.rules.glossary && D.rules.glossary.length) {   // words on the cards, defined once, first
      var g = el('div', 'panel'); g.id = 'glossary';
      var gh = el('div'); gh.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:8px';
      gh.appendChild(el('h3', null, 'Words on the cards')); var back = el('a', 'small', '↑ back to recipes'); back.href = '#recipes'; gh.appendChild(back); g.appendChild(gh);
      var gl = el('dl');
      D.rules.glossary.forEach(function (row) { gl.appendChild(el('dt', null, row[0])); gl.appendChild(el('dd', null, row[1])); });
      g.appendChild(gl); host.appendChild(g);
    }
    sections.forEach(function (sec) {
      var card = el('div', 'panel');
      card.appendChild(el('h3', null, sec.title));
      var dl = el('dl');
      if (sec.title_value) { var tv = el('dd'); tv.style.gridColumn = '1 / -1'; tv.textContent = sec.title_value; dl.appendChild(tv); }
      (sec.rows || []).forEach(function (r) {
        var label = r[0] || '', val = r[1] || '', note = r[2] || '';
        if (!label && !val) return;
        if (!val) { var only = el('dd'); only.style.gridColumn = '1 / -1'; only.textContent = label; dl.appendChild(only); return; }
        dl.appendChild(el('dt', null, label));
        var dd = el('dd');
        if (/^https?:\/\//.test(val)) { var a = el('a', null, val.replace(/^https?:\/\//, '')); a.href = val; a.rel = 'noopener'; a.target = '_blank'; dd.appendChild(a); }
        else dd.appendChild(document.createTextNode(val));
        if (note) dd.appendChild(el('span', 'note', note));
        dl.appendChild(dd);
      });
      if (dl.children.length) card.appendChild(dl);
      host.appendChild(card);
    });
    if (!sections.length) host.appendChild(el('p', 'empty', 'No house rules logged yet.'));
  }

  /* ---------- boot ---------- */
  var sel = $('#bag-filter'), chips = $('#bag-chips');
  D.bags.forEach(function (b) {
    var o = el('option', null, b.short_name); o.value = b.short_name; sel.appendChild(o);
    var c = el('a', 'chip' + (((b.data || {}).dialin || {}).settled ? ' settled' : ' open'), b.short_name); c.href = '#bag-' + b.short_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); chips.appendChild(c);
  });
  sel.addEventListener('change', renderShots);
  $('#only-settled').addEventListener('click', function () { onlySettled = !onlySettled; this.setAttribute('aria-pressed', String(onlySettled)); renderShots(); });

  renderHealth(); renderRecipes(); renderWater(); renderChain(); renderCountryBars(); renderShared(); renderRoasters();
  renderShots(); renderExperiments(); renderReference();
})();
