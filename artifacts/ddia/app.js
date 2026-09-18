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
    return {page:"home"};
  }

  /* ---------- top nav + sidebar ---------- */
  function renderNav(r){
    var items = [["#/", "Overview", r.page === "home"]];
    D.chapters.forEach(function(c){ items.push(["#/ch/" + c.n, "Ch. " + c.n, r.page === "ch" && String(r.n) === String(c.n)]); });
    items.push(["#/viz", "Visualizations", r.page === "viz"]);
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
    $("side").innerHTML = h;
  }

  /* ---------- cards ---------- */
  function card(c, sec, it, i, openAll){
    var id = "ch" + c.n + "-" + sec.id + "-" + (i+1), g = got()[id];
    var open = openAll || false;
    var sub = it.sub ? '<small>' + esc(it.sub) + '</small>' : "";
    var body = "";
    if (it.robby) body += '<div class="robby"><b>What I said first:</b> ' + it.robby + '</div>';
    body += it.a || "";
    if (it.when || it.breaks){
      body += '<p><b>When you choose it.</b> ' + (it.when || "") + '</p>';
      if (it.breaks) body += '<p><b>Where it breaks.</b></p><ol>' + it.breaks.map(function(b){ return '<li>' + b + '</li>'; }).join("") + '</ol>';
    }
    if (it.line) body += '<div class="line"><b>The line:</b> ' + it.line + '</div>';
    return '<article class="card' + (g ? " got" : "") + '" id="' + id + '" data-id="' + id + '">' +
      '<div class="q" role="button" tabindex="0" aria-expanded="' + open + '"><span class="n">' + (i+1) + '</span><span class="t">' + it.q + sub + '</span><span class="tog">' + (open ? "hide" : "show") + '</span></div>' +
      '<div class="a"' + (open ? "" : " hidden") + '>' + body + '</div>' +
      '<div class="foot"' + (open ? "" : " hidden") + '><a href="#/ch/' + c.n + '/' + sec.id + '/' + (i+1) + '" class="prog">link</a><button type="button" class="got-btn' + (g ? " on" : "") + '">' + (g ? "✓ got it" : "mark got it") + '</button></div>' +
    '</article>';
  }
  function bindCards(root){
    root.querySelectorAll(".card").forEach(function(el){
      var q = el.querySelector(".q"), a = el.querySelector(".a"), f = el.querySelector(".foot"), tog = el.querySelector(".tog");
      function toggle(force){ var open = force != null ? force : a.hidden; a.hidden = !open; f.hidden = !open; tog.textContent = open ? "hide" : "show"; q.setAttribute("aria-expanded", open); }
      q.addEventListener("click", function(){ toggle(); });
      q.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); toggle(); } });
      el.querySelector(".got-btn").addEventListener("click", function(){
        var on = !el.classList.contains("got"); el.classList.toggle("got", on); this.classList.toggle("on", on); this.textContent = on ? "✓ got it" : "mark got it"; setGot(el.dataset.id, on); updateProg();
      });
      el._toggle = toggle;
    });
  }
  function updateProg(){
    var g = got();
    document.querySelectorAll("[data-prog]").forEach(function(el){
      var ids = el.dataset.prog.split(","), n = ids.filter(function(i){ return g[i]; }).length;
      el.textContent = n + " / " + ids.length + " got";
    });
  }
  function sectionBlock(c, s, openAll){
    var ids = s.items.map(function(_, i){ return "ch" + c.n + "-" + s.id + "-" + (i+1); }).join(",");
    return '<section class="blk" id="sec-' + s.id + '"><div class="blk-head"><div><h2>' + esc(s.title) + '</h2>' + (s.intro ? '<p class="muted" style="margin:4px 0 0;max-width:80ch">' + s.intro + '</p>' : "") + '</div>' +
      '<div class="tools"><span class="prog" data-prog="' + ids + '"></span><button type="button" data-show="' + s.id + '">show all</button><button type="button" data-hide="' + s.id + '">hide all</button></div></div>' +
      s.items.map(function(it, i){ return card(c, s, it, i, openAll); }).join("") + '</section>';
  }

  /* ---------- pages ---------- */
  function pageHome(){
    var h = '<div class="hero"><span class="kicker">Designing Data-Intensive Applications · 2nd edition</span><h1>Study site</h1>' +
      '<p>One section per chapter: the jargon defined once, every question we worked through with the corrected answer hidden behind a click, and ten takeaways. Interactive visualizations live under their own tab.</p>' +
      '<div class="chips">' + D.chapters.map(function(c){ return '<a class="chip" href="#/ch/' + c.n + '">Ch. ' + c.n + ' · ' + esc(c.title) + '</a>'; }).join("") + D.viz.map(function(v){ return '<a class="chip" href="#/viz/' + v.slug + '">▶ ' + esc(v.title) + '</a>'; }).join("") + '</div></div>';
    h += '<section class="blk"><h2>How to use it</h2><ul><li>Read a question, answer it out loud, then click <b>show</b>. Mark it <b>got it</b> once you can give the answer cold; the tick is stored in this browser.</li><li><b>What I said first</b> boxes are the wrong turns from the live sessions. They are the cheapest thing on the site: each one is a mistake already made once.</li><li>Every question has a direct link, so a card can be sent to a phone or a future session.</li></ul></section>';
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
    c.sections.forEach(function(s){ h += sectionBlock(c, s, false); });
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

  /* ---------- render ---------- */
  function render(){
    var r = route(), main = $("main");
    renderNav(r); renderSide(r);
    main.innerHTML = r.page === "ch" ? pageChapter(r) : r.page === "viz" ? pageViz(r) : pageHome();
    bindCards(main); updateProg();
    main.querySelectorAll("[data-show],[data-hide]").forEach(function(b){
      b.addEventListener("click", function(){
        var sec = $("sec-" + (this.dataset.show || this.dataset.hide)), open = !!this.dataset.show;
        sec.querySelectorAll(".card").forEach(function(el){ if (el._toggle) el._toggle(open); });
      });
    });
    document.title = (r.page === "ch" && chapter(r.n) ? "Ch. " + r.n + " · " + chapter(r.n).title : r.page === "viz" ? "Visualizations" : "DDIA") + " · DDIA study site";
    $("side").classList.remove("open");
    if (r.page === "ch" && r.sec){
      var target = r.item ? $("ch" + r.n + "-" + r.sec + "-" + r.item) : $("sec-" + r.sec);
      if (target){
        if (r.item && target._toggle) target._toggle(true);
        setTimeout(function(){ target.scrollIntoView({block:"start"}); }, 30);
      }
    } else window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  $("menu").addEventListener("click", function(){ $("side").classList.toggle("open"); });
  render();
})();
