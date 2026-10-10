/* Coffee Dial-In — renders data/log.js, the public export of Postgres (coffee_bags,
   coffee_shots, coffee_experiments, kv coffee-dialin). Nothing here knows a grind
   setting; every number comes from the database. */
(function () {
  'use strict';
  var D = window.DIALIN || { bags: [], shots: [], experiments: [], rules: {}, generated_at: '' };
  var $ = function (s) { return document.querySelector(s); };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return String(iso).slice(0, 10);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function n(v) { return v == null || v === '' ? '' : String(+v); }
  function verdictClass(v) {
    var t = (v || '').toLowerCase();
    if (/dialed|settled/.test(t)) return 'v-good';
    if (/choke|gush|too |way too|hollow|bitter|sour|messy|slow|fast/.test(t)) return 'v-bad';
    return '';
  }

  /* ---------- current recipes: one card per bag ---------- */
  function renderRecipes() {
    var grid = $('#recipe-grid');
    if (!D.bags.length) { grid.appendChild(el('p', 'empty', 'No bags logged yet.')); return; }
    D.bags.forEach(function (b) {
      var d = (b.data || {}), di = d.dialin || {};
      var card = el('div', 'card recipe');
      var head = el('div');
      head.appendChild(el('div', 'bag', b.short_name));
      var who = [d.roaster, d.process].filter(Boolean).join(' · ');
      if (who) head.appendChild(el('div', 'roaster', who));
      card.appendChild(head);
      card.appendChild(el('span', 'status ' + (di.settled ? 'settled' : 'open'), di.settled ? 'Settled' : 'Dialing in'));

      var um = di.settled ? di.microns : (b.queued && b.queued.microns) || (b.last_shot && b.last_shot.microns) || (di.start && di.start.microns);
      var rpm = di.settled ? di.rpm : (b.queued && b.queued.rpm) || (b.last_shot && b.last_shot.rpm) || (di.start && di.start.rpm);
      var dial = el('div', 'dial');
      if (um) { var a = el('div'); a.appendChild(el('span', 'big mono', n(um))); a.appendChild(el('span', 'unit', 'µm')); dial.appendChild(a); }
      if (rpm) { var r = el('div'); r.appendChild(el('span', 'big mono', n(rpm))); r.appendChild(el('span', 'unit', 'rpm')); dial.appendChild(r); }
      if (dial.children.length) card.appendChild(dial);

      if (di.settled) {
        if (di.recipe) card.appendChild(el('p', 'line', di.recipe));
      } else {
        if (b.queued) card.appendChild(el('p', 'line', 'Next shot planned: ' + [b.queued.microns && n(b.queued.microns) + ' µm', b.queued.rpm && n(b.queued.rpm) + ' rpm'].filter(Boolean).join(' at ') + (b.queued.next_change ? ' — ' + b.queued.next_change : '')));
        else if (di.start) card.appendChild(el('p', 'line', 'Start here: ' + [di.start.microns && n(di.start.microns) + ' µm', di.start.rpm && n(di.start.rpm) + ' rpm'].filter(Boolean).join(' at ') + (di.start_note ? ' — ' + di.start_note : '')));
        else if (di.start_note) card.appendChild(el('p', 'line', di.start_note));
        if (b.last_shot) {
          var l = b.last_shot, bits = [];
          if (l.dose_g && l.yield_g) bits.push(n(l.dose_g) + ' g → ' + n(l.yield_g) + ' g');
          if (l.time_s) bits.push(n(l.time_s) + ' s');
          card.appendChild(el('p', 'line small muted', 'Last shot ' + fmtDate(l.shot_at) + ': ' + n(l.microns) + ' µm at ' + n(l.rpm) + ' rpm' + (bits.length ? ', ' + bits.join(', ') : '') + (l.verdict ? '. ' + l.verdict : '')));
          if (l.next_change && !b.queued) card.appendChild(el('p', 'line small', 'Next: ' + l.next_change));
        } else if (!di.start && !di.start_note) card.appendChild(el('p', 'line small muted', 'No shots logged yet.'));
      }
      if (b.verdict) card.appendChild(el('p', 'line small muted', 'Verdict: ' + b.verdict));
      card.appendChild(el('p', 'small muted', b.shots + (b.shots === 1 ? ' shot' : ' shots') + ' logged' + (d.opened ? ' · opened ' + fmtDate(d.opened) : '')));
      grid.appendChild(card);
    });
  }

  /* ---------- house rules: kv coffee-dialin sections ---------- */
  function renderReference() {
    var host = $('#reference');
    var R = D.rules || {};
    var sections = R.sections || [];
    sections.forEach(function (sec) {
      var card = el('div', 'card');
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

  /* ---------- tables ---------- */
  function renderTable(tbl, rows, cols, opts) {
    opts = opts || {};
    var thead = tbl.querySelector('thead'), tbody = tbl.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    var tr = el('tr');
    cols.forEach(function (c) { tr.appendChild(el('th', opts.numeric && opts.numeric.indexOf(c.key) >= 0 ? 'num' : '', c.label)); });
    thead.appendChild(tr);
    if (!rows.length) { var e = el('tr'); var td = el('td', 'empty', 'Nothing here yet.'); td.colSpan = cols.length; e.appendChild(td); tbody.appendChild(e); return; }
    rows.forEach(function (r) {
      var row = el('tr');
      cols.forEach(function (c) {
        var v = r[c.key] == null ? '' : r[c.key];
        var isNum = opts.numeric && opts.numeric.indexOf(c.key) >= 0;
        var td = el('td', isNum ? 'num' : (opts.wrap && opts.wrap.indexOf(c.key) >= 0 ? 'wrap' : ''));
        if (c.key === 'shot_at' || c.key === 'run_on') v = fmtDate(v);
        else if (isNum) v = n(v);
        if (c.key === 'verdict') { td.className += ' ' + verdictClass(v); if (r.status === 'queued') { td.className += ' v-open'; v = 'Queued' + (v ? ' — ' + v : ''); } }
        td.textContent = v;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  }

  var SHOT_COLS = [
    { key: 'shot_at', label: 'Date' }, { key: 'bag', label: 'Bag' }, { key: 'microns', label: 'µm' }, { key: 'rpm', label: 'RPM' },
    { key: 'dose_g', label: 'Dose (g)' }, { key: 'yield_g', label: 'Yield (g)' }, { key: 'time_s', label: 'Time (s)' }, { key: 'ratio', label: 'Ratio' },
    { key: 'taste', label: 'Taste' }, { key: 'verdict', label: 'Verdict' }, { key: 'next_change', label: 'Next change' }, { key: 'by_whom', label: 'By' }
  ];
  var SHOT_NUM = ['microns', 'rpm', 'dose_g', 'yield_g', 'time_s', 'ratio'];
  var onlySettled = false;

  function renderShots() {
    var bag = $('#bag-filter').value;
    var rows = D.shots.slice();   // export order is newest first
    if (bag) rows = rows.filter(function (s) { return s.bag === bag; });
    if (onlySettled) rows = rows.filter(function (s) { return /dialed|settled/i.test(s.verdict || ''); });
    renderTable($('#shots'), rows, SHOT_COLS, { numeric: SHOT_NUM, wrap: ['taste', 'verdict', 'next_change'] });
    $('#log-count').textContent = rows.length + ' of ' + D.shots.length + ' shots';
  }

  function renderExperiments() {
    var cols = [{ key: 'run_on', label: 'Date' }, { key: 'method', label: 'Method' }, { key: 'variable', label: 'Variable under test' },
      { key: 'held_constant', label: 'Held constant' }, { key: 'option_a', label: 'A' }, { key: 'option_b', label: 'B' }, { key: 'winner', label: 'Winner' }, { key: 'notes', label: 'Notes' }];
    renderTable($('#exp'), D.experiments.slice(), cols, { wrap: cols.map(function (c) { return c.key; }) });
  }

  /* ---------- boot ---------- */
  var sel = $('#bag-filter');
  D.bags.forEach(function (b) { var o = el('option', null, b.short_name); o.value = b.short_name; sel.appendChild(o); });
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
