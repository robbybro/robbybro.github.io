/* Coffee Dial-In — renders data/log.js, the public export of Postgres (coffee_bags,
   coffee_shots, coffee_experiments, kv coffee-dialin, the untamped coffee_* graph and
   machine telemetry). Nothing here knows a number; every value comes from the database.
   Two pages share this file: index.html (the board, every list capped at the newest 10 with an
   expander) and bags.html (every bag, traced to roaster and producer). */
(function () {
  'use strict';
  var D = window.DIALIN || {};
  D.bags = D.bags || []; D.shots = D.shots || []; D.experiments = D.experiments || []; D.rules = D.rules || {};
  D.health = D.health || {}; D.origin = D.origin || {};
  var $ = function (s) { return document.querySelector(s); };
  var NOW = new Date();
  var PAGE = document.body.getAttribute('data-page') || 'index';
  var CAP = 10;   // every list on the board shows the newest 10, then expands (Robby 2026-10-30)

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
  function daysAgo(v) { var d = parseDT(v); return d ? Math.floor((NOW - d) / 864e5) : null; }
  function fmtAbs(v) { var d = parseDT(v); return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + fmtTime(d) : ''; }
  function n(v) { return v == null || v === '' ? '' : String(+v); }
  function fmtInt(v) { return v == null ? '—' : Number(v).toLocaleString('en-US'); }
  function slug(s) { return 'bag-' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  function safeLink(a, url) {   // scraped storefront URLs only ever become links when they are http(s)
    if (!/^https?:\/\//i.test(String(url || ''))) return false;
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; return true;
  }
  function verdictClass(v) {
    var t = (v || '').toLowerCase();
    if (/dialed|settled/.test(t)) return 'v-good';
    if (/choke|gush|too |way too|hollow|bitter|sour|messy|slow|fast/.test(t)) return 'v-bad';
    return '';
  }

  /* ---------- hover tooltip (one for the page) ---------- */
  var tip = $('#tip');
  function placeTip(x, y) { tip.style.left = Math.max(8, Math.min(x + 12, window.innerWidth - 270)) + 'px'; tip.style.top = (y + 14) + 'px'; }
  function bindTip(node, text) {
    node.addEventListener('mouseenter', function () { tip.textContent = text; tip.hidden = false; });
    node.addEventListener('mousemove', function (e) { placeTip(e.clientX, e.clientY); });
    node.addEventListener('mouseleave', function () { tip.hidden = true; });
    node.setAttribute('title', text);
  }

  /* ---------- glossary: one block at the top of each page, collapsed ---------- */
  function renderGlossary() {
    var host = $('#glossary-body'), rows = D.rules.glossary || [];
    if (!host) return;
    if (!rows.length) { $('#glossary').hidden = true; return; }
    rows.forEach(function (row) { host.appendChild(el('dt', null, row[0])); host.appendChild(el('dd', null, row[1])); });
  }

  /* ---------- bag chips + what their border colours mean ---------- */
  function renderChips() {
    var chips = $('#bag-chips'), legend = $('#chip-legend');
    D.bags.forEach(function (b) {
      var d = b.data || {}, settled = (d.dialin || {}).settled;
      var c = el('a', 'chip' + (settled ? ' settled' : ' open') + (d.house ? ' house' : ''), (d.house ? '★ ' : '') + b.short_name);
      c.href = (PAGE === 'bags' || D.bags.indexOf(b) < CAP ? '' : 'bags.html') + '#' + slug(b.short_name);
      chips.appendChild(c);
    });
    if (legend && D.bags.length) legend.textContent = 'Chip border: green = recipe settled · amber = still dialing in · ★ = house bean';
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
     not a fault · critical (red) = a fault. Unlogged shots are tracked but NEVER coloured (Robby 2026-10-30:
     "Emily's never going to log her shots — keep track, but don't use them as a sign something is wrong"). */
  function renderHealth() {
    var H = D.health, O = D.origin, T = O.totals || {}, host = $('#tiles');
    // 1. the log: what the machine counted vs what got logged, 7 days — a count, not a status
    var pulled = H.machine_shots_7d, logged = H.shots_7d || 0;
    var unlogged = pulled == null ? null : Math.max(0, pulled - logged);
    host.appendChild(tile(
      pulled == null ? 'Shots logged, 7 days' : 'Shots pulled, 7 days',
      pulled == null ? String(logged) : String(pulled), pulled == null ? '' : 'on the machine',
      (pulled == null ? '' : logged + ' logged · ' + unlogged + ' unlogged · ') + (H.last_shot_at ? 'last logged ' + fmtAbs(H.last_shot_at) : 'nothing logged yet'),
      '', pulled == null ? '' : 'unlogged shots are tracked, never a fault', '#log'));
    // 2. bags — the store keeps no "on the counter" state (Robby 2026-10-13), so this is bags logged
    var blends = D.bags.filter(function (b) { return (b.data || {}).blend_of; }).length, physical = D.bags.length - blends;
    var settled = D.bags.filter(function (b) { return ((b.data || {}).dialin || {}).settled; }).length, dialing = D.bags.length - settled;
    var planned = D.bags.filter(function (b) { return b.queue && b.queue.length; }).length;
    host.appendChild(tile('Bags logged', String(D.bags.length), 'bags', physical + ' single' + (blends ? ' + ' + blends + ' blend' + (blends > 1 ? 's' : '') : '') + ' · ' + settled + ' settled · ' + dialing + ' dialing in' + (planned ? ' · ' + planned + ' with a planned next shot' : ''),
      '', 'every bag, traced to roaster and producer, on the bags page', 'bags.html'));
    // 3. backflush
    var bf = H.backflush || {};
    if (bf.last && bf.cadence_days != null && bf.days_ago != null) {
      var left = bf.cadence_days - bf.days_ago;
      host.appendChild(tile('Backflush', String(bf.days_ago), 'days ago', 'last ' + fmtDate(bf.last) + ' · every ' + bf.cadence_days + ' days', left > 14 ? 'good' : left > 0 ? 'warn' : 'critical',
        left > 14 ? 'due in ' + left + ' days' : left > 0 ? 'due in ' + left + ' days — amber inside 2 weeks' : 'overdue by ' + (-left) + ' days', null, 100 * bf.days_ago / bf.cadence_days));
    }
    // 4. origin graph — stale state leads; the catalogue size moves to the footnote when the refresh is failing
    var ls = O.last_scrape, rel = daysAgo(T.last_release), failing = ls && ls.status !== 'ok';
    var st = !ls ? '' : failing ? ((ls.failing_runs || 1) >= 2 ? 'critical' : 'warn') : (rel != null && rel <= 35 ? 'good' : 'warn');
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
    var a = el('a', null, 'Open the water calculator with these targets ↗'); if (safeLink(a, W.url + '?gh=' + W.hardness_ppm + '&kh=' + W.alkalinity_ppm)) link.appendChild(a);
    link.appendChild(document.createTextNode(' · pourover water built from Seattle tap is on its second tab.'));
    p.appendChild(link);
  }

  /* ---------- sparkline: shot time per pulled shot, target band 30–35 s ----------
     Every point is reachable: the whole chart is the hit area (nearest shot to the pointer), a tap or click
     pins the readout, arrow keys walk it, and the readout line under the chart always shows a shot's grind,
     speed and seconds — the newest shot by default — so no number is gated behind a hover (Robby
     2026-10-30: the old title-tooltip was "pretty hard to get to show up"). Blue dot = a shot with tasting
     notes. Pointer → svg coordinates go through the SVG's own screen matrix, so the mapping holds at any
     card width (the viewBox is letterboxed, not stretched). */
  var TOUCH = window.matchMedia && window.matchMedia('(hover: none)').matches;
  var PINNED = null;   // the one chart holding a pinned readout; one document listener unpins it
  document.addEventListener('pointerdown', function (e) { if (PINNED && !PINNED.svg.contains(e.target)) PINNED.unpin(); });
  function sparkline(bag, totalPulled) {
    var pts = D.shots.filter(function (s) { return s.bag === bag && s.status === 'pulled' && s.time_s != null; }).reverse(); // chronological
    if (pts.length < 2) return null;
    var W = 240, H = 64, lo = 10, hi = 45, pad = 8, TOP = 16, BAND_LO = 30, BAND_HI = 35;   // TOP = the label row above the plot
    var y = function (t) { t = Math.max(lo, Math.min(hi, +t)); return TOP + (H - TOP - pad) * (1 - (t - lo) / (hi - lo)); };
    var x = function (i) { return pad + (W - 2 * pad) * (i / (pts.length - 1)); };
    var inBand = function (p) { return +p.time_s >= BAND_LO - 0.5 && +p.time_s < BAND_HI + 0.5; };   // the band as read on a stopwatch, to the nearest second
    var noted = function (p) { return !!(p.taste && String(p.taste).trim()); };
    // one ring per chart: the shot that set the CURRENT recipe (the newest SETTLED verdict); earlier "dialed" moments get no glyph
    var ringIdx = -1; pts.forEach(function (p, i) { if (/settled/i.test(p.verdict || '')) ringIdx = i; });
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'spark'); svg.setAttribute('role', 'group'); svg.setAttribute('tabindex', '0');
    svg.setAttribute('aria-label', 'Shot time per shot, ' + pts.length + ' of ' + totalPulled + ' shots timed; band is the 30 to 35 second target; left and right arrow keys read each shot');
    var band = document.createElementNS(ns, 'rect'); band.setAttribute('x', 0); band.setAttribute('width', W); band.setAttribute('y', y(BAND_HI)); band.setAttribute('height', y(BAND_LO) - y(BAND_HI)); band.setAttribute('fill', 'var(--band)'); svg.appendChild(band);
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.time_s).toFixed(1); }).join(' '));
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'var(--deemph)'); path.setAttribute('stroke-width', '1.5'); path.setAttribute('stroke-linejoin', 'round'); svg.appendChild(path);
    var cursor = document.createElementNS(ns, 'line'); cursor.setAttribute('y1', TOP - 4); cursor.setAttribute('y2', H); cursor.setAttribute('stroke', 'var(--axis)'); cursor.setAttribute('stroke-width', '1'); cursor.setAttribute('visibility', 'hidden'); svg.appendChild(cursor);
    var dots = [];
    pts.forEach(function (p, i) {
      if (i === ringIdx) { var ring = document.createElementNS(ns, 'circle'); ring.setAttribute('cx', x(i)); ring.setAttribute('cy', y(p.time_s)); ring.setAttribute('r', 7.5); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', 'var(--s1)'); ring.setAttribute('stroke-width', '1.5'); svg.appendChild(ring); }
      var c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(p.time_s)); c.setAttribute('r', 3.4);
      var stroke = noted(p) ? 'var(--s1)' : 'var(--ink2)';
      c.setAttribute('fill', inBand(p) ? stroke : 'var(--surface)'); c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', '1.6');
      svg.appendChild(c); dots.push(c);
    });
    function endLabel(i, anchor) {   // first and last shot, in the label row above the plot (never on the line)
      var p = pts[i], lab = document.createElementNS(ns, 'text');
      lab.setAttribute('x', anchor === 'start' ? pad : W - pad); lab.setAttribute('y', 11); lab.setAttribute('text-anchor', anchor);
      lab.setAttribute('font-size', '11'); lab.setAttribute('fill', 'var(--ink2)'); lab.textContent = n(p.microns) + ' µm → ' + n(p.time_s) + ' s'; svg.appendChild(lab);
    }
    endLabel(0, 'start'); endLabel(pts.length - 1, 'end');
    // readout: <b>grind · rpm → seconds</b> then the rest, never sliced out of a joined string
    var read = el('div', 'spark-read'); read.setAttribute('aria-live', 'polite');
    var active = -1, pinned = false, last = pts.length - 1;
    function parts(p) {
      var head = (p.microns != null ? n(p.microns) + ' µm' : '?') + (p.rpm != null ? ' · ' + n(p.rpm) + ' rpm' : '') + ' → ' + n(p.time_s) + ' s';
      var tail = (p.dose_g && p.yield_g ? ' · ' + n(p.dose_g) + ' g → ' + n(p.yield_g) + ' g' : p.yield_g ? ' · ' + n(p.yield_g) + ' g out' : '')
        + ' · ' + fmtDate(p.shot_at) + (inBand(p) ? ' · in band' : '') + (p.taste ? ' — ' + p.taste : p.verdict ? ' — ' + p.verdict : '');
      return { head: head, tail: tail };
    }
    function write(i, prefix) { var pr = parts(pts[i]); read.textContent = ''; if (prefix) read.appendChild(document.createTextNode(prefix)); read.appendChild(el('b', null, pr.head)); read.appendChild(document.createTextNode(pr.tail)); }
    function mark(i) { if (active >= 0) dots[active].setAttribute('r', '3.4'); active = i; if (i >= 0) { dots[i].setAttribute('r', '5'); cursor.setAttribute('x1', x(i)); cursor.setAttribute('x2', x(i)); cursor.setAttribute('visibility', 'visible'); } else cursor.setAttribute('visibility', 'hidden'); }
    function show(i) { if (i < 0 || i >= pts.length) return; mark(i); write(i, i === last ? 'Newest: ' : ''); }
    function rest() { mark(-1); write(last, 'Newest: '); }   // idle state = the newest shot, so a number is always on screen
    function unpin() { pinned = false; if (PINNED === me) PINNED = null; rest(); }
    var me = { svg: svg, unpin: unpin };
    function idxAt(clientX, clientY) {   // pointer → viewBox x through the SVG's screen matrix (correct under letterboxing)
      var fx; try { var pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY; fx = pt.matrixTransform(svg.getScreenCTM().inverse()).x; }
      catch (e) { var r = svg.getBoundingClientRect(); fx = (clientX - r.left) / r.width * W; }
      return Math.max(0, Math.min(last, Math.round((fx - pad) / (W - 2 * pad) * last)));
    }
    rest();
    svg.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch' || pinned) return; show(idxAt(e.clientX, e.clientY)); });
    svg.addEventListener('pointerleave', function () { if (!pinned) rest(); });
    var touchDown = false;
    svg.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') { touchDown = true; return; } pin(idxAt(e.clientX, e.clientY)); });
    svg.addEventListener('pointercancel', function () { touchDown = false; });   // the thumb was scrolling, not tapping
    svg.addEventListener('pointerup', function (e) { if (e.pointerType !== 'touch' || !touchDown) return; touchDown = false; pin(idxAt(e.clientX, e.clientY)); });
    function pin(i) { if (pinned && i === active) { unpin(); return; } if (PINNED && PINNED !== me) PINNED.unpin(); pinned = true; PINNED = me; show(i); }
    svg.addEventListener('keydown', function (e) {
      var k = e.key; if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End' && k !== 'Escape') return;
      e.preventDefault();
      if (k === 'Escape') { unpin(); return; }
      var i = k === 'Home' ? 0 : k === 'End' ? last : active < 0 ? (k === 'ArrowRight' ? 0 : last) : Math.max(0, Math.min(last, active + (k === 'ArrowRight' ? 1 : -1)));
      pin(i); if (!pinned) pin(i);
    });
    svg.addEventListener('blur', function () { if (pinned) unpin(); });
    var wrap = el('div', 'spark-wrap'); wrap.appendChild(svg); wrap.appendChild(read);
    var annotated = pts.filter(noted).length;
    return { node: wrap, count: pts.length, settled: ringIdx >= 0 ? 1 : 0, annotated: annotated };
  }

  /* ---------- provenance for one bag (roaster → producer / farm), from the untamped graph ---------- */
  var PROV = {}; (D.origin.provenance || []).forEach(function (p) { PROV[p.bag] = p; });
  function roasterCell(b, p, c2) {
    c2.appendChild(el('div', 'k', 'Roaster'));
    if (p) {
      var rv = el('div', 'v'); var ra = el('a', null, p.roaster); if (safeLink(ra, p.website)) rv.appendChild(ra); else rv.textContent = p.roaster; c2.appendChild(rv);
      c2.appendChild(el('div', 'd', [p.roaster_city, p.roaster_country].filter(Boolean).join(', ')));
    } else if ((b.data || {}).blend_of) { c2.appendChild(el('div', 'v', 'house blend')); c2.appendChild(el('div', 'd', 'mixed at the grinder')); }
    else { var dd = b.data || {}; c2.appendChild(el('div', 'v', dd.roaster || '—')); c2.appendChild(el('div', 'd', [dd.roaster_city, dd.roaster_in_untamped ? 'in the origin graph, this offering not yet' : 'not in the origin graph yet'].filter(Boolean).join(' · '))); }
  }
  function producerCell(b, p, c3) {
    c3.appendChild(el('div', 'k', 'Producer / farm'));
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
      var ol = el('a', 'small', 'offering page ↗'); if (safeLink(ol, p.url)) c3.appendChild(ol);
    } else {
      var dd = b.data || {};
      if (dd.blend_of) { c3.appendChild(el('div', 'v', 'blend of ' + [].concat(dd.blend_of).join(' + '))); c3.appendChild(el('div', 'd', 'see those two bags')); }
      else {
        var country = dd.origin_country || dd.country;
        var place = [dd.region, country].filter(function (x, i, arr) { return x && arr.indexOf(x) === i && !(i === 1 && arr[0] && arr[0].indexOf(x) >= 0); }).join(', ');
        c3.appendChild(el('div', 'v', dd.producer || dd.farm || place || 'origin not recorded'));
        var w2 = [(dd.producer || dd.farm) && place, dd.variety, dd.process && dd.process !== 'blend; processes not stated on bag' ? dd.process : null, dd.harvest, dd.elevation_masl && dd.elevation_masl + ' masl'].filter(Boolean).join(' · '); if (w2) c3.appendChild(el('div', 'd', w2));
        if (dd.origins && dd.origins.length) c3.appendChild(el('div', 'd', 'origins: ' + dd.origins.join(', ')));
      }
    }
  }

  /* ---------- recipe cards ---------- */
  function recipeCard(b, withChain) {
    var d = (b.data || {}), di = d.dialin || {};
    var card = el('div', 'panel recipe');
    var head = el('div');
    head.appendChild(el('div', 'bag', b.short_name));
    var who = [d.roaster, d.process].filter(Boolean).join(' · ');
    if (who) head.appendChild(el('div', 'roaster', who));
    card.appendChild(head);
    card.id = slug(b.short_name);
    var pills = el('div', 'pills');
    if (d.house) { card.classList.add('house'); pills.appendChild(el('span', 'pill house', 'House bean')); }
    pills.appendChild(el('span', 'pill ' + (di.settled ? 'settled' : 'open'), di.settled ? 'Settled' : 'Dialing in'));
    card.appendChild(pills);
    // The hero number means ONE thing per card, and says which: the setting to use (settled recipe, or the
    // newest plan in the bag's next-up queue), or the last shot pulled (nothing queued), or the intake start
    // point (no shots yet). The queue (every planned shot, newest plan first) is what to try next; a pulled
    // shot at that grind clears its entry and "X is out" clears the whole queue (Robby 2026-10-22).
    var Q = b.queue || (b.queued ? [b.queued] : []), houseDose = +((D.rules.laws || {}).espresso_dose_g) || 18;
    var doseOf = function (s) { return s && s.dose_g != null && s.dose_g !== '' ? +s.dose_g : houseDose; };
    var src = di.settled ? 'settled' : Q.length ? 'planned' : b.last_shot && b.last_shot.microns ? 'last' : di.start ? 'start' : null;
    var pick = { settled: { um: di.microns, rpm: di.rpm, dose: di.dose_g || houseDose }, planned: Q[0] && { um: Q[0].microns, rpm: Q[0].rpm, dose: doseOf(Q[0]) },
                 last: b.last_shot && { um: b.last_shot.microns, rpm: b.last_shot.rpm, dose: doseOf(b.last_shot) }, start: di.start && { um: di.start.microns, rpm: di.start.rpm, dose: houseDose } }[src] || {};
    var eyebrow = { settled: 'Set the grinder to', planned: 'Next up · set the grinder to', last: 'Nothing queued · last shot was pulled at', start: 'Start point, no shot yet' }[src];
    if (src) card.appendChild(el('div', 'eyebrow', eyebrow));
    var dial = el('div', 'dial');
    [[pick.um, 'µm'], [pick.rpm, 'rpm'], [pick.dose, 'g in']].forEach(function (x) {
      if (!x[0]) return; var w = el('div'); w.appendChild(el('span', 'big', n(x[0]))); w.appendChild(el('span', 'unit', x[1])); dial.appendChild(w);
    });
    if (dial.children.length) card.appendChild(dial);
    function queueList(plans, startAt) {
      var ol = el('ol', 'queue'); ol.start = startAt;
      plans.forEach(function (q) {
        var li = el('li'); li.appendChild(el('b', null, n(q.microns) + ' µm · ' + n(q.rpm) + ' rpm · ' + n(doseOf(q)) + ' g'));
        if (q.next_change) li.appendChild(document.createTextNode(' — ' + q.next_change));
        li.appendChild(el('span', 'small muted', ' · planned ' + fmtDate(q.shot_at)));
        ol.appendChild(li);
      });
      return ol;
    }
    if (src === 'settled') {
      if (di.recipe) card.appendChild(el('p', 'line', di.recipe));
      if (Q.length) { card.appendChild(el('div', 'eyebrow', 'Next up · test' + (Q.length > 1 ? 's' : '') + ' queued, recipe above still stands')); card.appendChild(queueList(Q, 1)); }
    } else {
      if (src === 'planned') {
        var q0 = Q[0];
        card.appendChild(el('p', 'line', (q0.next_change || 'cut at 34 g, aim 30–35 s total') + ' '));
        card.lastChild.appendChild(el('span', 'small muted', '· planned ' + fmtDate(q0.shot_at)));
        if (Q.length > 1) { card.appendChild(el('div', 'eyebrow', 'Also queued')); card.appendChild(queueList(Q.slice(1), 2)); }
      }
      if (src === 'start' && (di.start_note || d.dialin_start_note)) card.appendChild(el('p', 'line', di.start_note || d.dialin_start_note));
      if (b.last_shot) {
        var l = b.last_shot, bits = [];
        if (l.dose_g && l.yield_g) bits.push(n(l.dose_g) + ' g → ' + n(l.yield_g) + ' g');
        if (l.time_s) bits.push(n(l.time_s) + ' s');
        card.appendChild(el('p', 'line small ink2', (src === 'last' ? fmtDate(l.shot_at) + ': ' : 'Last shot ' + fmtDate(l.shot_at) + ': ' + n(l.microns) + ' µm at ' + n(l.rpm) + ' rpm, ') + bits.join(', ') + (l.taste ? '. ' + l.taste : '') + (l.verdict ? '. ' + l.verdict : '')));
        if (src === 'last') card.appendChild(el('p', 'line small', l.next_change ? 'Suggested next: ' + l.next_change : 'No plan queued yet.'));
      } else if (src !== 'start') card.appendChild(el('p', 'line small muted', 'No shots logged yet.'));
    }
    if (di.pourover && di.pourover.setting != null) {
      var po = di.pourover, pl = el('p', 'line pour');
      pl.appendChild(el('span', 'eyebrow', 'Pourover · ' + (po.grinder || 'Fellow Ode Gen 2') + ' at '));
      pl.appendChild(el('strong', null, n(po.setting)));
      if (po.brewers) pl.appendChild(document.createTextNode(' · ' + po.brewers));
      if (po.why) pl.appendChild(el('span', 'small muted', ' — ' + po.why));
      card.appendChild(pl);
    }
    var sp = sparkline(b.short_name, b.shots);
    if (sp) {
      card.appendChild(sp.node);
      card.appendChild(el('div', 'spark-cap', (TOUCH ? 'Tap a dot to read that shot' : 'Hover a dot to read that shot, click to keep it') + ' · ' + sp.count + ' of ' + b.shots + ' timed · band = 30 to 35 s target · filled = in band · blue = tasting notes recorded (' + sp.annotated + ' of ' + sp.count + ')' + (sp.settled ? ' · ring = the shot that set this recipe' : '')));
    }
    if (withChain) {
      var box = el('div', 'chainbox'), p = PROV[b.short_name];
      var c2 = el('div'); roasterCell(b, p, c2); box.appendChild(c2);
      var c3 = el('div'); producerCell(b, p, c3); box.appendChild(c3);
      card.appendChild(box);
    }
    card.appendChild(el('p', 'small muted', b.shots + (b.shots === 1 ? ' shot' : ' shots') + ' logged' + (d.opened ? ' · opened ' + fmtDate(d.opened) : '') + (d.roast_date ? ' · roasted ' + fmtDate(d.roast_date) : '')));
    return card;
  }
  function renderRecipes(bags, withChain) {
    var grid = $('#recipe-grid');
    if (!bags.length) { grid.appendChild(el('p', 'empty', 'No bags logged yet.')); return; }
    bags.forEach(function (b) { grid.appendChild(recipeCard(b, withChain)); });
  }

  /* ---------- origin: provenance chain for the bags shown on the board ---------- */
  function renderChain(bags) {
    var host = $('#chain');
    bags.forEach(function (b) {
      var p = PROV[b.short_name], hop = el('div', 'hop');
      var c1 = el('div'); c1.appendChild(el('div', 'k', 'Bag')); var bv = el('a', 'v', b.short_name); bv.href = '#' + slug(b.short_name); bv.style.cssText = 'display:block;color:inherit;text-decoration:none'; c1.appendChild(bv); hop.appendChild(c1);
      hop.appendChild(el('div', 'arrow', '→'));
      var c2 = el('div'); roasterCell(b, p, c2); hop.appendChild(c2);
      hop.appendChild(el('div', 'arrow', '→'));
      var c3 = el('div'); producerCell(b, p, c3); hop.appendChild(c3);
      host.appendChild(hop);
    });
    if (!bags.length) host.appendChild(el('p', 'empty', 'No bags logged.'));
  }

  /* ---------- origin: producers per country (emphasis bars) ---------- */
  function renderCountryBars() {
    var host = $('#country-bars'), rows = (D.origin.countries || []).slice(), onCounter = D.origin.counter_countries || [];
    if (!rows.length) { host.appendChild(el('p', 'empty', 'No origin data.')); return; }
    var total = rows.reduce(function (a, r) { return a + +r.producers; }, 0);
    var isMe = function (c) { return onCounter.indexOf(c) >= 0; };
    // top 10 by producers, plus any country that is in a logged bag even if it ranks lower; the rest fold into Other
    var top = rows.filter(function (r, i) { return i < CAP || isMe(r.country); }), rest = rows.filter(function (r) { return top.indexOf(r) < 0; });
    if (rest.length) top.push({ country: 'Other (' + rest.length + ' countries)', producers: rest.reduce(function (a, r) { return a + +r.producers; }, 0), roasters: null, other: true });
    var max = Math.max.apply(null, top.map(function (r) { return +r.producers; }));
    $('#country-sub').textContent = fmtInt(total) + ' producers with a live offering across the ' + fmtInt((D.origin.totals || {}).roasters) + ' roasters tracked, by country. ● and blue = a country in one of these bags.';
    top.forEach(function (r) {
      var me = !r.other && isMe(r.country);
      var lbl = el('div', 'lbl' + (me ? ' me' : ''), (me ? '● ' : '') + r.country), track = el('div', 'track'), i = el('i'); i.style.width = (100 * r.producers / max) + '%'; track.appendChild(i);
      if (me) i.style.background = 'var(--s1)';
      var num = el('div', 'n', fmtInt(r.producers));
      [lbl, track, num].forEach(function (x) { host.appendChild(x); });
      var text = r.country + ': ' + fmtInt(r.producers) + ' producers' + (r.roasters != null ? ' across ' + r.roasters + ' roasters' : '') + (me ? ' · in a logged bag' : '');
      [lbl, track, num].forEach(function (x) { bindTip(x, text); });
    });
  }

  /* ---------- tables, capped at the newest 10 with an expander ---------- */
  var EXPANDED = {};
  function renderTable(tbl, rows, cols, opts) {
    opts = opts || {};
    var thead = tbl.querySelector('thead'), tbody = tbl.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    var tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', c.num ? 'num' : '', c.label)); });
    thead.appendChild(tr);
    var more = opts.more ? $(opts.more) : null; if (more) more.innerHTML = '';
    if (!rows.length) { var e = el('tr'); var td = el('td', 'empty', 'Nothing here yet.'); td.colSpan = cols.length; e.appendChild(td); tbody.appendChild(e); return; }
    var open = !!EXPANDED[tbl.id], shown = open || rows.length <= CAP ? rows : rows.slice(0, CAP);
    shown.forEach(function (r) {
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
    if (more && rows.length > CAP) {
      more.appendChild(el('span', null, (open ? 'All ' + rows.length : (opts.lead || 'Newest') + ' ' + shown.length + ' of ' + rows.length) + ' ' + (opts.noun || 'rows')));
      var btn = el('button', null, open ? 'Show the ' + (opts.lead || 'newest').toLowerCase() + ' ' + CAP + ' only' : 'Show all ' + rows.length); btn.type = 'button';
      btn.addEventListener('click', function () { EXPANDED[tbl.id] = !open; renderTable(tbl, rows, cols, opts); var nb = more.querySelector('button'); if (nb) nb.focus(); });
      more.appendChild(btn);
    }
  }

  function renderShared() {
    var cols = [
      { key: 'name', label: 'Producer', render: function (td, r) { td.style.whiteSpace = 'nowrap'; td.textContent = (r.in_my_bags ? '● ' : '') + r.name; if (r.in_my_bags) td.style.fontWeight = '600'; } },
      { key: 'country', label: 'Country', render: function (td, r) { td.style.whiteSpace = 'nowrap'; td.textContent = r.country; } },
      { key: 'roasters', label: 'Roasters', num: true },
      { key: 'roasted_by', label: 'Roasted by', render: function (td, r) { td.style.cssText = 'min-width:44ch;overflow-wrap:anywhere'; td.textContent = (r.roasted_by || []).join(', '); } }
    ];
    renderTable($('#shared'), D.origin.shared_producers || [], cols, { more: '#shared-more', noun: 'producers, most roasters first', lead: 'Top' });
  }

  function renderRoasters() {
    var rows = (D.origin.roasters || []).slice(), max = Math.max.apply(null, rows.map(function (r) { return +r.offerings || 0; }).concat([1]));
    $('#roasters-sub').textContent = 'All ' + rows.length + ' roasters in the origin graph, the ones with a bag logged here first. ● and blue = a roaster with a bag logged here. Tables scroll sideways on a phone.';
    var cols = [
      { key: 'name', label: 'Roaster', render: function (td, r) { td.style.whiteSpace = 'nowrap'; if (r.in_my_bags) { td.appendChild(document.createTextNode('● ')); td.style.fontWeight = '600'; } var a = el('a', null, r.name); if (safeLink(a, r.website)) td.appendChild(a); else td.appendChild(document.createTextNode(r.name)); } },
      { key: 'city', label: 'City', render: function (td, r) { td.style.whiteSpace = 'nowrap'; td.textContent = [r.city, r.country].filter(Boolean).join(', '); } },
      { key: 'offerings', label: 'Live offerings', num: true, render: function (td, r) { var w = el('div'); w.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:flex-end'; var bar = el('div'); bar.style.cssText = 'height:8px;width:' + Math.round(80 * (+r.offerings || 0) / max) + 'px;background:' + (r.in_my_bags ? 'var(--s1)' : 'var(--deemph)') + ';border-radius:0 3px 3px 0'; w.appendChild(bar); w.appendChild(el('span', null, fmtInt(r.offerings))); td.appendChild(w); } },
      { key: 'producers', label: 'Producers', num: true, int: true }
    ];
    renderTable($('#roasters'), rows, cols, { more: '#roasters-more', noun: 'roasters, most live offerings first', lead: 'Top' });
  }

  var SHOT_COLS = [
    { key: 'shot_at', label: 'Date', date: true }, { key: 'bag', label: 'Bag' },
    { key: 'method', label: 'Method', render: function (td, r) { td.textContent = r.method === 'pourover' ? 'pourover' + ((r.data || {}).brewer ? ' · ' + r.data.brewer : '') : 'espresso'; } },
    { key: 'microns', label: 'Grind', num: true, render: function (td, r) { td.textContent = r.method === 'pourover' ? ((r.data || {}).grind_setting != null ? 'Ode ' + r.data.grind_setting : '') : (r.microns != null ? n(r.microns) + ' µm' : ''); } },
    { key: 'rpm', label: 'RPM', num: true },
    { key: 'dose_g', label: 'Dose (g)', num: true },
    { key: 'yield_g', label: 'Out (g)', num: true, render: function (td, r) { td.textContent = r.method === 'pourover' ? ((r.data || {}).water_g != null ? n(r.data.water_g) + ' water' : '') : n(r.yield_g); } },
    { key: 'time_s', label: 'Time (s)', num: true }, { key: 'ratio', label: 'Ratio', num: true, render: function (td, r) { var ratio = r.ratio; if (r.method === 'pourover' && ratio == null && (r.data || {}).water_g && r.dose_g) ratio = Math.round(10 * r.data.water_g / r.dose_g) / 10; td.textContent = ratio == null ? '' : (r.method === 'pourover' ? '1:' + n(ratio) : n(ratio)); } },
    { key: 'taste', label: 'Taste', wrap: true },
    { key: 'verdict', label: 'Verdict', wrap: true, render: function (td, r) { var v = r.verdict || ''; td.className += ' ' + verdictClass(v); if (r.status === 'queued') { td.className += ' v-open'; v = 'Queued' + (v ? ' — ' + v : ''); } td.textContent = v; } },
    { key: 'next_change', label: 'Next change', wrap: true }, { key: 'by_whom', label: 'By' }
  ];
  var onlySettled = false;
  function renderShots() {
    var bag = $('#bag-filter').value, rows = D.shots.slice();
    if (bag) rows = rows.filter(function (s) { return s.bag === bag; });
    if (onlySettled) rows = rows.filter(function (s) { return /dialed|settled/i.test(s.verdict || ''); });
    renderTable($('#shots'), rows, SHOT_COLS, { more: '#shots-more', noun: 'rows (pulled shots and queued plans, newest first)' });
    var plans = rows.filter(function (s) { return s.status === 'queued'; }).length;
    $('#log-count').textContent = (rows.length - plans) + ' shots' + (plans ? ' + ' + plans + ' queued plan' + (plans > 1 ? 's' : '') : '') + ' match, of ' + D.shots.length + ' rows';
  }
  function renderExperiments() {
    renderTable($('#exp'), D.experiments.slice(), [
      { key: 'run_on', label: 'Date', date: true }, { key: 'method', label: 'Method' }, { key: 'variable', label: 'Variable under test', wrap: true }, { key: 'held_constant', label: 'Held constant', wrap: true },
      { key: 'option_a', label: 'A', wrap: true }, { key: 'option_b', label: 'B', wrap: true }, { key: 'winner', label: 'Winner', wrap: true }, { key: 'notes', label: 'Notes', wrap: true }], { more: '#exp-more', noun: 'experiments' });
  }

  /* ---------- house rules (the glossary moved to the top of the page, 2026-10-30) ---------- */
  function renderReference() {
    var host = $('#reference'), sections = (D.rules.sections || []);
    var PO = D.rules.pourover;
    if (PO) {   // pourover house rules (kv coffee-dialin.pourover) — a panel beside the espresso sections
      var pp = el('div', 'panel'); pp.id = 'pourover'; pp.appendChild(el('h3', null, 'Pourover — ' + (PO.grinder || 'grinder')));
      var pd = el('dl');
      var add = function (k, v) { if (v == null || v === '') return; pd.appendChild(el('dt', null, k)); pd.appendChild(el('dd', null, String(v))); };
      add('Setting', PO.setting_range + (PO.rule ? ' — ' + PO.rule : ''));
      add('Ratio', PO.ratio);
      add('Scoop', PO.scoop_g != null ? '~' + PO.scoop_g + ' g' + (PO.scoop_note && /INFERRED/.test(PO.scoop_note) ? ' (inferred, not yet weighed)' : '') : null);
      (PO.brewers || []).forEach(function (b) { add(b.name, [b.scoops != null ? b.scoops + ' scoop' + (String(b.scoops) === '1' ? '' : 's') : null, b.coffee_g ? b.coffee_g + ' g' : null, b.water, b.use].filter(Boolean).join(' · ')); });
      pp.appendChild(pd); host.appendChild(pp);
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
        var a = el('a', null, val.replace(/^https?:\/\//, '')); if (safeLink(a, val)) dd.appendChild(a);
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
  function safe(name, fn) {   // one broken section never blanks the rest; the failure is written where the section would be
    try { fn(); } catch (e) {
      var host = $(name); var msg = el('p', 'empty', 'This section failed to render: ' + (e && e.message ? e.message : e));
      if (host) host.appendChild(msg); else document.querySelector('.wrap').appendChild(msg);
      if (window.console) console.error(name, e);
    }
  }
  if (!window.DIALIN || !D.generated_at) {
    var warnBox = el('div', 'panel', 'The data file did not load (data/log.js). The page cannot show recipes or shots until the hourly publish runs again.');
    warnBox.style.cssText = 'border-color:var(--critical);color:var(--critical)';
    document.querySelector('.wrap').insertBefore(warnBox, document.querySelector('header').nextSibling);
    return;
  }
  safe('#bag-chips', renderChips); safe('#glossary', renderGlossary);
  if (PAGE === 'bags') {
    $('#bags-count').textContent = D.bags.length + ' bags logged · house beans first, then newest first';
    safe('#recipe-grid', function () { renderRecipes(D.bags, true); });
  } else {
    var shown = D.bags.slice(0, CAP);
    var sel = $('#bag-filter');
    D.bags.forEach(function (b) { var o = el('option', null, b.short_name); o.value = b.short_name; sel.appendChild(o); });
    sel.addEventListener('change', renderShots);
    $('#only-settled').addEventListener('click', function () { onlySettled = !onlySettled; this.setAttribute('aria-pressed', String(onlySettled)); renderShots(); });
    safe('#tiles', renderHealth);
    safe('#recipe-grid', function () { renderRecipes(shown, false); });
    $('#recipes-q').textContent = (D.bags.length > CAP ? shown.length + ' of ' + D.bags.length + ' bags here, house beans first then newest; the rest are on the bags page. ' : '') + 'Each card\u2019s queue is newest plan first; a pulled shot clears its entry.';
    var foot = $('#recipes-foot');
    foot.appendChild(el('span', null, D.bags.length > CAP ? shown.length + ' of ' + D.bags.length + ' bags shown' : D.bags.length + ' bags'));
    var all = el('a', null, 'All bags, each traced to roaster and producer →'); all.href = 'bags.html'; foot.appendChild(all);
    safe('#water-panel', renderWater); safe('#chain', function () { renderChain(shown); }); safe('#country-bars', renderCountryBars); safe('#shared', renderShared); safe('#roasters', renderRoasters);
    safe('#shots', renderShots); safe('#exp', renderExperiments); safe('#reference', renderReference);
  }
})();
