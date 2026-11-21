// Bike fit math. Pure: no DOM, no storage, no network. Runs in the page and under `node --test`.
//
// Conventions used everywhere below
//   image space   pixels, x right, y down (what the video shows)
//   level space   image space rotated so the marked level line is horizontal
//   bike space    origin at the bottom bracket estimate; "ahead" is the way the rider faces, "above" is up
//   crank angle   degrees, 0 at top dead center, 90 with the foot forward, increasing as the rider pedals

const SIDE_INDEX = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27, heel: 29, toe: 31 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28, heel: 30, toe: 32 },
};
export const JOINTS = ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle', 'heel', 'toe'];

// The pose model reports a 0..1 visibility per landmark; below this a joint counts as not seen.
const MIN_VISIBILITY = 0.5;
// Gaps this short are bridged by straight-line interpolation; longer ones are reported as lost.
const MAX_BRIDGED_GAP = 3;
// Where the ball of the foot sits on the heel-to-toe line. The cleat, and so the pedal axle, is under it.
export const BALL_OF_FOOT_FRACTION = 0.67;
// Left and right shoulders (and hips) overlap in a side view. Past this share of torso length they do not.
const SIDE_ON_LIMIT = 0.45;
// A pedal stroke outside 20 to 200 revolutions per minute is a tracking artifact, not pedaling.
const MIN_STROKE_SECONDS = 0.3;
const MAX_STROKE_SECONDS = 3;
// Chart resolution: one sample every 5 degrees of crank angle.
export const CURVE_STEP_DEGREES = 5;
const CURVE_BINS = 360 / CURVE_STEP_DEGREES;
// Past this the two videos' pedal circles imply different rider sizes and millimeters are not trusted.
export const SCALE_DISAGREEMENT_LIMIT_PERCENT = 5;

export const DIRECTION = {
  raise: 'Raise',
  lower: 'Lower',
  back: 'Move back',
  forward: 'Move forward',
  lengthen: 'Lengthen reach',
  shorten: 'Shorten reach',
  none: 'No change; within measurement spread',
};

// ---------- small numeric helpers ----------

const RAD = Math.PI / 180;

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mean(values) {
  let t = 0;
  for (const v of values) t += v;
  return t / values.length;
}

// Sample standard deviation between pedal strokes; 0 when there is only one stroke.
function spread(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  let t = 0;
  for (const v of values) t += (v - m) * (v - m);
  return Math.sqrt(t / (values.length - 1));
}

function summarize(values) {
  return { median: median(values), spread: spread(values), strokes: values.length };
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Interior angle at b, in degrees, between the rays b->a and b->c.
export function jointAngle(a, b, c) {
  const ux = a[0] - b[0], uy = a[1] - b[1], vx = c[0] - b[0], vy = c[1] - b[1];
  const d = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (d === 0) return NaN;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / d))) / RAD;
}

// Least-squares circle through points (the algebraic fit, exact for points on a circle),
// refit once without the points farthest from it so a few bad foot detections do not move the center.
export function fitCircle(points) {
  const once = (pts) => {
    let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
    const n = pts.length;
    for (const [x, y] of pts) {
      const z = x * x + y * y;
      sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z;
    }
    // Normal equations for z = 2*cx*x + 2*cy*y + k, solved by Cramer's rule.
    const a = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]];
    const b = [sxz, syz, sz];
    const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
      - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
      + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const d = det3(a);
    if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
    const col = (i) => a.map((row, r) => row.map((v, c) => (c === i ? b[r] : v)));
    const cx = det3(col(0)) / d / 2, cy = det3(col(1)) / d / 2, k = det3(col(2)) / d;
    const r2 = k + cx * cx + cy * cy;
    if (!(r2 > 0)) return null;
    return { cx, cy, r: Math.sqrt(r2) };
  };
  if (points.length < 5) return null;
  let fit = once(points);
  if (!fit) return null;
  const residual = (p, f) => Math.abs(Math.hypot(p[0] - f.cx, p[1] - f.cy) - f.r);
  const res = points.map((p) => residual(p, fit));
  const limit = 3 * 1.4826 * median(res);
  if (limit > 0) {
    const kept = points.filter((p, i) => res[i] <= limit);
    if (kept.length >= points.length * 0.8) fit = once(kept) || fit;
  }
  let t = 0;
  for (const p of points) t += residual(p, fit) ** 2;
  return { ...fit, rms: Math.sqrt(t / points.length) };
}

