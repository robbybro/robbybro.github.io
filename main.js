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
// Placeholder modern palette (finalized in Step 3). Deep, low-key mesh tones so
// foreground text stays readable; project tiles carry the bright accents.
const STOPS = [
  [26, 32, 58],   // deep indigo
  [40, 30, 72],   // violet
  [22, 48, 66],   // teal-navy
  [46, 26, 54],   // plum
];
function mix(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}
function triColor(cx, cy, w, h, seed) {
  const fx = cx / w, fy = cy / h;
  const g = (fx * 0.6 + fy * 0.4 + STOPS.length) % STOPS.length;
  const i = Math.floor(g), t = g - i;
  const base = mix(STOPS[i], STOPS[(i + 1) % STOPS.length], t);
  const j = ((Math.sin(seed * 12.9898) * 43758.5453) % 1 + 1) % 1; // deterministic jitter
  const v = 1 + (j - 0.5) * 0.16;
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

  const cell = Math.max(78, Math.min(150, Math.round(Math.hypot(W, H) / 16)));
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
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (let i = 0; i < projectTris.length; i++) drawProjectTri(projectTris[i], i);
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
const PALETTE_FALLBACK = ["#7c5cff", "#00c2a8", "#ff6b6b", "#ffb84d", "#5b8cff", "#ff5c9e", "#2dd4bf", "#e4572e"];
const REST_SCALE = 1.14;   // project triangles sit slightly proud of the mesh
const ACTIVE_SCALE = 1.62; // hover/focus expansion

let projects = [];
let projectTris = [];  // {triIdx, p, img, poly}
let hoverIdx = -1;
let focusIdx = -1;
const imgCache = new Map();

function imgFor(p) {
  if (!p.screenshot) return null;
  if (imgCache.has(p.screenshot)) return imgCache.get(p.screenshot);
  const im = new Image();
  im.decoding = "async";
  im.src = p.screenshot;
  im.addEventListener("load", () => { if (reduceMotion) draw(0); });
  imgCache.set(p.screenshot, im);
  return im;
}

/* A project triangle must sit fully inside the viewport even when expanded,
 * with room under it for the hover label — otherwise the edge crops it. */
function fitsOnScreen(tr) {
  const vs = [verts[tr.i], verts[tr.j], verts[tr.k]];
  const gx = (vs[0].hx + vs[1].hx + vs[2].hx) / 3;
  const gy = (vs[0].hy + vs[1].hy + vs[2].hy) / 3;
  const PAD = 14, LABEL = 44;
  for (const v of vs) {
    const x = gx + (v.hx - gx) * ACTIVE_SCALE;
    const y = gy + (v.hy - gy) * ACTIVE_SCALE;
    if (x < PAD || x > W - PAD || y < PAD || y > H - LABEL) return false;
  }
  return true;
}

function homeArea(tr) {
  const a = verts[tr.i], b = verts[tr.j], c = verts[tr.k];
  return Math.abs((b.hx - a.hx) * (c.hy - a.hy) - (c.hx - a.hx) * (b.hy - a.hy)) / 2;
}

function assignProjectTriangles() {
  projectTris = [];
  for (const tr of tris) tr.project = null;
  if (!projects.length || !tris.length) return;

  const areas = tris.map(homeArea);
  const median = [...areas].sort((x, y) => x - y)[Math.floor(areas.length * 0.55)] || 0;
  const claimed = new Set();

  for (const p of projects) {
    const tx = (p.pos && p.pos[0] != null ? p.pos[0] : 0.5) * W;
    const ty = (p.pos && p.pos[1] != null ? p.pos[1] : 0.5) * H;
    let best = -1, bestD = Infinity;
    for (let idx = 0; idx < tris.length; idx++) {
      const tr = tris[idx];
      if (tr.project) continue;
      if (areas[idx] < median) continue;
      // sharing a vertex with an already-claimed triangle => possible overlap
      if (claimed.has(tr.i) || claimed.has(tr.j) || claimed.has(tr.k)) continue;
      if (!fitsOnScreen(tr)) continue; // never pick one the viewport would clip
      const cx = (verts[tr.i].hx + verts[tr.j].hx + verts[tr.k].hx) / 3;
      const cy = (verts[tr.i].hy + verts[tr.j].hy + verts[tr.k].hy) / 3;
      const d = (cx - tx) ** 2 + (cy - ty) ** 2;
      if (d < bestD) { bestD = d; best = idx; }
    }
    if (best < 0) continue;
    const tr = tris[best];
    tr.project = p;
    for (const v of [tr.i, tr.j, tr.k]) {
      claimed.add(v);
      verts[v].amp *= 0.4; // damp the wave so the screenshot stays readable
    }
    projectTris.push({ triIdx: best, p, img: imgFor(p), poly: null });
  }
  syncFocusProxies();
}

function drawProjectTri(pt, i) {
  const tr = tris[pt.triIdx];
  const a = verts[tr.i], b = verts[tr.j], c = verts[tr.k];
  const gx = (a.x + b.x + c.x) / 3, gy = (a.y + b.y + c.y) / 3;
  const active = i === hoverIdx || i === focusIdx;
  const s = active ? ACTIVE_SCALE : REST_SCALE;
  const P = [a, b, c].map((v) => [gx + (v.x - gx) * s, gy + (v.y - gy) * s]);
  pt.poly = P;

  const xs = P.map((q) => q[0]), ys = P.map((q) => q[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const accent = pt.p.accent || PALETTE_FALLBACK[i % PALETTE_FALLBACK.length];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); ctx.lineTo(P[2][0], P[2][1]);
  ctx.closePath();
  ctx.clip();

  const im = pt.img;
  if (im && im.complete && im.naturalWidth) {
    const bw = maxX - minX, bh = maxY - minY;
    const sc = Math.max(bw / im.naturalWidth, bh / im.naturalHeight);
    const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
    ctx.drawImage(im, minX + (bw - dw) / 2, minY + (bh - dh) / 2, dw, dh);
    ctx.fillStyle = active ? "rgba(8,11,20,0.12)" : "rgba(8,11,20,0.46)";
    ctx.fillRect(minX, minY, bw, bh);
  } else {
    ctx.fillStyle = accent;
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    ctx.fillStyle = "rgba(8,11,20,0.28)";
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); ctx.lineTo(P[2][0], P[2][1]);
  ctx.closePath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = active ? 3 : 1.75;
  ctx.stroke();

  // title sits under the triangle's fat edge, never inside the acute apex
  const label = active ? pt.p.name : null;
  if (label) {
    ctx.font = '700 15px "Open Sans", system-ui, sans-serif';
    ctx.textAlign = "center";
    const tw = ctx.measureText(label).width;
    const ly = maxY + 22;
    ctx.fillStyle = "rgba(8,11,20,0.92)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    const bx = gx - tw / 2 - 10, bw2 = tw + 20;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, ly - 17, bw2, 26, 8);
    else ctx.rect(bx, ly - 17, bw2, 26);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText(label, gx, ly);
  }
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
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalBlurb = document.getElementById("modal-blurb");
const modalLink = document.getElementById("modal-link");
let lastFocus = null;

function openModal(p) {
  lastFocus = document.activeElement;
  modalTitle.textContent = p.name;
  modalBlurb.textContent = p.blurb || "";
  const hasShot = !!p.screenshot;
  modalImg.parentElement.style.display = hasShot ? "" : "none";
  if (hasShot) { modalImg.src = p.screenshot; modalImg.alt = p.name + " screenshot"; }
  const hasLink = p.link && p.link !== "private";
  modalLink.hidden = !hasLink;
  if (hasLink) modalLink.href = p.link;
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

fetch("projects.json")
  .then((r) => r.json())
  .then((data) => {
    projects = data;
    assignProjectTriangles();
    if (reduceMotion) draw(0);
  })
  .catch((err) => console.error("projects.json failed to load", err));
