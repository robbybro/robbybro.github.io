/* B-tree simulator: runs a program of API calls from an empty tree and records
   every intermediate state as a frame, so the UI can step forward and backward.
   A frame = { op, tree, caption, nodes:{id:cls}, keys:{key:cls}, origins:{newId:sourceId} } */
(function (root) {
  function clone(n) {
    return { id: n.id, keys: n.keys.map(function (e) { return { k: e.k, v: e.v }; }), children: n.children.map(clone) };
  }
  function fmtNode(n) { return n.keys.length ? "[" + n.keys.map(function (e) { return e.k; }).join(" | ") + "]" : "[ ]"; }
  function fmtVal(v) { return v == null || v === "" ? "no value" : '"' + v + '"'; }
  function callText(op) {
    var q = function (v) { return '"' + v + '"'; };
    switch (op.type) {
      case "insert": return "insert(" + op.key + (op.value ? ", " + q(op.value) : "") + ")";
      case "get": return "get(" + op.key + ")";
      case "update": return "update(" + op.key + ", " + q(op.value || "") + ")";
      case "delete": return "delete(" + op.key + ")";
      case "range": return "range(" + op.key + ", " + op.hi + ")";
    }
    return "?";
  }

  function simulate(ops, maxKeys) {
    var minKeys = Math.ceil((maxKeys + 1) / 2) - 1;
    var nextId = 1, tree = null, frames = [], meta = [], opIndex = -1;
    // Cost model: a page read counts once per call, except the root, which is treated as pinned in the
    // buffer cache (the LSM side gets its memtable and filters in RAM for free too). Writing a page
    // rewrites the whole page, so it costs maxKeys entries' worth of disk writes.
    var reads = 0, writes = 0, checks = 0, seenR = {}, seenW = {};
    function R(n) { if (n && !seenR[n.id]) { seenR[n.id] = 1; checks++; if (n !== tree) reads++; } }
    function W() { for (var i = 0; i < arguments.length; i++) { var n = arguments[i]; if (n && !seenW[n.id]) { seenW[n.id] = 1; writes += maxKeys; } } }

    function mk(keys, children) { return { id: nextId++, keys: keys || [], children: children || [] }; }
    function isLeaf(n) { return n.children.length === 0; }
    function findIndex(n, k) { var i = 0; while (i < n.keys.length && k > n.keys[i].k) i++; return i; }
    function hit(n, i, k) { return i < n.keys.length && n.keys[i].k === k; }
    function one(id, cls) { var o = {}; o[id] = cls; return o; }
    function snap(caption, nodes, keys, origins) {
      var st = stats(tree);
      frames.push({ op: opIndex, tree: tree ? clone(tree) : null, caption: caption, nodes: nodes || {}, keys: keys || {}, origins: origins || {},
        m: { c: checks, r: reads, w: writes, used: st.keys, slots: st.pages * maxKeys, height: st.height, pages: st.pages } });
    }
    function finish(result, tone, caption, keys) {
      snap(caption, {}, keys || {});
      meta[opIndex].result = result; meta[opIndex].tone = tone || "ok";
    }
    function descendCaption(n, i, k) {
      var why;
      if (i === 0) why = k + " < " + n.keys[0].k + ", so follow the leftmost pointer";
      else if (i === n.keys.length) why = k + " > " + n.keys[i - 1].k + ", so follow the rightmost pointer";
      else why = n.keys[i - 1].k + " < " + k + " < " + n.keys[i].k + ", so follow the pointer between them";
      return "Page " + fmtNode(n) + ": " + why + ".";
    }

    function opInsert(k, v) {
      var name = "insert(" + k + ")";
      if (!tree) {
        tree = mk([{ k: k, v: v }]); W(tree);
        snap("The tree is empty, so " + k + " goes into a brand-new root page.", one(tree.id, "good"), one(k, "good"));
        return finish("new root", "ok", name + " done. One page, one key.");
      }
      var path = [], n = tree, i;
      for (;;) {
        R(n); i = findIndex(n, k);
        if (hit(n, i, k)) {
          snap(k + " is already in page " + fmtNode(n) + ". Keys are unique, so the insert is rejected. Use update to change its value.", one(n.id, "visit"), one(k, "bad"));
          return finish("duplicate", "warn", name + " rejected: duplicate key.");
        }
        if (isLeaf(n)) break;
        snap(descendCaption(n, i, k), one(n.id, "visit"));
        path.push({ n: n, i: i }); n = n.children[i];
      }
      snap("Reached leaf " + fmtNode(n) + ". New keys always land in a leaf; " + k + " belongs in slot " + (i + 1) + ".", one(n.id, "visit"));
      n.keys.splice(i, 0, { k: k, v: v }); W(n);
      snap("Insert " + k + " into the leaf, keeping the keys sorted.", one(n.id, "visit"), one(k, "good"));

      var splits = 0, grew = false;
      while (n.keys.length > maxKeys) {
        var mid = Math.floor(n.keys.length / 2), med = n.keys[mid];
        snap("Overflow: " + fmtNode(n) + " holds " + n.keys.length + " keys but a page fits " + maxKeys + ". Split it around the median, " + med.k + ".", one(n.id, "bad"), one(med.k, "move"));
        var leaf = isLeaf(n);
        var right = mk(n.keys.slice(mid + 1), leaf ? [] : n.children.slice(mid + 1));
        n.keys = n.keys.slice(0, mid);
        if (!leaf) n.children = n.children.slice(0, mid + 1);
        var p = path.pop(), hl = {}, org = {};
        hl[n.id] = "good"; hl[right.id] = "good"; org[right.id] = n.id;
        if (!p) {
          tree = mk([med], [n, right]); W(n, right, tree); hl[tree.id] = "visit"; org[tree.id] = n.id; grew = true;
          snap("The root itself split, so " + med.k + " becomes a new root above the two halves. This is the only way a B-tree gets taller, which is why every leaf stays at the same depth.", hl, one(med.k, "move"), org);
          n = tree;
        } else {
          p.n.keys.splice(p.i, 0, med); p.n.children.splice(p.i + 1, 0, right); W(n, right, p.n); hl[p.n.id] = "visit";
          snap(med.k + " moves up into the parent as the separator between the two halves " + fmtNode(n) + " and " + fmtNode(right) + ".", hl, one(med.k, "move"), org);
          n = p.n;
        }
        splits++;
      }
      var res = splits ? "split" + (splits > 1 ? " ×" + splits : "") + (grew ? ", taller" : "") : "ok";
      finish(res, "ok", name + " done" + (splits ? ": " + splits + " split" + (splits > 1 ? "s" : "") + (grew ? ", tree grew one level." : ".") : ". The leaf had room, so nothing else changed."));
    }

    function locate(k, verb) {
      // Shared descent for get / update. Returns {n,i} or null (after snapping the miss).
      if (!tree) { snap("The tree is empty."); return null; }
      var n = tree, i;
      for (;;) {
        R(n); i = findIndex(n, k);
        if (hit(n, i, k)) return { n: n, i: i };
        if (isLeaf(n)) {
          snap("Leaf " + fmtNode(n) + " is the only place " + k + " could be, and it is not here.", one(n.id, "visit"), {});
          return null;
        }
        snap(descendCaption(n, i, k), one(n.id, "visit"));
        n = n.children[i];
      }
    }

    function opGet(k) {
      var f = locate(k);
      if (!f) return finish("not found", "warn", "get(" + k + ") → not found.");
      var v = f.n.keys[f.i].v;
      snap("Found " + k + " in page " + fmtNode(f.n) + ".", one(f.n.id, "visit"), one(k, "good"));
      finish(v ? '"' + v + '"' : "found", "ok", "get(" + k + ") → " + fmtVal(v) + ".", one(k, "good"));
    }

    function opUpdate(k, v) {
      var f = locate(k);
      if (!f) return finish("not found", "warn", "update(" + k + ") → not found. Nothing changed.");
      var old = f.n.keys[f.i].v;
      snap("Found " + k + " in page " + fmtNode(f.n) + " with " + fmtVal(old) + ".", one(f.n.id, "visit"), one(k, "visit"));
      f.n.keys[f.i].v = v; W(f.n);
      snap("Overwrite the value in place: " + fmtVal(old) + " → " + fmtVal(v) + ". The key did not move, so the tree shape is untouched.", one(f.n.id, "visit"), one(k, "good"));
      finish("ok", "ok", "update(" + k + ") done.", one(k, "good"));
    }

    function opRange(lo, hi) {
      var name = "range(" + lo + ", " + hi + ")";
      if (lo > hi) { snap("The range is empty because " + lo + " > " + hi + "."); return finish("empty", "warn", name + " → []"); }
      if (!tree) { snap("The tree is empty."); return finish("0 keys", "warn", name + " → []"); }
      var out = [], kh = {};
      function copy(o) { var c = {}; for (var x in o) c[x] = o[x]; return c; }
      (function walk(n) {
        R(n);
        snap("Visit page " + fmtNode(n) + ". Only subtrees that can overlap " + lo + "–" + hi + " are opened.", one(n.id, "visit"), copy(kh));
        for (var i = 0; i <= n.keys.length; i++) {
          if (!isLeaf(n)) {
            var open = (i === 0 || n.keys[i - 1].k < hi) && (i === n.keys.length || n.keys[i].k > lo);
            if (open) walk(n.children[i]);
          }
          if (i < n.keys.length && n.keys[i].k >= lo && n.keys[i].k <= hi) {
            out.push(n.keys[i].k); kh[n.keys[i].k] = "good";
            snap("Emit " + n.keys[i].k + ". Keys come out in sorted order.", one(n.id, "visit"), copy(kh));
          }
        }
      })(tree);
      finish(out.length + (out.length === 1 ? " key" : " keys"), out.length ? "ok" : "warn", name + " → [" + out.join(", ") + "]", copy(kh));
    }

    function opDelete(k) {
      var name = "delete(" + k + ")";
      if (!tree) { snap("The tree is empty."); return finish("not found", "warn", name + " → not found."); }
      var path = [], n = tree, i;
      for (;;) {
        R(n); i = findIndex(n, k);
        if (hit(n, i, k)) break;
        if (isLeaf(n)) {
          snap("Leaf " + fmtNode(n) + " is the only place " + k + " could be, and it is not here.", one(n.id, "visit"));
          return finish("not found", "warn", name + " → not found. Nothing changed.");
        }
        snap(descendCaption(n, i, k), one(n.id, "visit"));
        path.push({ n: n, i: i }); n = n.children[i];
      }
      snap("Found " + k + " in page " + fmtNode(n) + ".", one(n.id, "visit"), one(k, "bad"));
      var notes = [];
      if (!isLeaf(n)) {
        var target = n, ti = i, hl;
        path.push({ n: n, i: i });
        var m = n.children[i]; R(m);
        snap(k + " is a separator in an internal page, so it cannot simply vanish. Find its in-order predecessor: the largest key in the left subtree.", one(m.id, "visit"), one(k, "bad"));
        while (!isLeaf(m)) {
          path.push({ n: m, i: m.children.length - 1 }); m = m.children[m.children.length - 1]; R(m);
          snap("Keep following the rightmost pointer.", one(m.id, "visit"), one(k, "bad"));
        }
        var pred = m.keys[m.keys.length - 1], kh = {};
        kh[k] = "bad"; kh[pred.k] = "move";
        snap("The predecessor is " + pred.k + ", the last key of leaf " + fmtNode(m) + ".", one(m.id, "visit"), kh);
        m.keys.pop(); target.keys[ti] = pred; W(m, target);
        hl = {}; hl[target.id] = "visit"; hl[m.id] = "visit";
        snap(pred.k + " takes over " + k + "'s slot as separator. The real removal happened down in the leaf.", hl, one(pred.k, "move"));
        notes.push("predecessor"); n = m;
      } else {
        n.keys.splice(i, 1); W(n);
        snap("Remove " + k + " from the leaf.", one(n.id, "visit"));
      }

      while (path.length && n.keys.length < minKeys) {
        var p = path.pop(), parent = p.n, idx = p.i;
        snap("Underflow: " + fmtNode(n) + " has " + n.keys.length + " key" + (n.keys.length === 1 ? "" : "s") + ", below the minimum of " + minKeys + ". Look at its siblings.", one(n.id, "bad"));
        var left = idx > 0 ? parent.children[idx - 1] : null;
        var right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
        R(left); R(right);
        var sep, up, nh = {}, kk = {};
        if (left && left.keys.length > minKeys) {
          sep = parent.keys[idx - 1]; up = left.keys.pop();
          n.keys.unshift(sep); parent.keys[idx - 1] = up;
          if (!isLeaf(left)) n.children.unshift(left.children.pop());
          W(n, left, parent);
          nh[n.id] = "good"; nh[left.id] = "visit"; nh[parent.id] = "visit"; kk[sep.k] = "move"; kk[up.k] = "move";
          snap("The left sibling can spare a key, so rotate through the parent: " + sep.k + " comes down, " + up.k + " goes up.", nh, kk);
          notes.push("borrow");
        } else if (right && right.keys.length > minKeys) {
          sep = parent.keys[idx]; up = right.keys.shift();
          n.keys.push(sep); parent.keys[idx] = up;
          if (!isLeaf(right)) n.children.push(right.children.shift());
          W(n, right, parent);
          nh[n.id] = "good"; nh[right.id] = "visit"; nh[parent.id] = "visit"; kk[sep.k] = "move"; kk[up.k] = "move";
          snap("The right sibling can spare a key, so rotate through the parent: " + sep.k + " comes down, " + up.k + " goes up.", nh, kk);
          notes.push("borrow");
        } else if (left) {
          sep = parent.keys.splice(idx - 1, 1)[0]; parent.children.splice(idx, 1);
          left.keys = left.keys.concat([sep], n.keys); left.children = left.children.concat(n.children); W(left, parent);
          nh[left.id] = "good"; nh[parent.id] = "visit";
          snap("No sibling has a key to spare, so merge with the left sibling. The separator " + sep.k + " comes down to join them into " + fmtNode(left) + ".", nh, one(sep.k, "move"));
          notes.push("merge");
        } else {
          sep = parent.keys.splice(idx, 1)[0]; parent.children.splice(idx + 1, 1);
          n.keys = n.keys.concat([sep], right.keys); n.children = n.children.concat(right.children); W(n, parent);
          nh[n.id] = "good"; nh[parent.id] = "visit";
          snap("No sibling has a key to spare, so merge with the right sibling. The separator " + sep.k + " comes down to join them into " + fmtNode(n) + ".", nh, one(sep.k, "move"));
          notes.push("merge");
        }
        n = parent;
      }
      if (tree.keys.length === 0) {
        if (isLeaf(tree)) { tree = null; snap("That was the last key. The tree is empty again."); notes.push("empty"); }
        else {
          var old = tree; tree = tree.children[0];
          snap("The root " + fmtNode(old) + " has no keys left, so its only child becomes the root. The tree gets one level shorter, from the top.", one(tree.id, "good"));
          notes.push("shorter");
        }
      }
      var uniq = notes.filter(function (x, j) { return notes.indexOf(x) === j; });
      finish(uniq.length ? uniq.join(", ") : "ok", "ok", name + " done" + (uniq.length ? ": " + uniq.join(", ") + "." : ". The leaf stayed above the minimum, so nothing else changed."));
    }

    frames.push({ op: -1, tree: null, caption: "An empty tree: no pages yet.", nodes: {}, keys: {}, origins: {}, m: { c: 0, r: 0, w: 0, used: 0, slots: 0, height: 0, pages: 0 } });
    ops.forEach(function (op, idx) {
      opIndex = idx; meta[idx] = { start: frames.length, end: 0, result: "", tone: "ok" }; seenR = {}; seenW = {};
      if (op.type === "insert") opInsert(op.key, op.value || "");
      else if (op.type === "get") opGet(op.key);
      else if (op.type === "update") opUpdate(op.key, op.value || "");
      else if (op.type === "delete") opDelete(op.key);
      else if (op.type === "range") opRange(op.key, op.hi);
      meta[idx].end = frames.length - 1;
    });
    return { frames: frames, meta: meta, minKeys: minKeys, maxKeys: maxKeys };
  }

  function stats(tree) {
    var s = { height: 0, pages: 0, keys: 0 };
    (function walk(n, d) {
      if (!n) return;
      s.pages++; s.keys += n.keys.length; if (d > s.height) s.height = d;
      n.children.forEach(function (c) { walk(c, d + 1); });
    })(tree, 1);
    return s;
  }

  var api = { simulate: simulate, callText: callText, stats: stats };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.BTree = api;
})(typeof window !== "undefined" ? window : this);
