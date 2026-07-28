// Robby Brosman portfolio — walking skeleton (Step 1)
// Mesh: real Delaunay (Bowyer–Watson) computed once on a jittered grid, then
// vertices are sine-displaced per frame (fixed topology). Pure decoration.

/* ----------------------------- Delaunay ----------------------------- */
function circumcircle(a, b, c) {
  const ax = a.x, ay = a.y, bx = b.x, by = b.y, cx = c.x, cy = c.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-9) return null;
  const a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = cx * cx + cy * cy;
  const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
  const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
  return { x: ux, y: uy, r2: (ux - ax) * (ux - ax) + (uy - ay) * (uy - ay) };
}

// points: [{x,y}], returns triangles as [i,j,k] into points
function triangulate(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const dmax = Math.max(maxX - minX, maxY - minY) || 1;
  const midx = (minX + maxX) / 2, midy = (minY + maxY) / 2;
  const pts = points.concat([
    { x: midx - 20 * dmax, y: midy - dmax },
    { x: midx, y: midy + 20 * dmax },
    { x: midx + 20 * dmax, y: midy - dmax },
  ]);
  const n = points.length;
  let tris = [[n, n + 1, n + 2]];

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const good = [], edges = [];
    for (const t of tris) {
      const cc = circumcircle(pts[t[0]], pts[t[1]], pts[t[2]]);
      if (cc && (p.x - cc.x) ** 2 + (p.y - cc.y) ** 2 <= cc.r2 + 1e-6) {
        edges.push([t[0], t[1]], [t[1], t[2]], [t[2], t[0]]);
      } else {
        good.push(t);
      }
    }
    // boundary edges appear exactly once among the bad triangles
    for (let e = 0; e < edges.length; e++) {
      const [a, b] = edges[e];
      let shared = false;
      for (let f = 0; f < edges.length; f++) {
        if (e === f) continue;
        const [c, d] = edges[f];
        if ((a === c && b === d) || (a === d && b === c)) { shared = true; break; }
      }
      if (!shared) good.push([a, b, i]);
    }
    tris = good;
  }
  return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n);
}

/* ----------------------------- Palette ----------------------------- */
// Baja Fade (after Rumpl's Wrap Sack colorway): indigo -> purple -> fuchsia ->
// coral -> orange -> gold, run as a diagonal gradient from the top-left
// (dark, where the intro text sits) to the bottom-right (gold).
const BAJA = [
  [31, 42, 99],    // indigo
  [91, 45, 142],   // purple
  [176, 51, 140],  // fuchsia
  [232, 78, 95],   // coral
  [244, 123, 53],  // orange
  [255, 197, 63],  // gold
];
function mix(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}
function triColor(cx, cy, w, h, seed) {
  const f = Math.min(0.999, Math.max(0, (cx / w + cy / h) / 2)); // diagonal fade
  const g = f * (BAJA.length - 1);
  const i = Math.floor(g);
  const base = mix(BAJA[i], BAJA[i + 1], g - i);
  const j = ((Math.sin(seed * 12.9898) * 43758.5453) % 1 + 1) % 1; // deterministic jitter
  const v = 1 + (j - 0.5) * 0.12;
  return `rgb(${Math.min(255, base[0] * v) | 0},${Math.min(255, base[1] * v) | 0},${Math.min(255, base[2] * v) | 0})`;
}

/* ----------------------------- Mesh ----------------------------- */
const canvas = document.getElementById("mesh");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let W = 0, H = 0, DPR = 1;
let verts = [];   // {hx,hy,x,y,phase,amp}
let tris = [];    // {i,j,k,color}

