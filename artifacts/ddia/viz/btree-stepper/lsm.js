/* LSM-tree simulator: same contract as btree.js. Runs a program of API calls and records every
   intermediate state as a frame.
   A frame = { op, state:{memCap, mem:[entry], l0:[table], l1:[table]}, caption,
               nodes:{tableId:cls}, keys:{eid:cls}, origins:{newTableId:sourceId}, m:{r,w,stored,live} }
   entry = {eid, k, v, tomb}; table = {id, name, entries}. l0 is newest-first; l1 files never overlap.
   Simplified on purpose: two levels, a full merge when L0 reaches l0Max tables, exact Bloom filters. */
(function (root) {
  function simulate(ops, opts) {
    opts = opts || {};
    var memCap = opts.memCap || 4, l0Max = opts.l0Max || 3, fileSize = opts.fileSize || 4, bloom = opts.bloom !== false;
    var nextEid = 1, nextTid = 1, mem = [], l0 = [], l1 = [], frames = [], meta = [], opIndex = -1;
    var reads = 0, writes = 0, checks = 0, live = {};

    function cpE(e) { return { eid: e.eid, k: e.k, v: e.v, tomb: e.tomb }; }
    function cpT(t) { return { id: t.id, name: t.name, entries: t.entries.map(cpE) }; }
    function stored() { var n = mem.length; l0.concat(l1).forEach(function (t) { n += t.entries.length; }); return n; }
    function snap(caption, nodes, keys, origins) {
      frames.push({ op: opIndex, state: { memCap: memCap, mem: mem.map(cpE), l0: l0.map(cpT), l1: l1.map(cpT) }, caption: caption,
        nodes: nodes || {}, keys: keys || {}, origins: origins || {}, m: { c: checks, r: reads, w: writes, stored: stored(), live: Object.keys(live).length } });
    }
    function finish(result, tone, caption, keys) { snap(caption, {}, keys || {}); meta[opIndex].result = result; meta[opIndex].tone = tone || "ok"; }
    function one(id, cls) { var o = {}; o[id] = cls; return o; }
    function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
    function find(t, k) { for (var i = 0; i < t.entries.length; i++) if (t.entries[i].k === k) return t.entries[i]; return null; }
    function fmtVal(v) { return v == null || v === "" ? "no value" : '"' + v + '"'; }

    // Newest-to-oldest lookup. Returns the winning entry (which may be a tombstone) or null.
    function lookup(k, lead) {
      lead = lead ? lead + " " : "";
      var hit = null, i, l1Counted = false;
      checks++;
      for (i = 0; i < mem.length; i++) if (mem[i].k === k) hit = mem[i];
      if (hit) {
        snap(lead + "The memtable (RAM) is checked first, and " + k + " is there" + (hit.tomb ? " as a tombstone." : "."), one("mem", "visit"), one(hit.eid, hit.tomb ? "bad" : "good"));
        return hit;
      }
      snap(lead + "The memtable (RAM) is checked first. " + k + " is not in it.", one("mem", "visit"));
      var tables = l0.concat(l1);
      if (!tables.length) { snap("There are no files on disk yet, so " + k + " does not exist."); return null; }
      var skipped = {}, nskip = 0, byFilter = 0;
      function flushSkips(tail) {
        if (!nskip) return;
        snap("Going through the files newest first: " + plural(nskip, "file") + " ruled out without a disk read (" + (byFilter ? "key range or Bloom filter" : "key range") + ")." + (tail || ""), skipped);
        skipped = {}; nskip = 0; byFilter = 0;
      }
      for (i = 0; i < tables.length; i++) {
        if (i < l0.length) checks++; else if (!l1Counted) { checks++; l1Counted = true; }
        var t = tables[i], inRange = t.entries.length && k >= t.entries[0].k && k <= t.entries[t.entries.length - 1].k, e = find(t, k);
        if (!inRange) { skipped[t.id] = "skip"; nskip++; continue; }
        if (!e && bloom) { skipped[t.id] = "skip"; nskip++; byFilter++; continue; }
        flushSkips(); reads++;
        if (!e) { snap("Read " + t.name + " from disk: " + k + " falls inside its key range, but it is not in the file. With no Bloom filter, that was a wasted read.", one(t.id, "bad")); continue; }
        snap("Read " + t.name + " from disk: " + (e.tomb ? k + " is a tombstone here, so the key is deleted. Older files are never consulted." : "found " + k + ". This is the newest version, so older files are never consulted."), one(t.id, "visit"), one(e.eid, e.tomb ? "bad" : "good"));
        return e;
      }
      flushSkips(" Nothing is left to check, so " + k + " does not exist.");
      return null;
    }

    function put(k, v, tomb, caption) {
      var replaced = false, i;
      for (i = 0; i < mem.length; i++) if (mem[i].k === k) { mem.splice(i, 1); replaced = true; break; }
      var e = { eid: nextEid++, k: k, v: v, tomb: !!tomb };
      i = 0; while (i < mem.length && mem[i].k < k) i++;
      mem.splice(i, 0, e);
      snap(caption + (replaced ? " It replaces the older version that was still in RAM." : ""), one("mem", "visit"), one(e.eid, tomb ? "bad" : "good"));
      var notes = [];
      if (mem.length >= memCap) { flush(); notes.push("flush"); if (l0.length >= l0Max) { compact(); notes.push("compact"); } }
      return notes;
    }

    function flush() {
      snap("The memtable is full (" + mem.length + " of " + memCap + ").", one("mem", "bad"));
      var t = { id: "t" + nextTid, name: "sst-" + nextTid, entries: mem }; nextTid++;
      l0.unshift(t); mem = []; writes += t.entries.length;
      snap("Flush: the whole memtable is written in one sequential pass as " + t.name + ", an immutable sorted file in L0. The memtable starts over empty.", one(t.id, "good"), {}, one(t.id, "mem"));
    }

    function compact() {
      var inputs = l0.concat(l1), hl = {}, first = inputs[0].id;
      inputs.forEach(function (t) { hl[t.id] = "bad"; });
      snap("L0 now has " + l0.length + " files whose key ranges overlap, and every one of them slows reads down. Time to compact: merge all of L0" + (l1.length ? " with L1." : " into L1."), hl);
      var win = {}, kh = {}, shadowed = 0, tombs = 0;
      inputs.forEach(function (t) { t.entries.forEach(function (e) { if (win[e.k] == null) win[e.k] = e; else { kh[e.eid] = "bad"; shadowed++; } }); });
      var out = [];
      Object.keys(win).forEach(function (k) { var e = win[k]; if (e.tomb) { kh[e.eid] = "bad"; tombs++; } else out.push(e); });
      out.sort(function (a, b) { return a.k - b.k; });
      inputs.forEach(function (t) { hl[t.id] = "visit"; });
      snap("Merge-sort every input. For each key the newest version wins, so " + plural(shadowed, "shadowed entry").replace("entrys", "entries") + " and " + plural(tombs, "tombstone") + " can be dropped for good.", hl, kh);
      var files = [], org = {}, good = {};
      for (var i = 0; i < out.length; i += fileSize) {
        var t = { id: "t" + nextTid, name: "sst-" + nextTid, entries: out.slice(i, i + fileSize) }; nextTid++;
        files.push(t); org[t.id] = first; good[t.id] = "good";
      }
      l0 = []; l1 = files; writes += out.length;
      snap(files.length ? "Write the survivors as " + plural(files.length, "new L1 file") + ", sequentially, then delete the old files. L1 files never overlap, so a lookup needs at most one of them."
        : "Nothing survived the merge, so the old files are simply deleted.", good, {}, org);
    }

    function done(notes, where) { return notes.length ? notes.join(", ") : where; }

    function opInsert(k, v) {
      var hit = lookup(k, "A unique insert has to make sure " + k + " does not already exist.");
      if (hit && !hit.tomb) return finish("duplicate", "warn", "insert(" + k + ") rejected: duplicate key.");
      var notes = put(k, v, false, "Append " + k + " to the write-ahead log, then place it in the memtable, a sorted structure in RAM. No data file is touched.");
      live[k] = 1;
      finish(done(notes, "memtable"), "ok", "insert(" + k + ") done" + (notes.length ? ": " + notes.join(", ") + "." : ". The write only touched RAM and the log."));
    }
    function opUpdate(k, v) {
      var hit = lookup(k, "An update has to make sure " + k + " exists.");
      if (!hit || hit.tomb) return finish("not found", "warn", "update(" + k + ") → not found. Nothing changed.");
      var inMem = mem.some(function (e) { return e.k === k; });
      var notes = put(k, v, false, "Write a new version of " + k + " into the memtable." + (inMem ? "" : " Files are immutable, so the old version stays on disk, shadowed, until a compaction removes it."));
      finish(done(notes, "memtable"), "ok", "update(" + k + ") done" + (notes.length ? ": " + notes.join(", ") + "." : "."));
    }
    function opDelete(k) {
      var notes = put(k, "", true, "Files are immutable, so a delete is a write too: a tombstone for " + k + " goes into the memtable. No lookup happens, so the engine does not even know whether " + k + " existed.");
      delete live[k];
      finish(done(["tombstone"].concat(notes), ""), "ok", "delete(" + k + ") done: " + ["tombstone"].concat(notes).join(", ") + ". The data itself is still on disk until a compaction.");
    }
    function opGet(k) {
      var hit = lookup(k);
      if (!hit || hit.tomb) return finish("not found", "warn", "get(" + k + ") → not found.");
      finish(hit.v ? '"' + hit.v + '"' : "found", "ok", "get(" + k + ") → " + fmtVal(hit.v) + ".", one(hit.eid, "good"));
    }
    function opRange(lo, hi) {
      var name = "range(" + lo + ", " + hi + ")";
      if (lo > hi) { snap("The range is empty because " + lo + " > " + hi + "."); return finish("empty", "warn", name + " → []"); }
      var hl = { mem: "visit" }, srcs = [mem], n = 0;
      l0.concat(l1).forEach(function (t) {
        if (t.entries.length && t.entries[0].k <= hi && t.entries[t.entries.length - 1].k >= lo) { hl[t.id] = "visit"; srcs.push(t.entries); n++; }
      });
      reads += n; checks += 1 + l0.length + (l1.length ? 1 : 0);
      snap("A range scan cannot use Bloom filters. Open a cursor on the memtable and on every file whose key range overlaps " + lo + "–" + hi + ": " + plural(n, "file") + ".", hl);
      var win = {}, kh = {}, out = [];
      srcs.forEach(function (list) { list.forEach(function (e) { if (e.k < lo || e.k > hi) return; if (win[e.k] == null) win[e.k] = e; else kh[e.eid] = "bad"; }); });
      Object.keys(win).forEach(function (k) { var e = win[k]; if (e.tomb) kh[e.eid] = "bad"; else { kh[e.eid] = "good"; out.push(e.k); } });
      out.sort(function (a, b) { return a - b; });
      snap("Merge the cursors in key order. The newest version of each key wins; shadowed versions and tombstones are skipped.", hl, kh);
      var keep = {}; Object.keys(kh).forEach(function (id) { if (kh[id] === "good") keep[id] = "good"; });
      finish(plural(out.length, "key"), out.length ? "ok" : "warn", name + " → [" + out.join(", ") + "]", keep);
    }

    frames.push({ op: -1, state: { memCap: memCap, mem: [], l0: [], l1: [] }, caption: "An empty store: an empty memtable in RAM and no files on disk.", nodes: {}, keys: {}, origins: {}, m: { c: 0, r: 0, w: 0, stored: 0, live: 0 } });
    ops.forEach(function (op, idx) {
      opIndex = idx; meta[idx] = { start: frames.length, end: 0, result: "", tone: "ok" };
      if (op.type === "insert") opInsert(op.key, op.value || "");
      else if (op.type === "get") opGet(op.key);
      else if (op.type === "update") opUpdate(op.key, op.value || "");
      else if (op.type === "delete") opDelete(op.key);
      else if (op.type === "range") opRange(op.key, op.hi);
      meta[idx].end = frames.length - 1;
    });
    return { frames: frames, meta: meta, memCap: memCap, bloom: bloom };
  }

  var api = { simulate: simulate };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.LSM = api;
})(typeof window !== "undefined" ? window : this);