// ---------- reading the pose frames ----------

// frames: one entry per video frame, null when no person was found, else 33 landmarks of [x, y, z, visibility]
// with x and y as fractions of the frame. Decides which way the rider faces and which side faces the camera.
export function pickNearSide(frames, width = 1, height = 1) {
  const seen = { left: 0, right: 0 };
  const apart = [], torso = [];
  let toward = 0, count = 0;
  for (const f of frames) {
    if (!f) continue;
    count++;
    const midX = (i, j) => (f[i][0] + f[j][0]) / 2 * width;
    const midY = (i, j) => (f[i][1] + f[j][1]) / 2 * height;
    toward += midX(15, 16) - midX(23, 24);
    for (const side of ['left', 'right']) {
      const ix = SIDE_INDEX[side];
      seen[side] += (f[ix.elbow][3] + f[ix.wrist][3] + f[ix.knee][3] + f[ix.ankle][3]) / 4;
    }
    apart.push((Math.abs(f[11][0] - f[12][0]) + Math.abs(f[23][0] - f[24][0])) / 2 * width);
    torso.push(Math.hypot(midX(11, 12) - midX(23, 24), midY(11, 12) - midY(23, 24)));
  }
  if (!count) return null;
  const facing = toward < 0 ? 'left' : 'right';
  // The limbs the camera can see score higher. When the two sides score alike, a rider facing
  // image-left is showing the left side and a rider facing image-right the right side.
  let side = facing;
  if (Math.abs(seen.left - seen.right) / count > 0.1) side = seen.left > seen.right ? 'left' : 'right';
  const torsoLength = median(torso);
  const sideOnRatio = torsoLength > 0 ? median(apart) / torsoLength : Infinity;
  return { facing, side, sideOn: sideOnRatio < SIDE_ON_LIMIT, sideOnRatio, framesWithRider: count };
}

function contiguousRuns(flags) {
  const runs = [];
  let start = -1;
  for (let i = 0; i <= flags.length; i++) {
    if (i < flags.length && flags[i]) { if (start < 0) start = i; }
    else if (start >= 0) { runs.push([start, i - 1]); start = -1; }
  }
  return runs;
}

// Near-side joints in image pixels. Returns per-joint arrays (null where lost), the tracked runs
// and the lost ranges (1-based frame numbers, as a person reads them).
function extractTrack(frames, side, width, height) {
  const ix = SIDE_INDEX[side];
  const n = frames.length;
  const track = {};
  for (const j of JOINTS) track[j] = new Array(n).fill(null);
  const ok = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    const f = frames[i];
    if (!f) continue;
    if (!JOINTS.every((j) => f[ix[j]] && f[ix[j]][3] >= MIN_VISIBILITY && Number.isFinite(f[ix[j]][0]) && Number.isFinite(f[ix[j]][1]))) continue;
    ok[i] = true;
    for (const j of JOINTS) track[j][i] = [f[ix[j]][0] * width, f[ix[j]][1] * height];
  }
  // Bridge short gaps that have tracked frames on both sides.
  for (const [a, b] of contiguousRuns(ok.map((v) => !v))) {
    if (a === 0 || b === n - 1 || b - a + 1 > MAX_BRIDGED_GAP) continue;
    for (let i = a; i <= b; i++) {
      const t = (i - (a - 1)) / (b + 1 - (a - 1));
      for (const j of JOINTS) {
        const p = track[j][a - 1], q = track[j][b + 1];
        track[j][i] = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      }
      ok[i] = true;
    }
  }
  return { track, runs: contiguousRuns(ok), lost: contiguousRuns(ok.map((v) => !v)).map(([a, b]) => [a + 1, b + 1]) };
}