function buildMesh() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // /10 for pool depth + an above-median area floor for content triangles:
  // "bigger content triangles" comes from the floor (no slivers), while the
  // finer mesh keeps enough candidates that ten non-touching placements fit.
  const cell = Math.max(140, Math.min(250, Math.round(Math.hypot(W, H) / 10)));
  const cols = Math.ceil(W / cell) + 2;
  const rows = Math.ceil(H / cell) + 2;
  verts = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const border = r === 0 || c === 0 || r === rows || c === cols;
      const jx = border ? 0 : (Math.random() - 0.5) * cell * 0.8;
      const jy = border ? 0 : (Math.random() - 0.5) * cell * 0.8;
      const hx = (c - 1) * cell + jx;
      const hy = (r - 1) * cell + jy;
      verts.push({
        hx, hy, x: hx, y: hy,
        phase: Math.random() * Math.PI * 2,
        amp: border ? 0 : cell * 0.32,
      });
    }
  }
  const raw = triangulate(verts.map((v) => ({ x: v.hx, y: v.hy })));
  tris = raw.map(([i, j, k]) => {
    const cx = (verts[i].hx + verts[j].hx + verts[k].hx) / 3;
    const cy = (verts[i].hy + verts[j].hy + verts[k].hy) / 3;
    return { i, j, k, color: triColor(cx, cy, W, H, i * 7 + j * 13 + k) };
  });
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  if (!reduceMotion) {
    const speed = 0.00028;
    for (const v of verts) {
      if (v.amp === 0) continue;
      v.x = v.hx + Math.sin(t * speed + v.phase) * v.amp;
      v.y = v.hy + Math.cos(t * speed * 0.9 + v.phase * 1.3) * v.amp;
    }
  }
  ctx.lineJoin = "round";
  for (const tr of tris) {
    if (tr.project) continue; // project triangles draw in their own pass, on top
    const a = verts[tr.i], b = verts[tr.j], c = verts[tr.k];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    ctx.fillStyle = tr.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,246,223,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (let i = 0; i < projectTris.length; i++) drawProjectTri(projectTris[i], i, t);
}

/* ----------------- animation loop: ~30fps, pause when hidden ----------------- */
let raf = null, last = 0;
const FRAME = 1000 / 30;
function loop(now) {
  raf = requestAnimationFrame(loop);
  if (now - last < FRAME) return;
  last = now;
  draw(now);
}
function start() {
  if (reduceMotion) { draw(0); return; }
  if (raf == null) raf = requestAnimationFrame(loop);
}
function stop() { if (raf != null) { cancelAnimationFrame(raf); raf = null; } }
document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

let resizeT;
window.addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    buildMesh();
    assignProjectTriangles(); // triangles are viewport-derived, so re-pick them
    if (reduceMotion) draw(0);
  }, 150);
});

/* --------------------- Project triangles (in the mesh) ---------------------
 * A project is not an element floating above the canvas — it IS one of the
 * mesh's triangles, drawn in the same pass, waving with the same field.
 * Guarantees that keep them usable:
 *   - only triangles with above-median area are eligible (room for a screenshot)
 *   - no two project triangles may share a vertex, so they can never overlap
 *   - their vertices get damped amplitude, so the artwork inside stays legible
 * Keyboard users get invisible focusable proxies in #tiles (mouse ignores them).
 */
// A project triangle always fills its host mesh triangle EXACTLY — no rest
// bulge, no hover growth (Robby killed the expansion). Rest border = the
// intro-underline purple; hover border flips to Baja gold + pointer cursor
// as the "this is clickable" signal. Fill is butter-cream so the tiled
// emoji background and dark title stay readable against the Baja mesh.
const ACCENT = "#7c5cff";
const HOVER_BORDER = "#ffb300";
const CREAM = "#fff6df";
const INK_ON_CREAM = "#23204a";

/* Tiny repeating emoji background for a project triangle (~5pt glyphs).
 * The tile is rendered at device-pixel resolution and scaled back down via
 * the pattern's own transform — building it at CSS pixels left every emoji
 * a 2x-upscaled bitmap on retina, which is what read as "blurry". */
const patternCache = new Map();
function emojiPattern(emoji) {
  const key = emoji + "@" + DPR;
  if (patternCache.has(key)) return patternCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = Math.round(18 * DPR);
  const pc = c.getContext("2d");
  pc.scale(DPR, DPR);
  pc.font = "9px system-ui";
  pc.textAlign = "center";
  pc.textBaseline = "middle";
  pc.fillText(emoji, 9, 10);
  const pat = ctx.createPattern(c, "repeat");
  if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / DPR));
  patternCache.set(key, pat);
  return pat;
}

let projects = [];
let projectTris = [];  // {triIdx, p, poly}
let hoverIdx = -1;
let focusIdx = -1;

