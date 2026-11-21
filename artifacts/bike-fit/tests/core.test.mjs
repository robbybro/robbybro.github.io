// Synthetic riders only: every number here is invented for the test. No real video, frame or fit
// number belongs in this folder.
//
// Run from the repo root: node --test artifacts/bike-fit/tests/
// (package.json beside this file names it as the folder's entry, because current Node no longer
// searches a folder given to --test.)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyze, compare, resolveScale, frameForCrankAngle, fitCircle, jointAngle, pickNearSide,
  readImportFragment, encodeImportFragment, sanitizeFitSheet, sanitizeFitNumbers,
  DIRECTION, BALL_OF_FOOT_FRACTION, IMPORT_PREFIX, IMPORT_MAX_LENGTH,
} from '../core.js';

const RAD = Math.PI / 180;

// A stick-figure rider in bike space (millimeters, origin at the bottom bracket, x ahead, y up),
// projected into a video frame. The ball of the foot rides exactly on the pedal axle.
const BASE = {
  crank: 170,            // millimeters
  hip: [-190, 750],      // hip joint: 190 behind, 750 above the bottom bracket
  wrist: [480, 610],     // wrist on the hood: 480 ahead, 610 above
  torsoDegrees: 42,
  torsoLength: 520,
  thigh: 420, shin: 430, upperArm: 300, forearm: 270,
  footLength: 260, ankleAlongFoot: 0.2, ankleAboveSole: 85,
  cadence: 88,           // revolutions per minute
  framesPerSecond: 30,
  seconds: 10,
  pixelsPerMillimeter: 0.55,
  width: 720, height: 1280,
  origin: [380, 1050],   // where the bottom bracket lands in the picture, pixels
  facing: 'left',
  rollDegrees: 0,        // camera roll: positive = level lines drop toward image-right
  drift: [0, 0],         // camera drift over the clip, pixels
  startDegrees: 25,
};

// Third corner of a triangle with sides `a` (from p) and `b` (from q), on the side picked by `sign`.
function elbowPoint(p, q, a, b, sign) {
  const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy);
  const along = (a * a - b * b + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, a * a - along * along));
  return [p[0] + (along * dx - sign * off * dy) / d, p[1] + (along * dy + sign * off * dx) / d];
}

function riderAt(o, crankDegrees) {
  const leg = (deg) => {
    const pedal = [o.crank * Math.sin(deg * RAD), o.crank * Math.cos(deg * RAD)];
    const pitch = (-12 + 9 * Math.sin((deg - 40) * RAD)) * RAD; // toe points down a little, varying through the stroke
    const along = [Math.cos(pitch), Math.sin(pitch)];
    const up = [-along[1], along[0]];
    const heel = [pedal[0] - BALL_OF_FOOT_FRACTION * o.footLength * along[0], pedal[1] - BALL_OF_FOOT_FRACTION * o.footLength * along[1]];
    const toe = [heel[0] + o.footLength * along[0], heel[1] + o.footLength * along[1]];
    const ankle = [heel[0] + o.ankleAlongFoot * o.footLength * along[0] + o.ankleAboveSole * up[0], heel[1] + o.ankleAlongFoot * o.footLength * along[1] + o.ankleAboveSole * up[1]];
    const knee = elbowPoint(o.hip, ankle, o.thigh, o.shin, 1); // knee ahead of the hip-ankle line
    return { heel, toe, ankle, knee };
  };
  const shoulder = [o.hip[0] + o.torsoLength * Math.cos(o.torsoDegrees * RAD), o.hip[1] + o.torsoLength * Math.sin(o.torsoDegrees * RAD)];
  const elbow = elbowPoint(shoulder, o.wrist, o.upperArm, o.forearm, -1); // elbow below the shoulder-wrist line
  return { near: leg(crankDegrees), far: leg(crankDegrees + 180), shoulder, elbow, wrist: o.wrist, hip: o.hip };
}