// Five-point quadratic smoothing. Unlike a moving average it does not shrink a circular path,
// so the pedal circle and the peaks of the knee angle survive it.
function smoothRun(points, a, b) {
  const out = points.slice();
  const w = [-3, 12, 17, 12, -3];
  for (let i = a + 2; i <= b - 2; i++) {
    let x = 0, y = 0;
    for (let k = -2; k <= 2; k++) { x += w[k + 2] * points[i + k][0]; y += w[k + 2] * points[i + k][1]; }
    out[i] = [x / 35, y / 35];
  }
  return out;
}

// Value and position of the largest (sign = 1) or smallest (sign = -1) sample between two fractional
// frame positions, refined by a parabola through the extreme sample and its neighbors: at 30 frames
// per second the true peak falls between frames.
function refinedExtreme(series, from, to, sign, runStart, runEnd) {
  let best = -1;
  for (let i = Math.ceil(from); i < to && i <= runEnd; i++) {
    if (best < 0 || sign * series[i] > sign * series[best]) best = i;
  }
  if (best < 0) return NaN;
  if (best - 1 < runStart || best + 1 > runEnd) return series[best];
  const y0 = series[best - 1], y1 = series[best], y2 = series[best + 1];
  const curve = y0 - 2 * y1 + y2;
  if (sign * curve >= 0) return y1;
  const shift = Math.max(-0.5, Math.min(0.5, 0.5 * (y0 - y2) / curve));
  return y1 - 0.25 * (y0 - y2) * shift;
}

// Value a fraction t of the way from sample j to sample j + 1, on a smooth curve through the four
// surrounding samples (a straight line would cut the top off the knee angle's peak).
function between(series, j, t, runStart, runEnd) {
  const p1 = series[j], p2 = series[j + 1];
  const p0 = j - 1 >= runStart ? series[j - 1] : 2 * p1 - p2;
  const p3 = j + 2 <= runEnd ? series[j + 2] : 2 * p2 - p1;
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
}

// ---------- one video ----------

