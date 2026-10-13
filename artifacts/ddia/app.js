/* DDIA study site: hash router + renderers. Content lives in content/*.js as window.DDIA. */
(function(){
  var D = window.DDIA || {chapters:[], viz:[], system:null};
  var KEY = "ddia.got.v1";
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function got(){ try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; } }
  function setGot(id, v){ var g = got(); if (v) g[id] = 1; else delete g[id]; try{ localStorage.setItem(KEY, JSON.stringify(g)); }catch(e){} }
  function chapter(n){ return D.chapters.filter(function(c){ return String(c.n) === String(n); })[0]; }

  /* ---------- route parsing ---------- */
  function route(){
    var h = location.hash.replace(/^#\/?/, ""), p = h.split("/").filter(Boolean);
    if (!p.length) return {page:"home"};
    if (p[0] === "ch" && p[1]) return {page:"ch", n:p[1], sec:p[2] || null, item:p[3] || null};
    if (p[0] === "viz") return {page:"viz", slug:p[1] || null};
    if (p[0] === "onepager") return {page:"onepager", sec:p[1] || null};
    if (p[0] === "reading") return {page:"reading", slug:p[1] || null, sec:p[2] || null};
    if (p[0] === "glossary") return {page:"glossary"};
    return {page:"home"};
  }

  /* ---------- top nav + sidebar ---------- */
  function renderNav(r){
    var items = [["#/", "Overview", r.page === "home"]];
    D.chapters.forEach(function(c){ items.push(["#/ch/" + c.n, "Ch. " + c.n, r.page === "ch" && String(r.n) === String(c.n)]); });
    items.push(["#/viz", "Visualizations", r.page === "viz"]);
    if (D.onepager) items.push(["#/onepager", "One-pager", r.page === "onepager"]);
    if (D.reading) items.push(["#/reading", "Reading", r.page === "reading"]);
    items.push(["#/glossary", "Glossary", r.page === "glossary"]);
    $("topnav").innerHTML = items.map(function(i){ return '<a href="' + i[0] + '"' + (i[2] ? ' class="on"' : "") + '>' + esc(i[1]) + '</a>'; }).join("");
  }
  function renderSide(r){
    var h = "";
    D.chapters.forEach(function(c){
      var on = r.page === "ch" && String(r.n) === String(c.n);
      h += '<div class="grp"><span>Chapter ' + c.n + '</span><a href="#/ch/' + c.n + '"' + (on && !r.sec ? ' class="on"' : "") + '>' + esc(c.title) + '</a>';
      if (on){
        h += '<a class="sub' + (r.sec === "jargon" ? " on" : "") + '" href="#/ch/' + c.n + '/jargon">Jargon</a>';
        c.sections.forEach(function(s){ h += '<a class="sub' + (r.sec === s.id ? " on" : "") + '" href="#/ch/' + c.n + '/' + s.id + '">' + esc(s.title) + '</a>'; });
        h += '<a class="sub' + (r.sec === "takeaways" ? " on" : "") + '" href="#/ch/' + c.n + '/takeaways">Ten takeaways</a>';
      }
      h += '</div>';
    });
    h += '<div class="grp"><span>Visualizations</span>';
    D.viz.forEach(function(v){ h += '<a href="#/viz/' + v.slug + '"' + (r.page === "viz" && r.slug === v.slug ? ' class="on"' : "") + '>' + esc(v.title) + '</a>'; });
    h += '</div>';
    if (D.onepager){
      h += '<div class="grp"><span>One-pager</span><a href="#/onepager"' + (r.page === "onepager" && !r.sec ? ' class="on"' : "") + '>System design</a>';
      D.onepager.sections.forEach(function(sx){ h += '<a class="sub' + (r.page === "onepager" && r.sec === sx.id ? " on" : "") + '" href="#/onepager/' + sx.id + '">' + esc(sx.title.split(/ — |: /)[0]) + '</a>'; });
      h += '</div>';
    }
    if (D.reading){
      h += '<div class="grp"><span>Reading</span><a href="#/reading"' + (r.page === "reading" && !r.slug ? ' class="on"' : "") + '>The manager books</a>';
      D.reading.books.forEach(function(b){
        var on = r.page === "reading" && r.slug === b.slug;
        h += '<a href="#/reading/' + b.slug + '"' + (on && !r.sec ? ' class="on"' : "") + '>' + esc(b.book) + '</a>';
        if (on) b.sections.forEach(function(sx){ h += '<a class="sub' + (r.sec === sx.id ? " on" : "") + '" href="#/reading/' + b.slug + '/' + sx.id + '">' + esc(sx.title.split(/ — |: /)[0]) + '</a>'; });
      });
      h += '</div>';
    }
    h += '<div class="grp"><span>Glossary</span><a href="#/glossary"' + (r.page === "glossary" ? ' class="on"' : "") + '>Every term, one list</a></div>';
    $("side").innerHTML = h;
  }

  /* ---------- cards ---------- */
  function card(c, sec, it, i){
    var id = "ch" + c.n + "-" + sec.id + "-" + (i+1), g = got()[id];
    var body = it.a || "";
    if (it.when || it.breaks){
      body += '<p><b>When you choose it.</b> ' + (it.when || "") + '</p>';
      if (it.breaks) body += '<p><b>Where it breaks.</b></p><ol>' + it.breaks.map(function(b){ return '<li>' + b + '</li>'; }).join("") + '</ol>';
    }
    if (it.followups && it.followups.length){
      body += '<div class="fu">' + it.followups.map(function(f){ return '<div class="fu-q"><b>Follow-up.</b> ' + f.q + '</div><div class="fu-a">' + f.a + '</div>'; }).join("") + '</div>';
    }
    if (it.line) body += '<div class="line"><b>The line:</b> ' + it.line + '</div>';
    return '<article class="card' + (g ? " got" : "") + '" id="' + id + '" data-id="' + id + '">' +
      '<div class="q"><span class="n">' + (i+1) + '</span><span class="t">' + it.q + '</span></div>' +
      '<div class="a">' + body + '</div>' +
      '<div class="foot"><a href="#/ch/' + c.n + '/' + sec.id + '/' + (i+1) + '" class="prog">link</a><button type="button" class="got-btn' + (g ? " on" : "") + '">' + (g ? "✓ got it" : "mark got it") + '</button></div>' +
    '</article>';
  }
  function bindCards(root){
    root.querySelectorAll(".card").forEach(function(el){
      var btn = el.querySelector(".got-btn");
      if (!btn) return;  // link cards (viz list, reading hub) have no question/answer parts
      btn.addEventListener("click", function(){
        var on = !el.classList.contains("got"); el.classList.toggle("got", on); this.classList.toggle("on", on); this.textContent = on ? "✓ got it" : "mark got it"; setGot(el.dataset.id, on); updateProg();
      });
    });
  }
  function updateProg(){
    var g = got();
    document.querySelectorAll("[data-prog]").forEach(function(el){
      var ids = el.dataset.prog.split(","), n = ids.filter(function(i){ return g[i]; }).length;
      el.textContent = n + " / " + ids.length + " got";
    });
  }
  function sectionBlock(c, s){
    var ids = s.items.map(function(_, i){ return "ch" + c.n + "-" + s.id + "-" + (i+1); }).join(",");
    return '<section class="blk" id="sec-' + s.id + '"><div class="blk-head"><div><h2>' + esc(s.title) + '</h2>' + (s.intro ? '<p class="muted" style="margin:4px 0 0;max-width:80ch">' + s.intro + '</p>' : "") + '</div>' +
      '<div class="tools"><span class="prog" data-prog="' + ids + '"></span></div></div>' +
      s.items.map(function(it, i){ return card(c, s, it, i); }).join("") + '</section>';
  }

  /* ---------- pages ---------- */
  function pageHome(){
    var h = '<div class="hero"><span class="kicker">Designing Data-Intensive Applications · 2nd edition</span><h1>Study site</h1>' +
      '<p>One section per chapter: the jargon defined once, then the chapter worked as a design round on one real system, a messaging system for a billion daily users, with the follow-ups an interviewer would push on, and ten takeaways. Interactive visualizations live under their own tab.</p>' +
      '<div class="chips">' + D.chapters.map(function(c){ return '<a class="chip" href="#/ch/' + c.n + '">Ch. ' + c.n + ' · ' + esc(c.title) + '</a>'; }).join("") + D.viz.map(function(v){ return '<a class="chip" href="#/viz/' + v.slug + '">▶ ' + esc(v.title) + '</a>'; }).join("") +
      (D.reading ? D.reading.books.map(function(b){ return '<a class="chip" href="#/reading/' + b.slug + '">📖 ' + esc(b.book) + '</a>'; }).join("") : "") + '<a class="chip" href="#/glossary">Glossary</a></div></div>';
    h += '<section class="blk"><h2>How to use it</h2><ul><li>Each chapter is one round of the same interview. Read the prompt, answer it out loud, then read the answer and the follow-ups. Mark a card <b>got it</b> once you can give the answer cold; the tick is stored in this browser.</li><li>Answers are concise on purpose: the mechanism, the number, the tradeoff, the sentence to say. The jargon table above each round defines the terms once.</li><li>Every question has a direct link, so a card can be sent to a phone or a future session.</li><li><b>Reading</b> holds one page per manager book (the models and the vocabulary, not the worksheets), and <b>Glossary</b> merges the jargon from every chapter with those terms into one filterable list.</li></ul></section>';
    var g = got(), total = 0, done = 0;
    D.chapters.forEach(function(c){ c.sections.forEach(function(s){ s.items.forEach(function(_, i){ total++; if (g["ch" + c.n + "-" + s.id + "-" + (i+1)]) done++; }); }); });
    h += '<section class="blk"><h2>Progress</h2><p>' + done + ' of ' + total + ' cards marked got it.</p></section>';
    return h;
  }
  function pageChapter(r){
    var c = chapter(r.n); if (!c) return '<p>No such chapter.</p>';
    var h = '<div class="hero"><span class="kicker">Chapter ' + c.n + '</span><h1>' + esc(c.title) + '</h1><p>' + c.why + '</p>' +
      '<div class="chips"><a class="chip" href="#/ch/' + c.n + '/jargon">Jargon</a>' + c.sections.map(function(s){ return '<a class="chip" href="#/ch/' + c.n + '/' + s.id + '">' + esc(s.title) + '</a>'; }).join("") +
      '<a class="chip" href="#/ch/' + c.n + '/takeaways">Ten takeaways</a>' + (c.worksheet ? '<a class="chip" href="' + c.worksheet + '" target="_blank" rel="noopener">Worksheet Doc ↗</a>' : "") + '</div></div>';
    h += '<section class="blk" id="sec-jargon"><h2>Jargon, defined once</h2><div class="tbl"><table class="jarg"><thead><tr><th>Term</th><th>Plain meaning</th></tr></thead><tbody>' +
      c.jargon.map(function(j){ return '<tr><td>' + j[0] + '</td><td>' + j[1] + '</td></tr>'; }).join("") + '</tbody></table></div></section>';
    c.sections.forEach(function(s){ h += sectionBlock(c, s); });
    h += '<section class="blk" id="sec-takeaways"><h2>Ten takeaways</h2><ol class="take">' + c.takeaways.map(function(t){ return '<li>' + t + '</li>'; }).join("") + '</ol></section>';
    return h;
  }
  function pageViz(r){
    if (r.slug){
      var v = D.viz.filter(function(x){ return x.slug === r.slug; })[0]; if (!v) return '<p>No such visualization.</p>';
      return '<div class="blk-head"><div><h1>' + esc(v.title) + '</h1><p class="muted" style="margin:4px 0 0">' + v.blurb + ' <a href="' + v.path + '" target="_blank" rel="noopener">Open full screen ↗</a></p></div></div>' +
        '<iframe class="viz-frame" src="' + v.path + '" title="' + esc(v.title) + '"></iframe>';
    }
    return '<div class="hero"><span class="kicker">Visualizations</span><h1>Interactive</h1><p>Mechanisms from the chapters you can step through.</p></div><div class="viz-list">' +
      D.viz.map(function(v){ return '<a class="card" href="#/viz/' + v.slug + '"><h3>' + esc(v.title) + '</h3><p class="muted" style="margin:0">' + v.blurb + '</p><p class="prog" style="margin:6px 0 0">Chapter ' + v.chapter + '</p></a>'; }).join("") + '</div>';
  }

  function pageOnepager(){
    var o = D.onepager;
    var toc = o.sections.map(function(sx){ return '<a class="chip" href="#/onepager/' + sx.id + '">' + esc(sx.title.split(/ — |: /)[0]) + '</a>'; }).join("");
    var h = '<div class="hero"><span class="kicker">One-pager · after the book</span><h1>System design, on one sheet</h1><p>' + o.intro + '</p><div class="chips" style="margin-top:12px">' + toc + '</div></div>';
    h += '<div class="sheet">';
    o.sections.forEach(function(sx){ h += '<section class="blk" id="sec-' + sx.id + '"><h2>' + esc(sx.title) + '</h2>' + sx.html + '</section>'; });
    h += '</div>';
    return h;
  }

  function book(slug){ return (D.reading ? D.reading.books : []).filter(function(b){ return b.slug === slug; })[0]; }
  function pageReading(r){
    if (r.slug){
      var b = book(r.slug); if (!b) return '<p>No such book.</p>';
      var toc = b.sections.map(function(sx){ return '<a class="chip" href="#/reading/' + b.slug + '/' + sx.id + '">' + esc(sx.title.split(/ — |: /)[0]) + '</a>'; }).join("");
      var h = '<div class="hero"><span class="kicker">' + esc(b.kind) + ' · ' + esc(b.author) + '</span><h1>' + esc(b.book) + '</h1>' + (b.intro ? b.intro : "") + '<div class="chips" style="margin-top:12px">' + toc + '</div></div><div class="sheet">';
      b.sections.forEach(function(sx){ h += '<section class="blk" id="sec-' + sx.id + '"><h2>' + esc(sx.title) + '</h2>' + sx.html + '</section>'; });
      return h + '</div>';
    }
    var hh = '<div class="hero"><span class="kicker">Reading · the manager books</span><h1>One page each</h1><p>The books around the design book, compressed to the part that gets used in a manager loop: the vocabulary, the models, the sentences. The fill-in worksheets that go with them live in Google Docs; this is the index and the notes.</p></div><div class="viz-list">';
    D.reading.books.forEach(function(b){
      hh += '<a class="card" href="#/reading/' + b.slug + '"><h3>' + esc(b.book) + '</h3><p class="muted" style="margin:0">' + esc(b.author) + ' · ' + esc(b.kind) + ' · ' + b.sections.length + ' sections · ' + b.glossary.length + ' terms</p></a>';
    });
    return hh + '</div>';
  }
  function glossaryRows(){
    var rows = [];
    D.chapters.forEach(function(c){ c.jargon.forEach(function(j){ rows.push({term:j[0], meaning:j[1], src:"Ch. " + c.n, href:"#/ch/" + c.n + "/jargon"}); }); });
    if (D.reading) D.reading.books.forEach(function(b){ b.glossary.forEach(function(g){ rows.push({term:g.term, meaning:g.meaning, src:b.book, href:"#/reading/" + b.slug}); }); });
    function key(t){ return t.replace(/<[^>]+>/g, "").replace(/^["'“‘]+/, "").toLowerCase(); }
    rows.sort(function(a, b){ var x = key(a.term), y = key(b.term); return x < y ? -1 : x > y ? 1 : 0; });
    return rows;
  }
  function pageGlossary(){
    var rows = glossaryRows();
    var h = '<div class="hero"><span class="kicker">Glossary</span><h1>Every term, one list</h1><p>The jargon tables from every chapter and the terms from the manager books, merged and sorted. Type to filter.</p>' +
      '<p style="margin-top:12px"><input id="gfilter" type="search" placeholder="filter terms" aria-label="Filter terms" style="font:inherit;width:100%;max-width:420px;padding:7px 10px;border:1px solid var(--rule);border-radius:6px;background:var(--ground);color:var(--ink)"> <span class="prog" id="gcount"></span></p></div>';
    h += '<div class="sheet"><div class="tbl"><table id="gtable"><thead><tr><th>Term</th><th>Meaning</th><th>Source</th></tr></thead><tbody>' +
      rows.map(function(r){ return '<tr><td>' + r.term + '</td><td>' + r.meaning + '</td><td><a href="' + r.href + '">' + esc(r.src) + '</a></td></tr>'; }).join("") + '</tbody></table></div></div>';
    return h;
  }
  function bindGlossary(){
    var inp = $("gfilter"); if (!inp) return;
    var trs = Array.prototype.slice.call(document.querySelectorAll("#gtable tbody tr")), cnt = $("gcount");
    function apply(){
      var q = inp.value.trim().toLowerCase(), n = 0;
      trs.forEach(function(tr){ var on = !q || tr.textContent.toLowerCase().indexOf(q) >= 0; tr.hidden = !on; if (on) n++; });
      cnt.textContent = n + " of " + trs.length + " terms";
    }
    inp.addEventListener("input", apply); apply();
  }

  /* ---------- render ---------- */
  function render(){
    var r = route(), main = $("main");
    renderNav(r); renderSide(r);
    main.innerHTML = r.page === "ch" ? pageChapter(r) : r.page === "viz" ? pageViz(r) : r.page === "onepager" && D.onepager ? pageOnepager() : r.page === "reading" && D.reading ? pageReading(r) : r.page === "glossary" ? pageGlossary() : pageHome();
    bindCards(main); updateProg(); bindGlossary();
    document.title = (r.page === "ch" && chapter(r.n) ? "Ch. " + r.n + " · " + chapter(r.n).title : r.page === "viz" ? "Visualizations" : r.page === "onepager" ? "System design one-pager" : r.page === "reading" && r.slug && book(r.slug) ? book(r.slug).book : r.page === "reading" ? "Reading" : r.page === "glossary" ? "Glossary" : "DDIA") + " · DDIA study site";
    $("side").classList.remove("open");
    if ((r.page === "onepager" || r.page === "reading") && r.sec){ var t2 = $("sec-" + r.sec); if (t2) setTimeout(function(){ t2.scrollIntoView({block:"start"}); }, 30); }
    if (r.page === "ch" && r.sec){
      var target = r.item ? $("ch" + r.n + "-" + r.sec + "-" + r.item) : $("sec-" + r.sec);
      if (target){
        setTimeout(function(){ target.scrollIntoView({block:"start"}); }, 30);
      }
    } else window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  $("menu").addEventListener("click", function(){ $("side").classList.toggle("open"); });
  render();
})();