function makeVideo(overrides = {}) {
  const o = { ...BASE, ...overrides };
  const n = Math.round(o.seconds * o.framesPerSecond);
  const fwd = o.facing === 'left' ? -1 : 1;
  const cosR = Math.cos(o.rollDegrees * RAD), sinR = Math.sin(o.rollDegrees * RAD);
  const project = (p, i) => {
    const x = o.origin[0] + fwd * p[0] * o.pixelsPerMillimeter, y = o.origin[1] - p[1] * o.pixelsPerMillimeter;
    const t = n > 1 ? i / (n - 1) : 0;
    return [(cosR * x - sinR * y + o.drift[0] * t) / o.width, (sinR * x + cosR * y + o.drift[1] * t) / o.height];
  };
  const near = o.facing === 'left' ? 0 : 1; // landmark offset: left-side indices are odd, right-side even
  const frames = [];
  for (let i = 0; i < n; i++) {
    const deg = o.startDegrees + 360 * (o.cadence / 60) * (i / o.framesPerSecond);
    const r = riderAt(o, deg);
    const f = Array.from({ length: 33 }, () => [0.5, 0.5, 0, 0]);
    const put = (index, p, visibility) => { f[index] = [...project(p, i), 0, visibility]; };
    const sides = [[near, r.near, 0.98], [1 - near, r.far, 0.3]];
    for (const [offset, leg, vis] of sides) {
      put(11 + offset, r.shoulder, vis === 0.98 ? 0.99 : 0.9);
      put(13 + offset, r.elbow, vis);
      put(15 + offset, r.wrist, vis);
      put(23 + offset, r.hip, vis === 0.98 ? 0.99 : 0.9);
      put(25 + offset, leg.knee, vis);
      put(27 + offset, leg.ankle, vis);
      put(29 + offset, leg.heel, vis);
      put(31 + offset, leg.toe, vis);
    }
    frames.push(f);
  }
  // A level line as someone would mark it: two points along the floor, rolled with the picture.
  const floor = [project([-600, -300], 0), project([700, -300], 0)];
  return { o, input: { frames, width: o.width, height: o.height, framesPerSecond: o.framesPerSecond }, levelLine: o.facing === 'left' ? [floor[1], floor[0]] : floor };
}

// True extremes of the synthetic rider's angles, sampled finely.
function truth(o) {
  const out = { kneeMax: -Infinity, kneeMin: Infinity, hipMin: Infinity, ankleMin: Infinity, ankleMax: -Infinity };
  for (let d = 0; d < 360; d += 0.05) {
    const r = riderAt(o, d);
    const knee = jointAngle(r.hip, r.near.knee, r.near.ankle);
    const hip = jointAngle(r.shoulder, r.hip, r.near.knee);
    const ankle = jointAngle(r.near.knee, r.near.ankle, r.near.toe);
    out.kneeMax = Math.max(out.kneeMax, knee); out.kneeMin = Math.min(out.kneeMin, knee);
    out.hipMin = Math.min(out.hipMin, hip);
    out.ankleMin = Math.min(out.ankleMin, ankle); out.ankleMax = Math.max(out.ankleMax, ankle);
  }
  const r = riderAt(o, 0);
  out.shoulder = jointAngle(r.hip, r.shoulder, r.elbow);
  out.elbow = jointAngle(r.shoulder, r.elbow, r.wrist);
  return out;
}