// input:  { frames, width, height, framesPerSecond, levelLine }
//         levelLine is null or [[x1, y1], [x2, y2]] as fractions of the frame, along something level.
// output: { ok: true, ... } or { ok: false, reason: 'tracking-lost' | 'not-side-on' | 'no-stroke', lost }
export function analyze({ frames, width, height, framesPerSecond, levelLine = null }) {
  const n = frames.length;
  const fail = (reason, lost = []) => ({ ok: false, reason, lost, frameCount: n });
  const pose = pickNearSide(frames, width, height);
  if (!pose) return fail('tracking-lost', n ? [[1, n]] : []);
  const { track, runs, lost } = extractTrack(frames, pose.side, width, height);
  const trackedCount = runs.reduce((t, [a, b]) => t + b - a + 1, 0);
  if (trackedCount < Math.max(5, n / 2)) return fail(pose.sideOn ? 'tracking-lost' : 'not-side-on', lost);
  if (!pose.sideOn) return fail('not-side-on', lost);

  // Camera roll, read from the marked level line. Positive = the level line drops toward image-right.
  let rollDegrees = 0;
  if (levelLine) {
    let dx = (levelLine[1][0] - levelLine[0][0]) * width, dy = (levelLine[1][1] - levelLine[0][1]) * height;
    if (dx < 0) { dx = -dx; dy = -dy; }
    if (Math.hypot(dx, dy) > 0) rollDegrees = Math.atan2(dy, dx) / RAD;
  }
  const cosR = Math.cos(rollDegrees * RAD), sinR = Math.sin(rollDegrees * RAD);
  const toLevel = (p) => [cosR * p[0] + sinR * p[1], -sinR * p[0] + cosR * p[1]];
  const toImage = (p) => [cosR * p[0] - sinR * p[1], sinR * p[0] + cosR * p[1]];

  const tracked = (i) => track.hip[i] !== null;
  const level = {};   // unsmoothed, level space
  const smooth = {};  // smoothed, level space
  for (const j of JOINTS) {
    level[j] = track[j].map((p) => (p ? toLevel(p) : null));
    smooth[j] = level[j];
    for (const [a, b] of runs) smooth[j] = smoothRun(smooth[j], a, b);
  }
  const ballOf = (set, i) => [
    set.heel[i][0] + (set.toe[i][0] - set.heel[i][0]) * BALL_OF_FOOT_FRACTION,
    set.heel[i][1] + (set.toe[i][1] - set.heel[i][1]) * BALL_OF_FOOT_FRACTION,
  ];

  const fwd = pose.facing === 'left' ? -1 : 1;
  const strokeSeconds = (s) => (s.end - s.start) / framesPerSecond;
  const plausible = (s) => strokeSeconds(s) >= MIN_STROKE_SECONDS && strokeSeconds(s) <= MAX_STROKE_SECONDS;

  // Crank angle per frame about a given center, unwrapped within each tracked run and held
  // non-decreasing so jitter near top dead center cannot count one stroke twice. Strokes run from one
  // top dead center to the next, at fractional frame positions.
  const followCrank = (centerAt) => {
    const crank = new Array(n).fill(null), turns = new Array(n).fill(null), strokes = [];
    let netAdvance = 0;
    for (const [a, b] of runs) {
      let prev = null, total = 0, high = -Infinity;
      for (let i = a; i <= b; i++) {
        const p = ballOf(smooth, i), c = centerAt(i);
        let deg = Math.atan2(fwd * (p[0] - c[0]), -(p[1] - c[1])) / RAD;
        if (deg < 0) deg += 360;
        crank[i] = deg;
        if (prev !== null) {
          let step = deg - prev;
          if (step > 180) step -= 360;
          if (step < -180) step += 360;
          total += step;
        } else total = deg;
        prev = deg;
        high = Math.max(high, total);
        turns[i] = high;
      }
      netAdvance += total - crank[a];
      let previous = null;
      for (let k = Math.floor(turns[a] / 360) + 1; k * 360 <= turns[b]; k++) {
        let i = a + 1;
        while (turns[i] < k * 360) i++;
        const at = i - 1 + (k * 360 - turns[i - 1]) / (turns[i] - turns[i - 1]);
        if (previous !== null) strokes.push({ start: previous, end: at, turn: k - 1, run: [a, b] });
        previous = at;
      }
    }
    return { crank, turns, strokes, netAdvance };
  };

  // First pass: one circle through the whole unsmoothed ball-of-foot path gives a rough bottom bracket
  // and, from it, how many frames one pedal stroke takes.
  const ballPath = [];
  for (let i = 0; i < n; i++) if (tracked(i)) ballPath.push(ballOf(level, i));
  const whole = fitCircle(ballPath);
  const longSide = Math.max(width, height);
  if (!whole || !(whole.r > 0.01 * longSide) || whole.r > longSide) return fail('no-stroke', lost);
  const rough = followCrank(() => [whole.cx, whole.cy]);
  const roughStrokes = rough.strokes.filter(plausible);
  if (rough.netAdvance < 360 || !roughStrokes.length) return fail(lost.length ? 'tracking-lost' : 'no-stroke', lost);

  // Second pass: a hand-held camera drifts, which moves the bottom bracket in the picture. So the
  // center is fitted again around every frame, from the two pedal strokes that surround it.
  const windowFrames = Math.round(2 * median(roughStrokes.map((s) => s.end - s.start)));
  const centers = new Array(n).fill(null);
  const radii = [];
  for (const [a, b] of runs) {
    const length = Math.min(windowFrames, b - a + 1);
    const fits = new Map();
    for (let i = a; i <= b; i++) {
      const start = Math.max(a, Math.min(b - length + 1, i - (length >> 1)));
      if (!fits.has(start)) {
        const pts = [];
        for (let k = start; k < start + length; k++) pts.push(ballOf(level, k));
        const local = length >= windowFrames ? fitCircle(pts) : null;
        fits.set(start, local && local.r < 2 * whole.r ? local : null);
      }
      const local = fits.get(start);
      centers[i] = local ? [local.cx, local.cy] : [whole.cx, whole.cy];
      if (local) radii.push(local.r);
    }
  }
  const radius = radii.length ? median(radii) : whole.r;
  let squares = 0, drift = 0, first = null;
  for (let i = 0; i < n; i++) {
    if (!tracked(i)) continue;
    squares += (dist(ballOf(level, i), centers[i]) - radius) ** 2;
    first = first || centers[i];
    drift = Math.max(drift, dist(centers[i], first));
  }
  const ahead = (p, i) => fwd * (p[0] - centers[i][0]);
  const above = (p, i) => -(p[1] - centers[i][1]);
  const { crank, turns, strokes, netAdvance } = followCrank((i) => centers[i]);
  if (netAdvance < 360) return fail('no-stroke', lost);

  // Per-frame joint angles from the smoothed, level track.
  const series = { knee: [], hip: [], ankle: [], torso: [], shoulder: [], elbow: [] };
  for (let i = 0; i < n; i++) {
    if (!tracked(i)) { for (const k in series) series[k].push(null); continue; }
    const s = smooth;
    series.knee.push(jointAngle(s.hip[i], s.knee[i], s.ankle[i]));
    series.hip.push(jointAngle(s.shoulder[i], s.hip[i], s.knee[i]));
    series.ankle.push(jointAngle(s.knee[i], s.ankle[i], s.toe[i]));
    series.shoulder.push(jointAngle(s.hip[i], s.shoulder[i], s.elbow[i]));
    series.elbow.push(jointAngle(s.shoulder[i], s.elbow[i], s.wrist[i]));
    series.torso.push(Math.atan2(-(s.shoulder[i][1] - s.hip[i][1]), fwd * (s.shoulder[i][0] - s.hip[i][0])) / RAD);
  }

  const usable = strokes.filter(plausible);
  if (!usable.length) return fail(lost.length ? 'tracking-lost' : 'no-stroke', lost);

  const perStroke = {
    cadence: [], kneeBottom: [], kneeTop: [], hipClosed: [], torso: [], shoulder: [], elbow: [],
    ankleSmallest: [], ankleLargest: [], ankleRange: [],
    hipBehind: [], hipAbove: [], wristAhead: [], wristAbove: [],
  };
  const curveSamples = { knee: [], hip: [], ankle: [] };
  for (const s of usable) {
    const [a, b] = s.run;
    const inside = [];
    for (let i = Math.ceil(s.start); i < s.end; i++) inside.push(i);
    const avg = (fn) => mean(inside.map(fn));
    const extreme = (name, sign) => refinedExtreme(series[name], s.start, s.end, sign, a, b);
    perStroke.cadence.push(60 * framesPerSecond / (s.end - s.start));
    perStroke.kneeBottom.push(extreme('knee', 1));
    perStroke.kneeTop.push(extreme('knee', -1));
    perStroke.hipClosed.push(extreme('hip', -1));
    perStroke.torso.push(avg((i) => series.torso[i]));
    perStroke.shoulder.push(avg((i) => series.shoulder[i]));
    perStroke.elbow.push(avg((i) => series.elbow[i]));
    const ankleLow = extreme('ankle', -1), ankleHigh = extreme('ankle', 1);
    perStroke.ankleSmallest.push(ankleLow);
    perStroke.ankleLargest.push(ankleHigh);
    perStroke.ankleRange.push(ankleHigh - ankleLow);
    perStroke.hipBehind.push(avg((i) => -ahead(level.hip[i], i)));
    perStroke.hipAbove.push(avg((i) => above(level.hip[i], i)));
    perStroke.wristAhead.push(avg((i) => ahead(level.wrist[i], i)));
    perStroke.wristAbove.push(avg((i) => above(level.wrist[i], i)));
    // Resample this stroke at fixed crank angles for the charts.
    for (const name of ['knee', 'hip', 'ankle']) {
      const row = new Array(CURVE_BINS).fill(null);
      let j = Math.max(a, Math.floor(s.start));
      for (let bin = 0; bin < CURVE_BINS; bin++) {
        const target = s.turn * 360 + bin * CURVE_STEP_DEGREES;
        while (j + 1 <= b && turns[j + 1] < target) j++;
        if (j + 1 > b || turns[j] > target) continue;
        const span = turns[j + 1] - turns[j];
        const t = span > 0 ? (target - turns[j]) / span : 0;
        row[bin] = between(series[name], j, t, a, b);
      }
      curveSamples[name].push(row);
    }
  }
  const measures = {};
  for (const k of MEASURE_KEYS) measures[k] = summarize(perStroke[k]);
  const positionPixels = {};
  for (const k of POSITION_KEYS) positionPixels[k] = summarize(perStroke[k]);
  const curves = {};
  for (const name of ['knee', 'hip', 'ankle']) {
    curves[name] = { median: [], spread: [] };
    for (let bin = 0; bin < CURVE_BINS; bin++) {
      const column = curveSamples[name].map((row) => row[bin]).filter((v) => v !== null);
      curves[name].median.push(column.length ? median(column) : null);
      curves[name].spread.push(column.length ? spread(column) : null);
    }
  }

  // The rider's own leg is the ruler the two videos share.
  const lengths = { thigh: [], shin: [] };
  for (let i = 0; i < n; i++) {
    if (!tracked(i)) continue;
    lengths.thigh.push(dist(level.hip[i], level.knee[i]));
    lengths.shin.push(dist(level.knee[i], level.ankle[i]));
  }
  const middle = usable[usable.length >> 1];
  // Strokes the rider pedaled between the first and last top dead center seen, including any that
  // lost tracking cut out: the "M" in "based on N of M strokes".
  const pedaled = Math.round((strokes[strokes.length - 1].end - strokes[0].start) / median(usable.map((s) => s.end - s.start)));
  return {
    ok: true,
    frameCount: n,
    framesPerSecond,
    facing: pose.facing,
    side: pose.side,
    lost,
    strokesFound: Math.max(pedaled, usable.length),
    strokesUsed: usable.length,
    rollDegrees,
    // radius and fitError in pixels; centers are the per-frame bottom bracket estimates in image pixels.
    pedalCircle: { radius, fitError: Math.sqrt(squares / trackedCount), centers: centers.map((c) => (c ? toImage(c) : null)) },
    cameraDriftPixels: drift,
    legPixels: median(lengths.thigh) + median(lengths.shin),
    measures,
    positionPixels,
    curves,
    crankDegrees: crank,
    referenceStroke: { start: middle.start, end: middle.end },
    // Smoothed near-side joints back in image pixels, for drawing on the video.
    skeleton: Object.fromEntries(JOINTS.map((j) => [j, smooth[j].map((p) => (p ? toImage(p) : null))])),
  };
}