/* A project triangle must stay fully inside the viewport, with room under it
 * for the hover label. The wave displaces each vertex by up to its amp, so the
 * check must include that reach — resting position alone lets edge triangles
 * animate off-screen (that clipped Plates/Water Lab in review). */
function fitsOnScreen(tr) {
  const PAD = 14, LABEL = 44;
  for (const v of [verts[tr.i], verts[tr.j], verts[tr.k]]) {
    const m = v.amp * 0.45; // claimed verts damp to 0.4x, so this is the real swing
    if (v.hx - m < PAD || v.hx + m > W - PAD || v.hy - m < PAD || v.hy + m > H - LABEL) return false;
  }
  return true;
}

function homeArea(tr) {
  const a = verts[tr.i], b = verts[tr.j], c = verts[tr.k];
  return Math.abs((b.hx - a.hx) * (c.hy - a.hy) - (c.hx - a.hx) * (b.hy - a.hy)) / 2;
}

/* Live bounds of the intro copy — project triangles must never cover it.
 * Measured rather than hardcoded so it stays correct at every breakpoint. */
function introBox() {
  const el = document.querySelector(".intro");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const PAD = 12;
  return { x0: r.left - PAD, y0: r.top - PAD, x1: r.right + PAD, y1: r.bottom + PAD };
}

