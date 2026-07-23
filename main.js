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
    const a = verts[tr.i], b = verts[tr.j], c = verts[tr.k];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    ctx.fillStyle = tr.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
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
  resizeT = setTimeout(() => { buildMesh(); if (reduceMotion) draw(0); }, 150);
});

/* ----------------------------- Tiles ----------------------------- */
const PALETTE_FALLBACK = ["#7c5cff", "#00c2a8", "#ff6b6b", "#ffb84d", "#5b8cff", "#ff5c9e", "#2dd4bf", "#e4572e"];

function placeTiles(projects) {
  const host = document.getElementById("tiles");
  host.innerHTML = "";
  projects.forEach((p, idx) => {
    const pos = p.pos || [0.5, 0.5];
    const accent = p.accent || PALETTE_FALLBACK[idx % PALETTE_FALLBACK.length];
    const wrap = document.createElement("div");
    wrap.className = "tile-wrap";

    const a = document.createElement("a");
    a.className = "tile";
    a.style.setProperty("--accent", accent);
    a.style.left = pos[0] * 100 + "%";
    a.style.top = pos[1] * 100 + "%";
    a.href = p.link && p.link !== "private" ? p.link : "#";
    a.setAttribute("aria-label", p.name + " — " + p.blurb);
    a.innerHTML = `<span class="glyph">${(p.name || "?")[0]}</span>`;

    const label = document.createElement("span");
    label.className = "tile-label";
    label.textContent = p.name;
    label.style.left = pos[0] * 100 + "%";
    label.style.top = `calc(${pos[1] * 100}% + ${(p.size || 132) * 0.6}px)`;

    a.addEventListener("click", (e) => { e.preventDefault(); openModal(p); });
    wrap.appendChild(a);
    wrap.appendChild(label);
    host.appendChild(wrap);
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
  .then(placeTiles)
  .catch((err) => console.error("projects.json failed to load", err));