// The frame that shows a given crank angle, taken from a stroke in the middle of the clip.
export function frameForCrankAngle(result, degrees) {
  const { start, end } = result.referenceStroke;
  const wanted = ((degrees % 360) + 360) % 360;
  let best = Math.round(start), bestGap = Infinity;
  for (let i = Math.ceil(start); i < end; i++) {
    if (result.crankDegrees[i] === null) continue;
    let gap = Math.abs(result.crankDegrees[i] - wanted);
    if (gap > 180) gap = 360 - gap;
    if (gap < bestGap) { bestGap = gap; best = i; }
  }
  return best;
}

// ---------- two videos ----------

// Millimeters per pixel for each video.
// Each bike's pedal circle and crank length give that video a scale; the rider's leg (thigh plus shin)
// must then come out the same length on both. The leg length is averaged and becomes the shared ruler,
// and the gap between the two pedal-circle readings is reported.
export function resolveScale(kickr, open, kickrCrank, openCrank) {
  const pedal = (r, crank) => (r && r.ok && crank > 0 ? crank / r.pedalCircle.radius : null);
  const a = pedal(kickr, kickrCrank), b = pedal(open, openCrank);
  const legA = a ? a * kickr.legPixels : null, legB = b ? b * open.legPixels : null;
  const out = { kickr: null, open: null, legMillimeters: null, disagreementPercent: null, agrees: true, source: { kickr: null, open: null } };
  if (legA === null && legB === null) return out;
  const leg = legA !== null && legB !== null ? (legA + legB) / 2 : (legA ?? legB);
  out.legMillimeters = leg;
  if (kickr && kickr.ok) { out.kickr = leg / kickr.legPixels; out.source.kickr = a ? 'pedal circle' : 'leg length'; }
  if (open && open.ok) { out.open = leg / open.legPixels; out.source.open = b ? 'pedal circle' : 'leg length'; }
  if (legA !== null && legB !== null) {
    out.disagreementPercent = 100 * (legB - legA) / leg;
    out.agrees = Math.abs(out.disagreementPercent) <= SCALE_DISAGREEMENT_LIMIT_PERCENT;
    out.legByPedalCircle = { kickr: legA, open: legB };
  }
  return out;
}