function triHomeBox(tr) {
  const vs = [verts[tr.i], verts[tr.j], verts[tr.k]];
  const xs = vs.map((v) => v.hx), ys = vs.map((v) => v.hy);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/* Adjacency rule (Robby): project triangles are spread out — a triangle may
 * share at most ONE full edge with one other project triangle (a loose pair),
 * and may never touch another at just a corner. So: 0 shared vertices, or
 * exactly 2 with a single partner that isn't already paired. */
function sharedVerts(t1, t2) {
  let n = 0;
  for (const v of [t1.i, t1.j, t1.k]) {
    if (v === t2.i || v === t2.j || v === t2.k) n++;
  }
  return n;
}

function assignProjectTriangles() {
  projectTris = [];
  for (const tr of tris) tr.project = null;
  if (!projects.length || !tris.length) return;

  const intro = introBox();
  const placed = []; // {tr, paired}
  const areas = tris.map(homeArea);
  const bigEnough = [...areas].sort((x, y) => x - y)[Math.floor(areas.length * 0.55)] || 0;

  /* Constraints relax GRADUALLY as the pool starves (small viewports).
   * The adjacency rule is the last thing to go, not the first:
   *   level 0: above-median area + on-screen + off-intro + pair rule + no corner touches + KISS gap
   *   level 1: drop the KISS visual-distance floor
   *   level 2: drop the area floor; allow corner touches (still at most one shared edge)
   *   level 3: any on-screen, off-intro triangle
   *   level 4: anything (true last resort)
   * A flat "level 1 = no rules" fallback is what produced the chained blobs. */
  function acceptable(idx, tr, level) {
    if (level < 2 && areas[idx] < bigEnough) return false; // content needs room
    if (level < 4 && !fitsOnScreen(tr)) return false;
    if (level < 4 && intro) {
      const b = triHomeBox(tr); // never sit on top of the intro copy
      const clear = b.x1 < intro.x0 || b.x0 > intro.x1 || b.y1 < intro.y0 || b.y0 > intro.y1;
      if (!clear) return false;
    }
    if (level >= 3) return true;
    let partner = null;
    for (const q of placed) {
      const s = sharedVerts(tr, q.tr);
      if (s >= 2) {
        if (partner || q.paired) return false; // second edge, or partner already paired
        partner = q;
        continue;
      }
      if (s === 1) {
        if (level < 2) return false; // corner-only touch
        continue;
      }
      if (level < 1) {
        // s === 0: unrelated triangles must also keep visual distance — two
        // separate vertices sitting 15px apart read as a corner touch anyway
        const KISS = 44;
        for (const a of [tr.i, tr.j, tr.k]) {
          for (const b of [q.tr.i, q.tr.j, q.tr.k]) {
            if (Math.hypot(verts[a].hx - verts[b].hx, verts[a].hy - verts[b].hy) < KISS) return false;
          }
        }
      }
    }
    return { partner };
  }

  for (const p of projects) {
    const tx = (p.pos && p.pos[0] != null ? p.pos[0] : 0.5) * W;
    const ty = (p.pos && p.pos[1] != null ? p.pos[1] : 0.5) * H;
    let best = -1, bestRes = null, bestLevel = -1;
    for (let level = 0; level < 5 && best < 0; level++) {
      let bestD = Infinity;
      for (let idx = 0; idx < tris.length; idx++) {
        const tr = tris[idx];
        if (tr.project) continue;
        const res = acceptable(idx, tr, level);
        if (!res) continue;
        const gx = (verts[tr.i].hx + verts[tr.j].hx + verts[tr.k].hx) / 3;
        const gy = (verts[tr.i].hy + verts[tr.j].hy + verts[tr.k].hy) / 3;
        let d = (gx - tx) ** 2 + (gy - ty) ** 2;
        // pairs pack the plane more efficiently than singletons (a pair
        // blocks one shared ring, not two) — prefer them when available
        if (res && res.partner) d *= 0.45;
        if (d < bestD) { bestD = d; best = idx; bestRes = res; bestLevel = level; }
      }
    }
    if (best < 0) continue;
    const tr = tris[best];
    tr.project = p;
    const entry = { tr, paired: false };
    if (bestRes && bestRes.partner) { entry.paired = true; bestRes.partner.paired = true; }
    placed.push(entry);
    p.__level = bestLevel; // audit: which constraint tier placed it
    for (const v of [tr.i, tr.j, tr.k]) {
      if (verts[v].damped) continue; // an edge-shared vertex must not damp twice
      verts[v].damped = true;
      verts[v].amp *= 0.4; // calm the wave so the title stays readable
    }
    projectTris.push({ triIdx: best, p, poly: null });
  }
  syncFocusProxies();
  window.__mesh = { verts, tris, projectTris, sharedVerts, draw, openModal }; // debug hook
}

/* Wrap a label to fit maxWidth, up to 3 lines (Espresso Machine Water
 * Chemistry has to live inside a triangle). */
function wrapLabel(text, font, maxWidth) {
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (ctx.measureText(trial).width <= maxWidth || !cur) cur = trial;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function drawProjectTri(pt, i, t) {
  const tr = tris[pt.triIdx];
  const a = verts[tr.i], b = verts[tr.j], c = verts[tr.k];
  const gx = (a.x + b.x + c.x) / 3, gy = (a.y + b.y + c.y) / 3;
  const active = i === hoverIdx || i === focusIdx;
  const P = [a, b, c].map((v) => [v.x, v.y]);
  pt.poly = P;

  ctx.beginPath();
  ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); ctx.lineTo(P[2][0], P[2][1]);
  ctx.closePath();
  // butter-cream base, then the tiny tiled emoji wash (same path, two fills)
  ctx.fillStyle = CREAM;
  ctx.fill();
  let icon = pt.p.icon;
  if (Array.isArray(icon)) {
    icon = reduceMotion ? icon[0] : icon[Math.floor(t / 1400) % icon.length];
  }
  if (icon) {
    // full-strength emojis on the solid cream base — no translucent wash
    ctx.fillStyle = emojiPattern(icon);
    ctx.fill();
  }
  ctx.strokeStyle = active ? HOVER_BORDER : ACCENT;
  ctx.lineWidth = active ? 3 : 1.75;
  ctx.stroke();

  // title at the centroid; hover swaps the short label for the full name
  const label = active ? pt.p.name : (pt.p.short || pt.p.name);
  const font = `700 ${active ? 14.5 : 13}px "Open Sans", system-ui, sans-serif`;
  const bboxW = Math.max(...P.map((q) => q[0])) - Math.min(...P.map((q) => q[0]));
  const lines = wrapLabel(label, font, Math.max(76, bboxW * 0.52));
  const lineH = active ? 19 : 17;
  let y = gy - (lines.length * lineH) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  for (const line of lines) {
    // cream halo keeps the title readable over the emoji tiling
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,246,223,0.9)";
    ctx.strokeText(line, gx, y + lineH / 2);
    ctx.fillStyle = INK_ON_CREAM;
    ctx.fillText(line, gx, y + lineH / 2);
    y += lineH;
  }
  ctx.textBaseline = "alphabetic";
}