const near = (actual, expected, tolerance, what) => assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: got ${actual}, expected ${expected} ± ${tolerance}`);

function millimeters(result, crank) {
  const scale = crank / result.pedalCircle.radius;
  return Object.fromEntries(Object.entries(result.positionPixels).map(([k, v]) => [k, v.median * scale]));
}

test('a synthetic rider: planted crank length, saddle offset and angles come back within 1 mm and 0.5 degrees', () => {
  const v = makeVideo();
  const r = analyze(v.input);
  assert.equal(r.ok, true);
  assert.equal(r.facing, 'left');
  assert.equal(r.side, 'left');
  assert.deepEqual(r.lost, []);
  near(r.pedalCircle.radius, v.o.crank * v.o.pixelsPerMillimeter, 0.05, 'pedal circle radius in pixels');
  near(r.pedalCircle.centers[40][0], v.o.origin[0], 0.05, 'bottom bracket x');
  near(r.pedalCircle.centers[40][1], v.o.origin[1], 0.05, 'bottom bracket y');
  const mm = millimeters(r, v.o.crank);
  near(mm.hipBehind, 190, 1, 'hip behind the bottom bracket');
  near(mm.hipAbove, 750, 1, 'hip above the bottom bracket');
  near(mm.wristAhead, 480, 1, 'wrist ahead of the bottom bracket');
  near(mm.wristAbove, 610, 1, 'wrist above the bottom bracket');
  const t = truth(v.o);
  near(r.measures.kneeBottom.median, t.kneeMax, 0.5, 'knee angle at the bottom');
  near(r.measures.kneeTop.median, t.kneeMin, 0.5, 'knee angle at the top');
  near(r.measures.hipClosed.median, t.hipMin, 0.5, 'hip angle at its most closed');
  near(r.measures.ankleSmallest.median, t.ankleMin, 0.5, 'smallest ankle angle');
  near(r.measures.ankleLargest.median, t.ankleMax, 0.5, 'largest ankle angle');
  near(r.measures.ankleRange.median, t.ankleMax - t.ankleMin, 0.5, 'ankle angle range');
  near(r.measures.torso.median, 42, 0.5, 'torso angle');
  near(r.measures.shoulder.median, t.shoulder, 0.5, 'shoulder angle');
  near(r.measures.elbow.median, t.elbow, 0.5, 'elbow angle');
  near(r.measures.cadence.median, 88, 0.2, 'cadence');
  // 10 seconds at 88 revolutions per minute is 14.67 turns: 13 or 14 whole strokes between top dead centers.
  assert.ok(r.strokesUsed >= 13 && r.strokesUsed <= 14, `strokes used: ${r.strokesUsed}`);
  assert.equal(r.strokesFound, r.strokesUsed);
  near(r.legPixels, (v.o.thigh + v.o.shin) * v.o.pixelsPerMillimeter, 0.05, 'leg length in pixels');
  assert.ok(r.measures.kneeBottom.spread < 0.3, 'identical strokes have almost no spread');
});

test('a rolled camera: the level line recovers positions and torso angle; without it they are off', () => {
  const v = makeVideo({ rollDegrees: 2.5 });
  const corrected = analyze({ ...v.input, levelLine: v.levelLine });
  near(corrected.rollDegrees, 2.5, 0.05, 'roll read from the level line');
  const mm = millimeters(corrected, v.o.crank);
  near(mm.hipBehind, 190, 1, 'hip behind');
  near(mm.hipAbove, 750, 1, 'hip above');
  near(mm.wristAhead, 480, 1, 'wrist ahead');
  near(mm.wristAbove, 610, 1, 'wrist above');
  near(corrected.measures.torso.median, 42, 0.5, 'torso angle');
  const uncorrected = analyze(v.input);
  const raw = millimeters(uncorrected, v.o.crank);
  assert.ok(Math.abs(raw.hipBehind - 190) > 20, 'without the level line 2.5 degrees of roll moves the hip by centimeters');
  assert.ok(Math.abs(uncorrected.measures.torso.median - 42) > 2, 'and tilts the torso angle');
  // Body joint angles do not depend on roll.
  near(uncorrected.measures.kneeBottom.median, corrected.measures.kneeBottom.median, 0.01, 'knee angle with and without the level line');
  // The level line may be marked in either direction.
  const reversed = analyze({ ...v.input, levelLine: [v.levelLine[1], v.levelLine[0]] });
  near(reversed.rollDegrees, 2.5, 0.05, 'roll with the handles swapped');
});

test('a rider facing image-right is measured the same, on the right side', () => {
  const left = analyze(makeVideo().input);
  const v = makeVideo({ facing: 'right' });
  const r = analyze(v.input);
  assert.equal(r.ok, true);
  assert.equal(r.facing, 'right');
  assert.equal(r.side, 'right');
  for (const k of ['kneeBottom', 'kneeTop', 'hipClosed', 'torso', 'elbow', 'cadence']) near(r.measures[k].median, left.measures[k].median, 0.05, k);
  const mm = millimeters(r, v.o.crank);
  near(mm.hipBehind, 190, 1, 'hip behind');
  near(mm.wristAhead, 480, 1, 'wrist ahead');
});

test('near side follows what the camera sees; with no difference it follows the facing direction', () => {
  const v = makeVideo();
  assert.equal(pickNearSide(v.input.frames, 720, 1280).side, 'left');
  const even = v.input.frames.map((f) => f.map((p) => [p[0], p[1], p[2], 0.9]));
  assert.equal(pickNearSide(even, 720, 1280).side, 'left');
  const evenRight = makeVideo({ facing: 'right' }).input.frames.map((f) => f.map((p) => [p[0], p[1], p[2], 0.9]));
  assert.equal(pickNearSide(evenRight, 720, 1280).side, 'right');
});

test('a second rider moved by planted amounts yields those four numbers and the right direction words', () => {
  const kickr = makeVideo();
  // The road bike: hip 12 higher and 7 further forward, wrist 15 further ahead and 9 lower.
  // Filmed from another distance and with a different crank length, as a second video would be.
  const open = makeVideo({ hip: [-190 + 7, 750 + 12], wrist: [480 + 15, 610 - 9], crank: 172.5, pixelsPerMillimeter: 0.61, origin: [350, 1010], cadence: 84 });
  const c = compare(analyze(kickr.input), analyze(open.input), 170, 172.5);
  const by = Object.fromEntries(c.adjustments.map((a) => [a.key, a]));
  assert.deepEqual([by.saddleHeight.direction, by.saddleHeight.millimeters], [DIRECTION.raise, 12]);
  assert.deepEqual([by.saddleSetback.direction, by.saddleSetback.millimeters], [DIRECTION.forward, 7]);
  assert.deepEqual([by.barReach.direction, by.barReach.millimeters], [DIRECTION.lengthen, 15]);
  assert.deepEqual([by.barHeight.direction, by.barHeight.millimeters], [DIRECTION.lower, 9]);
  assert.deepEqual(c.adjustments.map((a) => a.key), ['saddleHeight', 'saddleSetback', 'barReach', 'barHeight']);
  assert.ok(c.adjustments.every((a) => a.status === 'change'));
  const position = Object.fromEntries(c.positions.map((p) => [p.key, p]));
  near(position.hipAbove.difference.value, 12, 1, 'hip height difference');
  near(position.hipBehind.difference.value, -7, 1, 'hip setback difference');
  near(position.wristAhead.difference.value, 15, 1, 'wrist reach difference');
  near(position.wristAbove.difference.value, -9, 1, 'wrist height difference');
  assert.ok(Math.abs(c.scale.disagreementPercent) < 0.1, 'the same rider measures the same leg on both videos');
  assert.equal(c.scale.agrees, true);
  // The opposite move reads with the opposite words.
  const back = compare(analyze(open.input), analyze(kickr.input), 172.5, 170);
  assert.deepEqual(back.adjustments.map((a) => a.direction), [DIRECTION.lower, DIRECTION.back, DIRECTION.shorten, DIRECTION.raise]);
});

test('the same video in both slots: every difference is 0 and all four rows say no change', () => {
  const r = analyze(makeVideo().input);
  const c = compare(r, r, 170, 170);
  for (const row of [...c.rows, ...c.positions]) assert.equal(row.difference.value, 0, row.key);
  assert.deepEqual(c.adjustments.map((a) => a.status), ['no-change', 'no-change', 'no-change', 'no-change']);
  assert.ok(c.adjustments.every((a) => a.direction === DIRECTION.none && a.millimeters === 0));
  assert.equal(c.scale.disagreementPercent, 0);
});

test('a difference smaller than the spread between strokes reads as no change', () => {
  const a = analyze(makeVideo().input);
  const b = structuredClone(a);
  b.positionPixels.hipAbove.median += 2;   // about 4 mm at this scale
  b.positionPixels.hipAbove.spread = 4;    // about 7 mm
  const c = compare(a, b, 170, 170);
  assert.equal(c.adjustments[0].status, 'no-change');
  assert.equal(c.adjustments[0].direction, DIRECTION.none);
  b.positionPixels.hipAbove.spread = 0.5;
  assert.equal(compare(a, b, 170, 170).adjustments[0].direction, DIRECTION.raise);
});

test('answer rows say what is missing: the second video, a crank length, or agreeing scales', () => {
  const kickr = analyze(makeVideo().input);
  assert.deepEqual(compare(kickr, null, 170, null).adjustments.map((a) => a.status), Array(4).fill('needs-open'));
  assert.deepEqual(compare(kickr, kickr, null, null).adjustments.map((a) => a.status), Array(4).fill('needs-crank'));
  // One crank length is enough: the leg carries the scale to the other video.
  const one = compare(kickr, analyze(makeVideo({ pixelsPerMillimeter: 0.7 }).input), 170, null);
  assert.equal(one.scale.source.open, 'leg length');
  assert.deepEqual(one.adjustments.map((a) => a.status), Array(4).fill('no-change'));
  // A wrong crank length (155 entered, 170 real) makes the rider's leg 9 percent shorter on that video.
  const wrong = compare(kickr, kickr, 170, 155);
  near(wrong.scale.disagreementPercent, -9.2, 0.3, 'scale disagreement');
  assert.equal(wrong.scale.agrees, false);
  assert.deepEqual(wrong.adjustments.map((a) => a.status), Array(4).fill('scale-disagrees'));
  assert.ok(wrong.adjustments.every((a) => a.millimeters === null));
});

test('the two videos share one ruler: the leg measures the same on both', () => {
  const a = analyze(makeVideo().input), b = analyze(makeVideo({ pixelsPerMillimeter: 0.8, crank: 175 }).input);
  const s = resolveScale(a, b, 170, 175);
  near(s.legMillimeters, 850, 0.5, 'thigh plus shin');
  near(s.kickr * a.legPixels, s.open * b.legPixels, 1e-9, 'leg length through each video scale');
  near(s.kickr, 1 / 0.55, 0.002, 'millimeters per pixel, first video');
  near(s.open, 1 / 0.8, 0.002, 'millimeters per pixel, second video');
});

test('a hand-held camera that drifts: the bottom bracket is followed and positions hold', () => {
  const v = makeVideo({ drift: [22, -9] });
  const r = analyze(v.input);
  assert.equal(r.ok, true);
  assert.ok(r.cameraDriftPixels > 18 && r.cameraDriftPixels < 24.5, `drift seen: ${r.cameraDriftPixels}`);
  const last = r.frameCount - 30;
  near(r.pedalCircle.centers[last][0] - r.pedalCircle.centers[30][0], 22 * (last - 30) / (r.frameCount - 1), 1, 'center follows the drift');
  const mm = millimeters(r, v.o.crank);
  near(mm.hipBehind, 190, 2, 'hip behind');
  near(mm.hipAbove, 750, 2, 'hip above');
  near(mm.wristAhead, 480, 2, 'wrist ahead');
});

test('lost tracking: the lost frames are named and results rest on the strokes that remain', () => {
  const v = makeVideo();
  const frames = v.input.frames.map((f, i) => (i >= 87 && i <= 139 ? null : f));
  const r = analyze({ ...v.input, frames });
  assert.equal(r.ok, true);
  assert.deepEqual(r.lost, [[88, 140]]);
  assert.ok(r.strokesUsed < r.strokesFound, `${r.strokesUsed} of ${r.strokesFound}`);
  assert.ok(r.strokesFound >= 13 && r.strokesFound <= 14);
  near(r.measures.kneeBottom.median, analyze(v.input).measures.kneeBottom.median, 0.3, 'knee angle from the remaining strokes');
  assert.equal(r.crankDegrees[100], null);
  assert.equal(r.skeleton.knee[100], null);
});

test('short gaps are bridged; low-visibility frames count as lost', () => {
  const v = makeVideo();
  const bridged = analyze({ ...v.input, frames: v.input.frames.map((f, i) => (i === 50 || i === 51 ? null : f)) });
  assert.deepEqual(bridged.lost, []);
  const hidden = v.input.frames.map((f, i) => (i >= 20 && i <= 60 ? f.map((p) => [p[0], p[1], p[2], 0.1]) : f));
  assert.deepEqual(analyze({ ...v.input, frames: hidden }).lost, [[21, 61]]);
});

test('named failures: no rider, tracking lost, not side-on, no full pedal stroke', () => {
  const v = makeVideo();
  const none = analyze({ ...v.input, frames: v.input.frames.map(() => null) });
  assert.deepEqual([none.ok, none.reason, none.lost], [false, 'tracking-lost', [[1, 300]]]);
  const mostly = analyze({ ...v.input, frames: v.input.frames.map((f, i) => (i < 200 ? null : f)) });
  assert.deepEqual([mostly.ok, mostly.reason, mostly.lost], [false, 'tracking-lost', [[1, 200]]]);
  // Seen from the front quarter: the two shoulders and the two hips sit far apart in the picture.
  const turned = v.input.frames.map((f) => f.map((p, i) => ([12, 24].includes(i) ? [p[0] + 0.3, p[1], p[2], p[3]] : p)));
  assert.equal(analyze({ ...v.input, frames: turned }).reason, 'not-side-on');
  const still = makeVideo({ cadence: 0 });
  assert.equal(analyze(still.input).reason, 'no-stroke');
  const short = makeVideo({ seconds: 0.5 });
  assert.equal(analyze(short.input).reason, 'no-stroke');
  // Pedaling backwards never completes a forward stroke.
  const backwards = makeVideo({ cadence: -88 });
  assert.equal(analyze(backwards.input).ok, false);
});

test('chart curves: one value every 5 degrees of crank angle, peaking where the rider does', () => {
  const v = makeVideo();
  const r = analyze(v.input);
  assert.equal(r.curves.knee.median.length, 72);
  assert.ok(r.curves.knee.median.every((x) => Number.isFinite(x)));
  for (const bin of [0, 18, 36, 54]) {
    const rider = riderAt(v.o, bin * 5);
    near(r.curves.knee.median[bin], jointAngle(rider.hip, rider.near.knee, rider.near.ankle), 0.6, `knee angle at ${bin * 5} degrees`);
    near(r.curves.hip.median[bin], jointAngle(rider.shoulder, rider.hip, rider.near.knee), 0.6, `hip angle at ${bin * 5} degrees`);
  }
  assert.ok(r.curves.knee.spread.every((x) => x < 0.5));
});

test('crank angle: 0 at top dead center, rising as the rider pedals; a frame can be found by angle', () => {
  const v = makeVideo();
  const r = analyze(v.input);
  near(r.crankDegrees[0], 25, 0.5, 'first frame');
  const step = 360 * (88 / 60) / 30;
  near(r.crankDegrees[1] - r.crankDegrees[0], step, 0.5, 'advance per frame');
  for (const wanted of [0, 90, 180, 270]) {
    const i = frameForCrankAngle(r, wanted);
    let gap = Math.abs(r.crankDegrees[i] - wanted);
    if (gap > 180) gap = 360 - gap;
    assert.ok(gap <= step / 2 + 0.5, `frame ${i} shows ${r.crankDegrees[i]} for ${wanted}`);
  }
  assert.equal(frameForCrankAngle(r, 450), frameForCrankAngle(r, 90));
});

test('circle fit: exact on a circle, steady with a few wild points, null when it cannot be done', () => {
  const pts = Array.from({ length: 40 }, (_, i) => [100 + 50 * Math.cos(i / 6), 200 + 50 * Math.sin(i / 6)]);
  const c = fitCircle(pts);
  near(c.cx, 100, 1e-6, 'center x'); near(c.cy, 200, 1e-6, 'center y'); near(c.r, 50, 1e-6, 'radius');
  const noisy = pts.map((p, i) => [p[0] + Math.sin(i * 7.3) * 0.8, p[1] + Math.cos(i * 5.1) * 0.8]);
  noisy[3] = [400, 400]; noisy[17] = [-200, 90];
  const d = fitCircle(noisy);
  near(d.cx, 100, 1, 'center x with outliers'); near(d.cy, 200, 1, 'center y with outliers'); near(d.r, 50, 1, 'radius with outliers');
  assert.equal(fitCircle([[0, 0], [1, 1]]), null);
  assert.equal(fitCircle(Array.from({ length: 10 }, (_, i) => [i, 2 * i])), null);
});

// ---------- import link ----------

const SHEET = {
  version: 1,
  videoRider: 1,
  riders: [
    { label: 'Rider A', bike: 'Test Bike 54', saddleHeight: 700, saddleBehind: 200, saddleAbove: 660, barAhead: 430, barAbove: 640, hoodAhead: 510, hoodAbove: 700 },
    { label: 'Rider B', bike: 'Other Bike', saddleHeight: 760, saddleBehind: 230, saddleAbove: 715, barAhead: 470, barAbove: 650, hoodAhead: 560, hoodAbove: 710, crankLength: 172.5, hoodAngle: 8 },
  ],
};
const link = (value) => IMPORT_PREFIX + Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

test('a valid import link round-trips into a fresh, allowlisted sheet', () => {
  const read = readImportFragment(encodeImportFragment(SHEET));
  assert.equal(read.present, true);
  assert.deepEqual(read.sheet, SHEET);
  assert.notEqual(read.sheet, SHEET);
  assert.deepEqual(readImportFragment(link(SHEET)).sheet, SHEET);
  // Keys outside the allowlist are dropped, never copied.
  const extra = structuredClone(SHEET);
  extra.note = 'ignored'; extra.riders[0].weight = 70; extra.riders[0].onclick = 'x';
  assert.deepEqual(readImportFragment(link(extra)).sheet, SHEET);
  // The rider on the videos defaults to the last one listed.
  const { videoRider, ...rest } = SHEET;
  assert.equal(readImportFragment(link(rest)).sheet.videoRider, 1);
  // A rider may arrive with a label and no numbers yet.
  assert.deepEqual(sanitizeFitSheet({ version: 1, riders: [{ label: 'Rider C' }] }), { version: 1, videoRider: 0, riders: [{ label: 'Rider C' }] });
});

test('fragments that are not import links are left alone', () => {
  for (const hash of ['', '#', '#charts', '#fit', undefined, null, 42]) assert.deepEqual(readImportFragment(hash), { present: false, sheet: null });
});

test('crafted import links change nothing: each is rejected whole', () => {
  const reject = (value, why) => assert.deepEqual(readImportFragment(link(value)), { present: true, sheet: null }, why);
  const withRider = (patch) => ({ ...SHEET, riders: [{ ...SHEET.riders[0], ...patch }] });
  // Prototype-pollution keys, at any depth.
  reject('{"version":1,"riders":[{"label":"Rider A"}],"__proto__":{"polluted":true}}', '__proto__ at the root');
  reject('{"version":1,"riders":[{"label":"Rider A","__proto__":{"polluted":true}}]}', '__proto__ in a rider');
  reject('{"version":1,"riders":[{"label":"Rider A","constructor":{"prototype":{"polluted":true}}}]}', 'constructor in a rider');
  assert.equal({}.polluted, undefined);
  // Over 4 KB.
  const big = IMPORT_PREFIX + Buffer.from(JSON.stringify({ ...SHEET, pad: 'x'.repeat(5 * 1024) })).toString('base64url');
  assert.ok(big.length > IMPORT_MAX_LENGTH);
  assert.deepEqual(readImportFragment(big), { present: true, sheet: null });
  // Numbers that are not finite, out of range, or not numbers.
  reject('{"version":1,"riders":[{"label":"Rider A","saddleHeight":1e999}]}', 'infinite number');
  reject(withRider({ saddleHeight: -1 }), 'negative');
  reject(withRider({ saddleHeight: 2001 }), 'over 2000 mm');
  reject(withRider({ saddleHeight: '700' }), 'number as text');
  reject(withRider({ saddleHeight: null }), 'null');
  reject(withRider({ hoodAngle: 200 }), 'angle out of range');
  // Labels: too long, markup, wrong type, missing.
  reject(withRider({ label: 'x'.repeat(200) }), '200-character label');
  reject(withRider({ label: '<img src=x onerror=alert(1)>' }), 'markup in a label');
  reject(withRider({ bike: '<b>bold</b>' }), 'markup in a bike label');
  reject(withRider({ label: 'a"onmouseover="x' }), 'attribute breakout');
  reject(withRider({ label: 42 }), 'label not text');
  reject(withRider({ label: '' }), 'empty label');
  reject({ version: 1, riders: [{ saddleHeight: 700 }] }, 'no label');
  // Shape: wrong version, no riders, too many riders, wrong rider index, not an object, not JSON, not base64.
  reject({ ...SHEET, version: 2 }, 'unknown version');
  reject({ version: 1, riders: [] }, 'no riders');
  reject({ version: 1, riders: [SHEET.riders[0], SHEET.riders[1], SHEET.riders[0]] }, 'three riders');
  reject({ ...SHEET, videoRider: 2 }, 'rider index out of range');
  reject({ ...SHEET, videoRider: '0' }, 'rider index as text');
  reject([SHEET], 'array at the root');
  reject('not json', 'not JSON');
  reject('null', 'null');
  assert.deepEqual(readImportFragment(IMPORT_PREFIX + '%%%'), { present: true, sheet: null });
  assert.deepEqual(readImportFragment(IMPORT_PREFIX + Buffer.from([0xff, 0xfe, 0xfd]).toString('base64url')), { present: true, sheet: null });
});

test('labels with accents and punctuation used by real names are accepted, at most 40 characters', () => {
  for (const label of ['Zoë', 'José Núñez', "O'Neil", 'Bike No. 2 (road)', 'A'.repeat(40)]) {
    assert.equal(sanitizeFitSheet({ version: 1, riders: [{ label }] }).riders[0].label, label);
  }
  assert.equal(sanitizeFitSheet({ version: 1, riders: [{ label: 'A'.repeat(41) }] }), null);
});

test('stored numbers are re-validated the same way when read back', () => {
  assert.deepEqual(sanitizeFitNumbers({ saddleHeight: 712.5, crankLength: 170, color: 'red' }), { saddleHeight: 712.5, crankLength: 170 });
  assert.equal(sanitizeFitNumbers({ saddleHeight: NaN }), null);
  assert.equal(sanitizeFitNumbers({ saddleHeight: Infinity }), null);
  assert.equal(sanitizeFitNumbers('saddleHeight'), null);
  assert.equal(sanitizeFitNumbers(null), null);
  assert.equal(sanitizeFitNumbers([700]), null);
  // An inherited value is not an own key and is not copied.
  assert.deepEqual(sanitizeFitNumbers(Object.create({ saddleHeight: 700 })), {});
});