const combined = (a, b) => Math.hypot(a, b);

function differenceRow(key, unit, a, b, factorA = 1, factorB = 1) {
  const row = { key, unit, kickr: null, open: null, difference: null };
  if (a) row.kickr = { value: a.median * factorA, spread: a.spread * factorA, strokes: a.strokes };
  if (b) row.open = { value: b.median * factorB, spread: b.spread * factorB, strokes: b.strokes };
  if (row.kickr && row.open) row.difference = { value: row.open.value - row.kickr.value, spread: combined(row.kickr.spread, row.open.spread) };
  return row;
}

export const MEASURE_KEYS = ['cadence', 'kneeBottom', 'kneeTop', 'hipClosed', 'torso', 'shoulder', 'elbow', 'ankleSmallest', 'ankleLargest', 'ankleRange'];
export const POSITION_KEYS = ['hipBehind', 'hipAbove', 'wristAhead', 'wristAbove'];
export const ADJUSTMENTS = [
  { key: 'saddleHeight', from: 'hipAbove', more: DIRECTION.raise, less: DIRECTION.lower },
  { key: 'saddleSetback', from: 'hipBehind', more: DIRECTION.back, less: DIRECTION.forward },
  { key: 'barReach', from: 'wristAhead', more: DIRECTION.lengthen, less: DIRECTION.shorten },
  { key: 'barHeight', from: 'wristAbove', more: DIRECTION.raise, less: DIRECTION.lower },
];