function pointInPoly(x, y, P) {
  if (!P) return false;
  const [[x1, y1], [x2, y2], [x3, y3]] = P;
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  if (!d) return false;
  const l1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d;
  const l2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
  return l1 >= 0 && l2 >= 0 && l1 + l2 <= 1;
}

function hitTest(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = clientX - r.left, y = clientY - r.top;
  for (let i = projectTris.length - 1; i >= 0; i--) {
    if (pointInPoly(x, y, projectTris[i].poly)) return i;
  }
  return -1;
}

canvas.addEventListener("mousemove", (e) => {
  const h = hitTest(e.clientX, e.clientY);
  if (h === hoverIdx) return;
  hoverIdx = h;
  canvas.style.cursor = h >= 0 ? "pointer" : "";
  if (reduceMotion) draw(0);
});
canvas.addEventListener("mouseleave", () => {
  if (hoverIdx === -1) return;
  hoverIdx = -1; canvas.style.cursor = "";
  if (reduceMotion) draw(0);
});
canvas.addEventListener("click", (e) => {
  const h = hitTest(e.clientX, e.clientY);
  if (h >= 0) openModal(projectTris[h].p);
});

/* Invisible, focusable proxies so the triangles are keyboard-reachable (AC8). */
function syncFocusProxies() {
  const host = document.getElementById("tiles");
  host.innerHTML = "";
  projectTris.forEach((pt, i) => {
    const a = document.createElement("a");
    a.className = "tile-proxy";
    a.href = pt.p.link || "#";
    a.setAttribute("aria-label", pt.p.name + " — " + (pt.p.blurb || ""));
    a.addEventListener("focus", () => { focusIdx = i; if (reduceMotion) draw(0); });
    a.addEventListener("blur", () => { if (focusIdx === i) focusIdx = -1; if (reduceMotion) draw(0); });
    a.addEventListener("click", (e) => { e.preventDefault(); openModal(pt.p); });
    host.appendChild(a);
  });
}

/* ----------------------------- Modal ----------------------------- */
const modal = document.getElementById("modal");
const modalShot = document.querySelector(".modal-shot");
const modalTitle = document.getElementById("modal-title");
const modalBlurb = document.getElementById("modal-blurb");
const modalLink = document.getElementById("modal-link");
let lastFocus = null;

function openModal(p) {
  lastFocus = document.activeElement;
  modalTitle.textContent = p.short || p.name; // same title the triangle wears
  modalBlurb.textContent = p.blurb || "";

  // photos: [] beats screenshot; either renders as stacked images
  const shots = p.photos || (p.screenshot ? [p.screenshot] : []);
  modalShot.innerHTML = "";
  modalShot.style.display = shots.length ? "" : "none";
  shots.forEach((src, n) => {
    const im = document.createElement("img");
    im.src = src;
    im.alt = p.name + (shots.length > 1 ? ` photo ${n + 1}` : " screenshot");
    modalShot.appendChild(im);
  });

  // link states: real URL -> Visit; "internal" -> grayed non-button; else hidden
  if (p.link === "internal") {
    modalLink.hidden = false;
    modalLink.textContent = "Internal Only";
    modalLink.classList.add("disabled");
    modalLink.removeAttribute("href");
  } else if (p.link && p.link !== "private") {
    modalLink.hidden = false;
    modalLink.textContent = "Visit →";
    modalLink.classList.remove("disabled");
    modalLink.href = p.link;
  } else {
    modalLink.hidden = true;
  }

  modal.hidden = false;
  document.querySelector(".modal-close").focus();
  document.addEventListener("keydown", onKey);
}
function closeModal() {
  modal.hidden = true;
  document.removeEventListener("keydown", onKey);
  if (lastFocus) lastFocus.focus();
}
function onKey(e) {
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab") { // simple focus trap
    const f = modal.querySelectorAll("button, a[href]");
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));

/* ----------------------------- Boot ----------------------------- */
buildMesh();
start();

document.getElementById("reroll").addEventListener("click", () => {
  hoverIdx = -1;
  buildMesh();
  assignProjectTriangles(); // fresh jitter -> a whole new map
  if (reduceMotion) draw(0);
});

fetch("projects.json")
  .then((r) => r.json())
  .then((data) => {
    projects = data;
    assignProjectTriangles();
    if (reduceMotion) draw(0);
  })
  .catch((err) => console.error("projects.json failed to load", err));
