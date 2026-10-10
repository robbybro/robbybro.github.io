/* Coffee Dial-In — renders data/log.js (a copy of the dial-in sheet) into the page.
   Nothing here knows a grind setting; every number comes from the sheet. */
(function () {
  'use strict';
  var D = window.DIALIN || { shots: [], bags: [], experiments: [], reference: [], generated_at: '' };
  var $ = function (s) { return document.querySelector(s); };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function isNum(s) { return /^-?\d+(\.\d+)?$/.test(String(s).trim()); }
  function parseDate(s) {           // sheet dates arrive as M/D/YYYY
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s).trim());
    return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null;
  }
  function fmtDate(s) {
    var d = parseDate(s);
    if (!d) return s;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function verdictClass(v) {
    var t = (v || '').toLowerCase();
    if (/dialed|settled/.test(t)) return 'v-good';
    if (/queued/.test(t)) return 'v-open';
    if (/choke|gush|too |way too|hollow|bitter|sour|messy|slow|fast/.test(t)) return 'v-bad';
    return '';
  }
  function settledShot(v) { return /dialed|settled/i.test(v || ''); }

  /* ---------- current recipes: one card per bag ---------- */
  function latestShotFor(bag) {
    var rows = D.shots.filter(function (s) { return s.Bag === bag; });
    // newest first: by date, then by sheet order within a day (later rows are later shots)
    rows.sort(function (a, b) { var d = (parseDate(b.Date) || 0) - (parseDate(a.Date) || 0); return d || (D.shots.indexOf(b) - D.shots.indexOf(a)); });
    var isQueued = function (r) { return /queued/i.test(r.Verdict) || /^\s*queued/i.test(r['Next change'] || ''); };
    var queued = rows.find(isQueued);
    var real = rows.find(function (r) { return !isQueued(r) && (r['µm'] || r.RPM); });
    return { latest: real || rows[0] || null, queued: queued || null, count: rows.length };
  }

  function renderRecipes() {
    var grid = $('#recipe-grid');
    if (!D.bags.length) { grid.appendChild(el('p', 'empty', 'No bags logged yet.')); return; }
    var bags = D.bags.slice().sort(function (a, b) { return (parseDate(b.Opened) || 0) - (parseDate(a.Opened) || 0); });
    bags.forEach(function (b) {
      var card = el('div', 'card recipe');
      var settled = !!(b['Settled µm'] || '').trim();
      var head = el('div');
      head.appendChild(el('div', 'bag', b.Bag));
      var who = [b.Roaster, b['Beans / Process']].filter(Boolean).join(' · ');
      if (who) head.appendChild(el('div', 'roaster', who));
      card.appendChild(head);

      var status = el('span', 'status ' + (settled ? 'settled' : 'open'), settled ? 'Settled' : 'Dialing in');
      card.appendChild(status);

      var info = latestShotFor(b.Bag);
      var dial = el('div', 'dial');
      var um = settled ? b['Settled µm'] : (info.queued && info.queued['µm']) || (info.latest && info.latest['µm']) || '';
      var rpmFromRecipe = /(\d{3,4})\s*RPM/i.exec(b['Settled recipe'] || '');
      var rpm = settled && rpmFromRecipe ? rpmFromRecipe[1] : (info.queued && info.queued.RPM) || (info.latest && info.latest.RPM) || '';
      if (um) { var a = el('div'); a.appendChild(el('span', 'big mono', um)); a.appendChild(el('span', 'unit', 'µm')); dial.appendChild(a); }
      if (rpm) { var r = el('div'); r.appendChild(el('span', 'big mono', rpm)); r.appendChild(el('span', 'unit', 'rpm')); dial.appendChild(r); }
      if (dial.children.length) card.appendChild(dial);

      if (settled) {
        card.appendChild(el('p', 'line', b['Settled recipe']));
      } else {
        if (info.queued) card.appendChild(el('p', 'line', 'Next shot planned: ' + [info.queued['µm'] && info.queued['µm'] + ' µm', info.queued.RPM && info.queued.RPM + ' rpm'].filter(Boolean).join(' at ') + (info.queued['Next change'] ? ' — ' + info.queued['Next change'].replace(/^\s*queued\s*[—–-]*\s*/i, '') : '')));
        if (info.latest && info.latest !== info.queued) {
          var l = info.latest;
          var bits = [];
          if (l['Dose (g)'] && l['Yield (g)']) bits.push(l['Dose (g)'] + ' g → ' + l['Yield (g)'] + ' g');
          if (l['Time (s)']) bits.push(l['Time (s)'] + ' s');
          card.appendChild(el('p', 'line small muted', 'Last shot ' + fmtDate(l.Date) + ': ' + l['µm'] + ' µm at ' + l.RPM + ' rpm' + (bits.length ? ', ' + bits.join(', ') : '') + (l.Verdict ? '. ' + l.Verdict : '')));
          if (l['Next change'] && !info.queued) card.appendChild(el('p', 'line small', 'Next: ' + l['Next change']));
        }
        if (!info.latest && b['Settled recipe']) card.appendChild(el('p', 'line', b['Settled recipe']));
        if (!info.latest && !b['Settled recipe']) card.appendChild(el('p', 'line small muted', 'No shots logged yet.'));
      }
      if (b.Verdict) card.appendChild(el('p', 'line small muted', 'Verdict: ' + b.Verdict));
      card.appendChild(el('p', 'small muted', info.count + (info.count === 1 ? ' shot' : ' shots') + ' logged' + (b.Opened ? ' · opened ' + fmtDate(b.Opened) : '')));
      grid.appendChild(card);
    });
  }

  /* ---------- reference tab: blocks separated by blank rows ---------- */
  function renderReference() {
    var host = $('#reference');
    var rows = D.reference || [];
    var blocks = [], cur = [];
    rows.forEach(function (r) {
      var blank = !r.some(function (c) { return String(c).trim(); });
      if (blank) { if (cur.length) blocks.push(cur); cur = []; } else cur.push(r);
    });
    if (cur.length) blocks.push(cur);
    blocks.forEach(function (blk) {
      var card = el('div', 'card');
      var first = blk[0];
      var heading = first[0], headVal = (first[1] || '').trim();
      var isHeader = heading === heading.toUpperCase() || blk.length === 1 || !headVal;
      card.appendChild(el('h3', null, heading.replace(/\s*\(.*\)\s*$/, function (m) { return m; })));
      var dl = el('dl');
      var body = isHeader ? blk.slice(1) : blk;
      if (isHeader && headVal && headVal !== '#ERROR!') dl.appendChild(el('dd', null, headVal));
      body.forEach(function (r) {
        var label = (r[0] || '').trim(), val = (r[1] || '').trim(), note = (r[2] || '').trim();
        if (val === '#ERROR!') val = '';
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
    if (!blocks.length) host.appendChild(el('p', 'empty', 'No house rules logged yet.'));
  }

  /* ---------- tables ---------- */
  function renderTable(tbl, rows, cols, opts) {
    opts = opts || {};
    var thead = tbl.querySelector('thead'), tbody = tbl.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    var tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', opts.numeric && opts.numeric.indexOf(c) >= 0 ? 'num' : '', c)); });
    thead.appendChild(tr);
    if (!rows.length) { var e = el('tr'); var td = el('td', 'empty', 'Nothing here yet.'); td.colSpan = cols.length; e.appendChild(td); tbody.appendChild(e); return; }
    rows.forEach(function (r) {
      var row = el('tr');
      cols.forEach(function (c) {
        var v = r[c] == null ? '' : r[c];
        var td = el('td', opts.numeric && opts.numeric.indexOf(c) >= 0 ? 'num' : (opts.wrap && opts.wrap.indexOf(c) >= 0 ? 'wrap' : ''));
        if (c === 'Date') v = fmtDate(v);
        if (c === 'Verdict') td.className += ' ' + verdictClass(v);
        td.textContent = v;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  var SHOT_COLS = ['Date', 'Bag', 'µm', 'RPM', 'Dose (g)', 'Yield (g)', 'Time (s)', 'Ratio', 'Taste', 'Verdict', 'Next change'];
  var SHOT_NUM = ['µm', 'RPM', 'Dose (g)', 'Yield (g)', 'Time (s)', 'Ratio'];
  var onlySettled = false;

  function renderShots() {
    var bag = $('#bag-filter').value;
    var rows = D.shots.slice();
    if (bag) rows = rows.filter(function (s) { return s.Bag === bag; });
    if (onlySettled) rows = rows.filter(function (s) { return settledShot(s.Verdict); });
    rows.sort(function (a, b) { return (parseDate(b.Date) || 0) - (parseDate(a.Date) || 0); });
    // same-day order in the sheet is chronological; newest-first within a day = reverse sheet order
    var byDay = {};
    rows.forEach(function (r, i) { r.__i = D.shots.indexOf(r); });
    rows.sort(function (a, b) { var d = (parseDate(b.Date) || 0) - (parseDate(a.Date) || 0); return d || (b.__i - a.__i); });
    renderTable($('#shots'), rows, SHOT_COLS, { numeric: SHOT_NUM, wrap: ['Taste', 'Verdict', 'Next change'] });
    $('#log-count').textContent = rows.length + ' of ' + D.shots.length + ' shots';
  }

  function renderExperiments() {
    var cols = ['Date', 'Method', 'Variable under test', 'Held constant', 'A', 'B', 'Winner', 'Notes'];
    var rows = D.experiments.slice().reverse();
    renderTable($('#exp'), rows, cols, { wrap: cols });
  }

  /* ---------- boot ---------- */
  var sel = $('#bag-filter');
  var bagNames = [];
  D.shots.forEach(function (s) { if (s.Bag && bagNames.indexOf(s.Bag) < 0) bagNames.push(s.Bag); });
  bagNames.forEach(function (b) { var o = el('option', null, b); o.value = b; sel.appendChild(o); });
  sel.addEventListener('change', renderShots);
  $('#only-settled').addEventListener('click', function () {
    onlySettled = !onlySettled; this.setAttribute('aria-pressed', String(onlySettled)); renderShots();
  });

  renderRecipes();
  renderReference();
  renderShots();
  renderExperiments();
  if (D.generated_at) {
    var g = new Date(D.generated_at);
    $('#generated').textContent = 'Last refreshed ' + (isNaN(g) ? D.generated_at : g.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(' AM', 'am').replace(' PM', 'pm')) + ' Pacific.';
  }
})();