// kickr / open: results of analyze() or null. Returns the comparison table rows, the scale report and
// the four adjustments that would move the Kickr Shift position onto the Open position.
// Adjustment status: 'needs-open' | 'needs-crank' | 'scale-disagrees' | 'no-change' | 'change'.
export function compare(kickr, open, kickrCrank, openCrank) {
  const A = kickr && kickr.ok ? kickr : null, B = open && open.ok ? open : null;
  const scale = resolveScale(A, B, kickrCrank, openCrank);
  const rows = MEASURE_KEYS.map((k) => differenceRow(k, k === 'cadence' ? 'revolutions per minute' : 'degrees', A && A.measures[k], B && B.measures[k]));
  const positions = POSITION_KEYS.map((k) => differenceRow(k, 'millimeters',
    A && scale.kickr ? A.positionPixels[k] : null, B && scale.open ? B.positionPixels[k] : null, scale.kickr || 1, scale.open || 1));
  const adjustments = ADJUSTMENTS.map((adj) => {
    const out = { key: adj.key, status: 'change', direction: null, millimeters: null, spread: null };
    const row = positions.find((p) => p.key === adj.from);
    if (!B) out.status = 'needs-open';
    else if (!A) out.status = 'needs-kickr';
    else if (!row.difference) out.status = 'needs-crank';
    else if (!scale.agrees) out.status = 'scale-disagrees';
    else {
      out.millimeters = Math.round(Math.abs(row.difference.value));
      out.spread = Math.round(row.difference.spread);
      if (out.millimeters === 0 || Math.abs(row.difference.value) <= row.difference.spread) {
        out.status = 'no-change';
        out.direction = DIRECTION.none;
      } else out.direction = row.difference.value > 0 ? adj.more : adj.less;
    }
    return out;
  });
  return { rows, positions, adjustments, scale };
}

// ---------- fit numbers arriving from outside (import link, localStorage) ----------

export const IMPORT_PREFIX = '#fit=';
export const IMPORT_MAX_LENGTH = 4096;
export const FIT_NUMBER_KEYS = ['saddleHeight', 'saddleBehind', 'saddleAbove', 'barAhead', 'barAbove', 'hoodAhead', 'hoodAbove', 'crankLength'];
const FIT_ANGLE_KEYS = ['hoodAngle'];
const LABEL_KEYS = ['label', 'bike'];
const MAX_RIDERS = 2;
const LABEL_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/+-]{0,39}$/u;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function hasForbiddenKey(value, depth = 0) {
  if (depth > 6) return true;
  if (Array.isArray(value)) return value.some((v) => hasForbiddenKey(v, depth + 1));
  if (!isPlainObject(value)) return false;
  return Object.keys(value).some((k) => FORBIDDEN_KEYS.has(k) || hasForbiddenKey(value[k], depth + 1));
}

// Copies the allowlisted numbers out of one untrusted object into a fresh one.
// Returns null when any allowlisted key holds something that is not an acceptable number.
export function sanitizeFitNumbers(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  for (const k of FIT_NUMBER_KEYS) {
    if (!Object.hasOwn(raw, k)) continue;
    const v = raw[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 2000) return null;
    out[k] = v;
  }
  for (const k of FIT_ANGLE_KEYS) {
    if (!Object.hasOwn(raw, k)) continue;
    const v = raw[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < -90 || v > 90) return null;
    out[k] = v;
  }
  return out;
}

// Validates an untrusted fit sheet (decoded import link or localStorage read-back).
// Returns a fresh { version, videoRider, riders: [{ label, bike?, ...numbers }] } or null. Nothing is
// repaired: one bad value rejects the whole sheet, so a crafted link changes nothing.
export function sanitizeFitSheet(raw) {
  if (!isPlainObject(raw) || hasForbiddenKey(raw)) return null;
  if (raw.version !== 1 || !Array.isArray(raw.riders) || raw.riders.length < 1 || raw.riders.length > MAX_RIDERS) return null;
  const riders = [];
  for (const r of raw.riders) {
    const numbers = sanitizeFitNumbers(r);
    if (!numbers) return null;
    const rider = {};
    for (const k of LABEL_KEYS) {
      if (!Object.hasOwn(r, k)) continue;
      if (typeof r[k] !== 'string' || !LABEL_PATTERN.test(r[k])) return null;
      rider[k] = r[k];
    }
    if (!rider.label) return null;
    riders.push({ ...rider, ...numbers });
  }
  let videoRider = riders.length - 1;
  if (Object.hasOwn(raw, 'videoRider')) {
    if (!Number.isInteger(raw.videoRider) || raw.videoRider < 0 || raw.videoRider >= riders.length) return null;
    videoRider = raw.videoRider;
  }
  return { version: 1, videoRider, riders };
}

// hash: location.hash. Returns { present: false } when the fragment is not an import link,
// { present: true, sheet } when it is valid and { present: true, sheet: null } when it is not.
export function readImportFragment(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(IMPORT_PREFIX)) return { present: false, sheet: null };
  if (hash.length > IMPORT_MAX_LENGTH) return { present: true, sheet: null };
  try {
    const b64 = hash.slice(IMPORT_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return { present: true, sheet: null };
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { present: true, sheet: sanitizeFitSheet(JSON.parse(text)) };
  } catch {
    return { present: true, sheet: null };
  }
}

// The same encoding the import link uses; the page never calls it (links are minted elsewhere), tests do.
export function encodeImportFragment(sheet) {
  const bytes = new TextEncoder().encode(JSON.stringify(sheet));
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return IMPORT_PREFIX + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
