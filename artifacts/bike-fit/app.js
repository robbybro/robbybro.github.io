// Bike fit comparison: page behavior.
// The fit math is in core.js (pure). This file owns the DOM, the video elements, the pose tracker
// and what is stored on the device. Nothing here talks to another origin.
import { PoseLandmarker } from './vendor/tasks-vision/vision_bundle.mjs';
import {
  analyze, compare, tapeMoves, frameForCrankAngle, chooseSamplingRate, readImportFragment, sanitizeFitSheet, sanitizeFitNumbers,
  IMPORT_PREFIX, FIT_NUMBER_KEYS, CURVE_STEP_DEGREES, SCALE_DISAGREEMENT_LIMIT_PERCENT, PEDAL_FIT_LIMIT_SHARE,
} from './core.js';

// An import link carries fit numbers in the address fragment. It is read and taken out of the address
// bar here, before anything asynchronous runs, so it is never left in history, a screenshot or a share.
const arrivedHash = location.hash;
if (arrivedHash.startsWith(IMPORT_PREFIX)) history.replaceState(null, '', location.pathname + location.search);
const arrivedImport = readImportFragment(arrivedHash);

const TRACKER_FILES = {
  wasmLoaderPath: './vendor/tasks-vision/wasm/vision_wasm_internal.js',
  wasmBinaryPath: './vendor/tasks-vision/wasm/vision_wasm_internal.wasm',
};
const MODEL_URL = './vendor/pose_landmarker_heavy.task';
// Longer clips add minutes of tracking and no information; the filming checklist asks for 15 seconds.
const MAX_TRACKED_SECONDS = 30;
// How long a video may take to show its first picture: a file just chosen, and one read back from this device.
const CHOSEN_VIDEO_TIMEOUT_MILLISECONDS = 20000;
const STORED_VIDEO_TIMEOUT_MILLISECONDS = 6000;
// A seek that has not shown its picture after this long is given up on, and the frame counts as lost.
const SEEK_TIMEOUT_MILLISECONDS = 3000;
// This many frames in a row that never showed means the browser has stopped seeking; tracking stops.
const MAX_STALLED_FRAMES = 8;
const CRANK_RANGE = [100, 220];
// A WebAssembly module that uses one SIMD instruction; the vendored tracker needs SIMD.
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
const UNSUPPORTED = 'This browser cannot run this page. Use a current Chrome, Edge or Firefox, or Safari 16.4 or later.';
const BONES = [['shoulder', 'elbow'], ['elbow', 'wrist'], ['shoulder', 'hip'], ['hip', 'knee'], ['knee', 'ankle'], ['ankle', 'heel'], ['heel', 'toe'], ['ankle', 'toe']];
const TRAILS = ['knee', 'ankle', 'toe'];
const DEFAULT_LEVEL_LINE = [[0.2, 0.92], [0.8, 0.92]];

const $ = (id) => document.getElementById(id);
const round = (v, digits = 0) => Number(v.toFixed(digits));

// A failure whose message is already a sentence for the person using the page.
class Problem extends Error {}

// ---------- storage on this device ----------

const DB_NAME = 'bike-fit';
const STORE = 'slots';
// Every localStorage key this page writes starts with this, so deleting never touches a sibling page's data.
const KEY_PREFIX = 'bike-fit.';
const KEY_CRANKS = `${KEY_PREFIX}cranks`;
const KEY_SHEET = `${KEY_PREFIX}sheet`;
const KEY_ENTERED = `${KEY_PREFIX}entered`;
const KEY_NOW = `${KEY_PREFIX}now`;

function withStore(mode, work) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    let absent = false;
    open.onupgradeneeded = () => {
      // Reading must not leave an empty database behind (after "Delete everything", nothing is stored).
      if (mode === 'readonly') { absent = true; open.transaction.abort(); return; }
      open.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    open.onerror = (event) => { if (absent) { event.preventDefault(); resolve(undefined); } else reject(open.error); };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const request = work(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); resolve(request ? request.result : undefined); };
      tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('storage transaction failed')); };
    };
  });
}
const dbGet = (id) => withStore('readonly', (s) => s.get(id));
const dbPut = (record) => withStore('readwrite', (s) => s.put(record));

function readStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

const validCrank = (v) => typeof v === 'number' && Number.isFinite(v) && v >= CRANK_RANGE[0] && v <= CRANK_RANGE[1];

// ---------- fit numbers ----------
// `sheet` is what an import link delivered; `entered` is what was typed on this page, per rider.
// Both are re-validated every time they are read back from storage.

let sheet = null;
let entered = [];
let kickrNow = {};        // what the tape reads on the Kickr Shift today, typed in the targets table
let shownRiders = [];     // which riders' fit sheet points are drawn
let selectedRider = 0;    // whose targets and entry fields are showing

function loadFitNumbers() {
  sheet = sanitizeFitSheet(readStored(KEY_SHEET));
  const stored = readStored(KEY_ENTERED);
  entered = Array.isArray(stored) ? stored.slice(0, 2).map((r) => sanitizeFitNumbers(r) || {}) : [];
  kickrNow = sanitizeFitNumbers(readStored(KEY_NOW)) || {};
  resetFitView();
}

function resetFitView() {
  const count = sheet ? sheet.riders.length : 1;
  selectedRider = sheet ? sheet.videoRider : 0;
  // The rider on the videos is drawn from the start; anyone else's sheet waits behind its switch.
  shownRiders = Array.from({ length: count }, (_, i) => i === selectedRider);
}

const videoRiderIndex = () => (sheet ? sheet.videoRider : 0);
// Imported numbers with anything typed on this page laid over them.
const riders = () => (sheet ? sheet.riders : [{ label: 'Rider on the videos' }]).map((r, i) => ({ ...r, ...(entered[i] || {}) }));
const hasNumbers = (rider) => FIT_NUMBER_KEYS.some((k) => typeof rider[k] === 'number');

// ---------- the two slots ----------

const SLOT_DEFINITIONS = [
  { id: 'kickr', title: 'Kickr Shift', crankNote: 'The Kickr Shift crank has pedal holes for 165, 167.5, 170, 172.5 and 175 millimeters.' },
  { id: 'open', title: 'Open MIN.D', crankNote: '' },
];
const slots = {};
let tracking = null;    // the slot being tracked; one video at a time
let restoring = true;   // stored slots are still being read back; no new video may start until they are
let bothPlaying = false;
let checklistOpenFor = null;   // the "a slot still needs a video" state the checklist was last set for

function buildSlot(def) {
  const el = $('slot-template').content.firstElementChild.cloneNode(true);
  el.dataset.slot = def.id;
  el.id = `slot-${def.id}`;
  const q = (selector) => el.querySelector(selector);
  const slot = {
    ...def, el,
    status: q('.slot-status'), progress: q('.slot-progress'), fileInput: q('.file-input'), fileLabel: q('.file-label'), fileButton: q('.btn.file'),
    cancel: q('.cancel'), hint: q('.slot-hint'),
    stageWrap: q('.stage-wrap'), stage: q('.stage'), video: q('.video'), canvas: q('.overlay'),
    levelLayer: q('.level-layer'), handles: [...el.querySelectorAll('.handle')],
    player: q('.player'), play: q('.play'), prev: q('.prev'), next: q('.next'), scrubber: q('.scrubber'), marks: q('.scrub-marks'),
    readout: q('.frame-readout'), speeds: [...el.querySelectorAll('.speed')], skeletonButton: q('.skeleton'),
    crankInput: q('.crank'), crankNoteEl: q('.crank-note'), levelTool: q('.level-tool'), levelStart: q('.level-start'),
    levelUse: q('.level-use'), levelClear: q('.level-clear'), levelNote: q('.level-note'), facts: q('.facts'),
    record: null,       // { frames, width, height, framesPerSecond, levelLine, truncated }: everything analyze() needs
    blob: null, url: null, result: null, crank: null,
    job: null,          // { cancelled, phase: 'model' | 'frames', done, total } while tracking
    note: '',           // one extra sentence for the status line (a failure, a storage limit)
    frame: 0, rate: 1, showSkeleton: true, levelDraft: null,
  };
  q('.slot-title').textContent = def.title;
  q('.crank-label').textContent = `Crank length on the ${def.title}, in millimeters`;
  slot.crankInput.setAttribute('aria-label', `Crank length on the ${def.title}, in millimeters`);
  slot.crankInput.id = `crank-${def.id}`;
  wireSlot(slot);
  $('slots').append(el);
  return slot;
}

// ---------- tracking a video ----------

let modelBytes = null;
async function loadModel(onProgress) {
  if (modelBytes) return modelBytes;
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Problem('The tracking model did not load. Reload the page and choose the video again.');
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body) return (modelBytes = new Uint8Array(await response.arrayBuffer()));
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(received, total);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return (modelBytes = bytes);
}

// Resolves when the video has a first picture. Rejects if the browser reports an error, or says
// nothing at all within the time allowed: a video that never loads must not hold the page.
function videoReady(video, timeoutMilliseconds) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2) return resolve();
    const done = (ok) => {
      video.removeEventListener('loadeddata', good);
      video.removeEventListener('error', bad);
      clearTimeout(timer);
      ok ? resolve() : reject(new Problem('This video could not be opened in this browser. Choose another file.'));
    };
    const good = () => done(true), bad = () => done(false);
    const timer = setTimeout(bad, timeoutMilliseconds);
    video.addEventListener('loadeddata', good);
    video.addEventListener('error', bad);
  });
}

// Media times of the frames the browser presents while the video plays for a moment. What rate to
// sample at is decided from them in core.js (chooseSamplingRate). Browsers without the callback get
// an empty list, which that function reads as 30 per second.
function presentedFrameTimes(video) {
  if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
    // Still play for an instant: iOS Safari decodes nothing for seeking until a video has played.
    return video.play().then(() => video.pause(), () => {}).then(() => []);
  }
  return new Promise((resolve) => {
    const times = [];
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      video.pause();
      resolve(times);
    };
    const onFrame = (now, meta) => {
      times.push(meta.mediaTime);
      if (times.length >= 20) finish();
      else if (!finished) video.requestVideoFrameCallback(onFrame);
    };
    const timer = setTimeout(finish, 1500);
    video.requestVideoFrameCallback(onFrame);
    video.playbackRate = 1;
    video.play().catch(finish);
  });
}

// Shows one moment of the video. Resolves true once that picture is decoded, false if the browser
// had not shown it in time: the caller must then not read the video, which still holds the old picture.
function seekTo(video, seconds) {
  return new Promise((resolve) => {
    if (video.currentTime === seconds && !video.seeking) return resolve(true);
    const done = (shown) => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('canplay', onReady);
      clearTimeout(timer);
      resolve(shown);
    };
    const onReady = () => done(true);
    const onSeeked = () => {
      if (video.readyState >= 2) return done(true);
      video.addEventListener('canplay', onReady);
    };
    const timer = setTimeout(() => done(false), SEEK_TIMEOUT_MILLISECONDS);
    video.addEventListener('seeked', onSeeked);
    video.currentTime = seconds;
  });
}

const CANCELLED = Symbol('cancelled');

// Tracking stops if the phone's screen sleeps, so the screen is asked to stay on while it runs.
// Browsers without the request, or that refuse it, are left to the sentence in the slot.
let screenLock = null;
async function holdScreen() {
  if (screenLock || !('wakeLock' in navigator)) return;
  try {
    screenLock = await navigator.wakeLock.request('screen');
    screenLock.addEventListener('release', () => { screenLock = null; });
  } catch { screenLock = null; }
}
function releaseScreen() {
  const held = screenLock;
  screenLock = null;
  if (held) held.release().catch(() => {});
}
// The browser drops the lock whenever the page is hidden; take it again on return if still tracking.
document.addEventListener('visibilitychange', () => { if (tracking && document.visibilityState === 'visible') holdScreen(); });

async function trackFile(slot, file) {
  if (tracking || restoring) return;
  tracking = slot;
  const job = { cancelled: false, phase: 'model', done: 0, total: 0 };
  slot.job = job;
  stopBoth();
  leaveLevelTool(slot);
  slot.note = '';
  slot.record = null;
  slot.result = null;
  setVideo(slot, file);
  render();
  let landmarker = null;
  try {
    await holdScreen();
    await videoReady(slot.video, CHOSEN_VIDEO_TIMEOUT_MILLISECONDS);
    const video = slot.video;
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Problem('This video has no readable length. Choose another file.');
    const framesPerSecond = chooseSamplingRate(await presentedFrameTimes(video));
    const seconds = Math.min(video.duration, MAX_TRACKED_SECONDS);
    const count = Math.floor(seconds * framesPerSecond + 1e-3);
    const model = await loadModel((received, total) => { job.done = received; job.total = total; renderStatus(slot); });
    if (job.cancelled) throw CANCELLED;
    // The CPU delegate computes the same way on every device (see vendor/VENDOR.md).
    landmarker = await PoseLandmarker.createFromOptions(TRACKER_FILES, {
      baseOptions: { modelAssetBuffer: model, delegate: 'CPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
    job.phase = 'frames';
    job.total = count;
    const frames = [];
    let stalled = 0, stalledInARow = 0;
    for (let i = 0; i < count; i++) {
      if (job.cancelled) throw CANCELLED;
      if (await seekTo(video, (i + 0.5) / framesPerSecond)) {
        stalledInARow = 0;
        const found = landmarker.detectForVideo(video, Math.round(i * 1000 / framesPerSecond)).landmarks[0];
        frames.push(found ? found.map((p) => [round(p.x, 5), round(p.y, 5), round(p.z, 4), round(p.visibility ?? 0, 3)]) : null);
      } else {
        // The picture never arrived, so the video still shows an earlier frame. Tracking that would
        // store the wrong moment as this one; the frame is recorded as lost instead.
        frames.push(null);
        stalled++;
        if (++stalledInARow >= MAX_STALLED_FRAMES) throw new Problem(`This browser stopped showing frames of the video at frame ${i + 1}. Choose the video again.`);
      }
      job.done = i + 1;
      renderStatus(slot);
    }
    slot.record = { frames, width: video.videoWidth, height: video.videoHeight, framesPerSecond, levelLine: null, truncated: video.duration > MAX_TRACKED_SECONDS + 0.5, stalled };
    compute(slot);
    slot.note = await persist(slot);
    await seekTo(video, 0.5 / framesPerSecond);
  } catch (error) {
    // A cancelled or failed replacement leaves the slot as it was stored.
    const note = error === CANCELLED ? '' : error instanceof Problem ? error.message : (error && error.message ? `Tracking stopped: ${error.message}. Choose the video again.` : 'Tracking stopped for an unknown reason. Choose the video again.');
    await restoreSlot(slot);
    slot.note = note;
  } finally {
    if (landmarker) landmarker.close();
    releaseScreen();
    slot.job = null;
    tracking = null;
    slot.fileInput.value = '';
    render();
  }
}

function setVideo(slot, blob) {
  if (slot.url) URL.revokeObjectURL(slot.url);
  slot.blob = blob || null;
  slot.url = blob ? URL.createObjectURL(blob) : null;
  slot.frame = 0;
  if (slot.url) slot.video.src = slot.url;
  else { slot.video.removeAttribute('src'); slot.video.load(); }
}

function compute(slot) {
  slot.result = null;
  if (!slot.record) return;
  try {
    slot.result = analyze(slot.record);
  } catch {
    // Stored tracking that no longer has the expected shape is treated as absent.
    slot.record = null;
    slot.note = 'The stored tracking for this video could not be read. Choose the video again.';
  }
}

// Returns a sentence when the device could not store everything, otherwise ''.
async function persist(slot) {
  const record = { id: slot.id, video: slot.blob, ...slot.record };
  try { await dbPut(record); return ''; } catch { /* usually the storage limit: try without the video */ }
  try {
    await dbPut({ ...record, video: null });
    return 'This device would not store the video itself, only its tracking. After a reload, choose the video again to play it.';
  } catch {
    return 'This device would not store this video or its tracking. They stay until this page is closed.';
  }
}

async function restoreSlot(slot) {
  let stored = null;
  try { stored = await dbGet(slot.id); } catch { stored = null; }
  slot.record = null;
  slot.result = null;
  if (!stored || !Array.isArray(stored.frames)) { setVideo(slot, null); return; }
  const { frames, width, height, framesPerSecond, levelLine, truncated, stalled } = stored;
  slot.record = { frames, width, height, framesPerSecond, levelLine: levelLine || null, truncated: Boolean(truncated), stalled: Number.isInteger(stalled) ? stalled : 0 };
  compute(slot);
  const kept = stored.video instanceof Blob;
  setVideo(slot, kept ? stored.video : null);
  if (slot.url) {
    try { await videoReady(slot.video, STORED_VIDEO_TIMEOUT_MILLISECONDS); await seekTo(slot.video, 0.5 / framesPerSecond); } catch { setVideo(slot, null); }
  }
  if (slot.record && !slot.url) {
    slot.note = kept ? 'The stored video could not be opened on this device. Its tracking is kept. Choose the video again to play it.'
      : 'The video itself is not stored on this device. Choose it again to play it.';
  }
}

// ---------- status sentences ----------

// The bottom bracket wandered in the picture by more than a tenth of the crank's length.
const cameraMoved = (slot) => slot.result.cameraDriftPixels > 0.1 * slot.result.pedalCircle.radius;

function describeLost(lost) {
  const parts = lost.map(([a, b]) => (a === b ? `${a}` : `${a} to ${b}`));
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `Tracking lost in ${lost.length === 1 && lost[0][0] === lost[0][1] ? 'frame' : 'frames'} ${list}.`;
}

const megabytes = (bytes) => round(bytes / 1048576, bytes < 10485760 ? 1 : 0);

function statusText(slot) {
  const job = slot.job;
  if (job && job.phase === 'model') {
    if (!job.done) return 'Opening the video.';
    return job.total >= job.done ? `Loading the tracking model: ${megabytes(job.done)} of ${megabytes(job.total)} megabytes.` : `Loading the tracking model: ${megabytes(job.done)} megabytes.`;
  }
  if (job) return `Frame ${job.done} of ${job.total}`;
  const out = [];
  const r = slot.result;
  if (!slot.record) out.push(slot.note || `Choose a side-on riding video of the ${slot.title}.`);
  else if (r && r.ok) {
    const cadence = `${round(r.measures.cadence.median)} revolutions per minute`;
    if (r.strokesUsed < r.strokesFound) out.push(`Based on ${r.strokesUsed} of ${r.strokesFound} strokes, at ${cadence}.`);
    else out.push(`${r.strokesUsed} pedal ${r.strokesUsed === 1 ? 'stroke' : 'strokes'} tracked at ${cadence}.`);
    if (r.lost.length) out.push(describeLost(r.lost));
    if (slot.record.stalled) out.push(`${slot.record.stalled} ${slot.record.stalled === 1 ? 'frame' : 'frames'} did not load in time and ${slot.record.stalled === 1 ? 'counts' : 'count'} as lost.`);
    if (slot.record.truncated) out.push(`Only the first ${MAX_TRACKED_SECONDS} seconds were tracked.`);
    if (cameraMoved(slot)) out.push('The camera moved during the video, which widens the spread. Rest the phone on something steady to tighten it.');
    if (slot.crank === null) out.push('Enter the crank length to get millimeters.');
  } else if (r) {
    if (r.reason === 'tracking-lost') out.push(`${r.lost.length ? describeLost(r.lost) : 'Tracking lost.'} Film again with your whole body in the picture, then replace the video.`);
    else if (r.reason === 'not-side-on') out.push('Rider not side-on. Film from straight out to the side of the bike, then replace the video.');
    else out.push('No full pedal stroke found. Film at least 15 seconds of steady pedaling, then replace the video.');
  }
  if (slot.record && slot.note) out.push(slot.note);
  return out.join(' ');
}

function renderStatus(slot) {
  const job = slot.job;
  slot.status.textContent = statusText(slot);
  const showBar = Boolean(job) && job.total > 0 && job.total >= job.done;
  slot.progress.hidden = !showBar;
  if (showBar) { slot.progress.max = job.total; slot.progress.value = job.done; }
}

// ---------- drawing on the video ----------

function draw(slot) {
  const canvas = slot.canvas;
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const g = canvas.getContext('2d');
  g.setTransform(ratio, 0, 0, ratio, 0, 0);
  g.clearRect(0, 0, width, height);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const ink = '#ffffff', casing = 'rgba(11,11,11,0.85)';
  // Every stroke is drawn twice: a dark casing under a light line, so it reads on any background.
  const cased = (path, lineWidth, color = ink) => {
    g.strokeStyle = casing; g.lineWidth = lineWidth + 3; path(); g.stroke();
    g.strokeStyle = color; g.lineWidth = lineWidth; path(); g.stroke();
  };
  if (slot.levelDraft) {
    const [a, b] = slot.levelDraft;
    cased(() => { g.beginPath(); g.moveTo(a[0] * width, a[1] * height); g.lineTo(b[0] * width, b[1] * height); }, 2);
  }
  const r = slot.result;
  if (!r || !r.ok || !slot.showSkeleton || slot.job) return;
  const i = slot.frame, k = width / slot.record.width;
  const at = (p) => [p[0] * k, p[1] * k];
  if (!r.skeleton.hip[i]) return;
  const color = getComputedStyle(slot.el).getPropertyValue('--slot-color').trim() || ink;
  // Pedal circle and the bottom bracket estimate, so a wrong fit is visible.
  // (A frame in a tracked run too short to center has none.)
  if (r.pedalCircle.centers[i]) {
    const center = at(r.pedalCircle.centers[i]);
    cased(() => { g.beginPath(); g.arc(center[0], center[1], r.pedalCircle.radius * k, 0, 2 * Math.PI); }, 1);
    cased(() => { g.beginPath(); g.moveTo(center[0] - 9, center[1]); g.lineTo(center[0] + 9, center[1]); g.moveTo(center[0], center[1] - 9); g.lineTo(center[0], center[1] + 9); }, 2);
  }
  // Where the knee, ankle and toe have just been: one pedal stroke of trail.
  const trail = Math.round(r.referenceStroke.end - r.referenceStroke.start);
  for (const joint of TRAILS) {
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = 1.5;
    g.beginPath();
    let started = false;
    for (let f = Math.max(0, i - trail); f <= i; f++) {
      const p = r.skeleton[joint][f];
      if (!p) { started = false; continue; }
      const [x, y] = at(p);
      if (started) g.lineTo(x, y); else { g.moveTo(x, y); started = true; }
    }
    g.stroke();
  }
  for (const [a, b] of BONES) {
    const p = at(r.skeleton[a][i]), q = at(r.skeleton[b][i]);
    cased(() => { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }, 2.5);
  }
  for (const joint of Object.keys(r.skeleton)) {
    const [x, y] = at(r.skeleton[joint][i]);
    g.beginPath(); g.arc(x, y, 6.5, 0, 2 * Math.PI); g.fillStyle = casing; g.fill();
    g.beginPath(); g.arc(x, y, 5, 0, 2 * Math.PI); g.fillStyle = ink; g.fill();
    g.beginPath(); g.arc(x, y, 3.5, 0, 2 * Math.PI); g.fillStyle = color; g.fill();
  }
}

// ---------- the player ----------

const frameCount = (slot) => (slot.record ? slot.record.frames.length : 0);
const frameAt = (slot, seconds) => Math.max(0, Math.min(frameCount(slot) - 1, Math.floor(seconds * slot.record.framesPerSecond + 1e-4)));

function showFrame(slot, index) {
  if (!slot.record || !slot.url) return;
  const i = Math.max(0, Math.min(frameCount(slot) - 1, index));
  slot.video.pause();
  slot.video.currentTime = (i + 0.5) / slot.record.framesPerSecond;
  atFrame(slot, i);
}

function atFrame(slot, index) {
  slot.frame = index;
  slot.scrubber.value = String(index);
  const r = slot.result;
  const angle = r && r.ok && r.crankDegrees[index] !== null ? `, crank angle ${round(r.crankDegrees[index])}°` : '';
  slot.readout.textContent = `Frame ${index + 1} of ${frameCount(slot)}${angle}`;
  draw(slot);
}

function wireSlot(slot) {
  const v = slot.video;
  slot.fileInput.addEventListener('change', () => {
    const file = slot.fileInput.files && slot.fileInput.files[0];
    if (file) trackFile(slot, file).catch(crash);
  });
  slot.cancel.addEventListener('click', () => { if (slot.job) slot.job.cancelled = true; });

  const onTime = (seconds) => { if (slot.record && !slot.job) atFrame(slot, frameAt(slot, seconds)); };
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    // Re-armed whenever a video loads, in case a browser drops pending callbacks with the old source.
    let pending = 0;
    const loop = (now, meta) => { onTime(meta.mediaTime); pending = v.requestVideoFrameCallback(loop); };
    v.addEventListener('loadeddata', () => { v.cancelVideoFrameCallback(pending); pending = v.requestVideoFrameCallback(loop); });
  } else {
    const loop = () => { if (!v.paused) { onTime(v.currentTime); requestAnimationFrame(loop); } };
    v.addEventListener('play', () => requestAnimationFrame(loop));
  }
  v.addEventListener('seeked', () => onTime(v.currentTime));
  const syncPlay = () => { slot.play.textContent = v.paused ? 'Play' : 'Pause'; };
  v.addEventListener('play', syncPlay);
  v.addEventListener('pause', syncPlay);
  v.addEventListener('ended', () => { syncPlay(); if (bothPlaying) stopBoth(); });

  slot.play.addEventListener('click', () => {
    stopBoth();
    if (!v.paused) return v.pause();
    if (v.ended || slot.frame >= frameCount(slot) - 1) v.currentTime = 0;
    v.playbackRate = slot.rate;
    v.play().catch(() => { slot.note = 'This browser would not play the video.'; renderStatus(slot); });
  });
  slot.prev.addEventListener('click', () => { stopBoth(); showFrame(slot, slot.frame - 1); });
  slot.next.addEventListener('click', () => { stopBoth(); showFrame(slot, slot.frame + 1); });
  slot.scrubber.addEventListener('input', () => { stopBoth(); showFrame(slot, Number(slot.scrubber.value)); });
  for (const button of slot.speeds) {
    button.addEventListener('click', () => {
      slot.rate = Number(button.dataset.rate);
      v.playbackRate = slot.rate;
      for (const other of slot.speeds) other.setAttribute('aria-pressed', String(other === button));
    });
  }
  slot.skeletonButton.addEventListener('click', () => {
    slot.showSkeleton = !slot.showSkeleton;
    slot.skeletonButton.setAttribute('aria-pressed', String(slot.showSkeleton));
    slot.skeletonButton.textContent = slot.showSkeleton ? 'Tracked joints on' : 'Tracked joints off';
    draw(slot);
  });
  new ResizeObserver(() => { draw(slot); placeHandles(slot); }).observe(slot.stage);

  slot.crankInput.addEventListener('input', () => {
    const text = slot.crankInput.value.trim();
    const value = Number(text);
    slot.crank = text !== '' && validCrank(value) ? value : null;
    const cranks = readStored(KEY_CRANKS);
    const next = { kickr: null, open: null };
    for (const id of Object.keys(next)) next[id] = id === slot.id ? slot.crank : (cranks && validCrank(cranks[id]) ? cranks[id] : null);
    writeStored(KEY_CRANKS, next);
    render();
  });

  // Level line: two handles dragged onto something level in a paused frame.
  slot.levelStart.addEventListener('click', () => {
    stopBoth();
    v.pause();
    slot.levelDraft = structuredClone(slot.record.levelLine || DEFAULT_LEVEL_LINE);
    render();
    slot.handles[0].focus();
  });
  slot.levelUse.addEventListener('click', () => setLevelLine(slot, slot.levelDraft).catch(crash));
  slot.levelClear.addEventListener('click', () => setLevelLine(slot, null).catch(crash));
  slot.handles.forEach((handle, which) => {
    const move = (x, y) => {
      slot.levelDraft[which] = [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
      placeHandles(slot);
      draw(slot);
    };
    handle.addEventListener('pointerdown', (e) => { handle.setPointerCapture(e.pointerId); e.preventDefault(); handle.focus(); });
    handle.addEventListener('pointermove', (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      const box = slot.stage.getBoundingClientRect();
      move((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
    });
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.01 : 0.002;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!delta) return;
      e.preventDefault();
      move(slot.levelDraft[which][0] + delta[0], slot.levelDraft[which][1] + delta[1]);
    });
  });
}

function placeHandles(slot) {
  if (!slot.levelDraft) return;
  slot.handles.forEach((handle, which) => {
    handle.style.left = `${slot.levelDraft[which][0] * 100}%`;
    handle.style.top = `${slot.levelDraft[which][1] * 100}%`;
  });
}

function leaveLevelTool(slot) {
  slot.levelDraft = null;
}

async function setLevelLine(slot, line) {
  slot.record.levelLine = line;
  leaveLevelTool(slot);
  compute(slot);
  render();
  const note = await persist(slot);
  if (note) { slot.note = note; renderStatus(slot); }
}

// ---------- both videos together ----------

const bothReady = () => Object.values(slots).every((s) => s.result && s.result.ok && s.url);

function showBothAt(degrees) {
  for (const slot of Object.values(slots)) showFrame(slot, frameForCrankAngle(slot.result, degrees));
}

function stopBoth() {
  if (!bothPlaying) return;
  bothPlaying = false;
  for (const slot of Object.values(slots)) slot.video.pause();
  $('play-both').textContent = 'Play both';
}

function playBoth() {
  if (bothPlaying) return stopBoth();
  const degrees = Number($('shared-angle').value);
  showBothAt(degrees);
  bothPlaying = true;
  $('play-both').textContent = 'Pause both';
  // The Open video is sped up or slowed so both riders finish each pedal stroke together.
  const pace = slots.kickr.result.measures.cadence.median / slots.open.result.measures.cadence.median;
  slots.kickr.video.playbackRate = slots.kickr.rate;
  slots.open.video.playbackRate = Math.max(0.1, Math.min(4, slots.kickr.rate * pace));
  for (const slot of Object.values(slots)) slot.video.play().catch(stopBoth);
}

// ---------- rendering ----------

function fact(body, label, value) {
  const row = body.insertRow();
  const th = document.createElement('th');
  th.scope = 'row';
  th.textContent = label;
  row.append(th);
  row.insertCell().textContent = value;
}

function renderSlot(slot) {
  const busy = Boolean(slot.job);
  const r = slot.result;
  const playable = Boolean(slot.url) && Boolean(slot.record) && !busy;
  renderStatus(slot);
  // The Open slot shows the fit sheet's crank length as a hint only; the field itself stays empty.
  const sheetCrank = slot.id === 'open' ? riders()[videoRiderIndex()].crankLength : undefined;
  slot.crankInput.placeholder = typeof sheetCrank === 'number' ? String(sheetCrank) : '170';
  slot.fileLabel.textContent = slot.record ? 'Replace video' : 'Choose video';
  const locked = Boolean(tracking) || restoring || !supported;
  slot.fileInput.disabled = locked;
  slot.fileButton.classList.toggle('disabled', locked);
  slot.cancel.hidden = !busy;
  slot.hint.hidden = !busy;
  slot.stageWrap.hidden = !slot.url;
  slot.player.hidden = !playable;
  slot.levelTool.hidden = !playable;
  if (playable) {
    slot.scrubber.max = String(frameCount(slot) - 1);
    slot.marks.replaceChildren();
    for (const [a, b] of (r ? r.lost : [])) {
      const mark = document.createElement('span');
      mark.style.left = `${(a - 1) / frameCount(slot) * 100}%`;
      mark.style.width = `${(b - a + 1) / frameCount(slot) * 100}%`;
      slot.marks.append(mark);
    }
    atFrame(slot, Math.min(slot.frame, frameCount(slot) - 1));
  }
  const marking = Boolean(slot.levelDraft);
  slot.levelLayer.hidden = !marking;
  slot.levelStart.hidden = marking;
  slot.levelUse.hidden = !marking;
  slot.levelClear.hidden = !(slot.record && slot.record.levelLine) || marking;
  slot.levelStart.textContent = slot.record && slot.record.levelLine ? 'Move the level line' : 'Mark a level line';
  if (marking) slot.levelNote.textContent = 'Drag the two ends of the line onto something level, such as the line where the floor meets the wall.';
  else if (r && r.ok && slot.record.levelLine) slot.levelNote.textContent = `Camera tilt of ${round(Math.abs(r.rollDegrees), 1)}° is corrected in positions and the torso angle.`;
  else slot.levelNote.textContent = 'Optional. One degree of camera tilt moves the hip joint about 12 millimeters.';
  placeHandles(slot);

  slot.crankNoteEl.textContent = slot.crankInput.value.trim() !== '' && slot.crank === null
    ? `Crank lengths run from ${CRANK_RANGE[0]} to ${CRANK_RANGE[1]} millimeters.` : slot.crankNote;

  const body = slot.facts.tBodies[0];
  body.replaceChildren();
  slot.facts.hidden = !(r && r.ok);
  if (r && r.ok) {
    fact(body, 'Pedal strokes', r.strokesUsed < r.strokesFound ? `${r.strokesUsed} of ${r.strokesFound}` : `${r.strokesUsed}`);
    fact(body, 'Cadence, revolutions per minute', `${round(r.measures.cadence.median)} ± ${round(r.measures.cadence.spread)}`);
    fact(body, 'Frames tracked', `${r.frameCount} at ${round(r.framesPerSecond, 2)} per second`);
    fact(body, 'Rider faces', r.facing === 'left' ? 'Left of the picture' : 'Right of the picture');
    // A millimeter value from this video's own scale, so it carries the same mark as every other one.
    const checked = currentComparison && currentComparison.scale.checked[slot.id];
    if (slot.crank !== null) fact(body, `Camera movement during the video, millimeters${checked ? '' : ', scale not checked'}`, `${round(r.cameraDriftPixels * slot.crank / r.pedalCircle.radius)}`);
  }
  draw(slot);
}

function render() {
  currentComparison = compareSlots();
  for (const slot of Object.values(slots)) renderSlot(slot);
  // The filming checklist stands open while a slot still needs a video, and folds once both have one.
  const needsVideo = Object.values(slots).some((s) => !s.record);
  if (needsVideo !== checklistOpenFor) { $('checklist').open = needsVideo; checklistOpenFor = needsVideo; }
  const both = bothReady() && !tracking;
  $('shared').hidden = !both;
  if (!both) stopBoth();
  renderReport();
}

// ---------- small DOM helpers ----------

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, text) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}
function html(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Text and optional buttons in the notice box under the title. Labels arrive from outside the page,
// so everything goes in as text, never as markup.
function notify(text, actions = []) {
  const box = $('notice');
  box.replaceChildren(document.createTextNode(text));
  if (actions.length) {
    const row = html('div', 'row');
    for (const [label, run] of actions) {
      const button = html('button', 'btn', label);
      button.type = 'button';
      button.addEventListener('click', run);
      row.append(button);
    }
    box.append(row);
  }
  box.hidden = false;
}

const listNames = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]);

// ---------- import link ----------

function receiveImport() {
  if (!arrivedImport.present) return;
  if (!arrivedImport.sheet) return notify('That import link did not work. Nothing was changed. Open the import link again from where you got it.');
  // Ask before anything stored is replaced: an imported sheet, or numbers typed on this page.
  const typed = entered.some((e) => e && Object.keys(e).length);
  if (!sheet && !typed) return adoptSheet(arrivedImport.sheet, 'Fit numbers imported for');
  notify('Replace the fit numbers stored on this device with the imported ones?', [
    ['Replace stored numbers', () => adoptSheet(arrivedImport.sheet, 'Fit numbers replaced. Now stored for')],
    ['Keep stored numbers', () => notify('Stored fit numbers kept.')],
  ]);
}

function adoptSheet(next, lead) {
  sheet = next;
  entered = [];
  resetFitView();
  const kept = writeStored(KEY_SHEET, sheet);
  try { localStorage.removeItem(KEY_ENTERED); } catch { /* nothing was stored */ }
  const names = listNames(sheet.riders.map((r) => r.label));
  notify(kept ? `${lead} ${names}.` : `${lead} ${names}, but this browser would not store them. They last until this page is closed.`);
  buildFitControls();
  render();
}

// ---------- what to change, targets, comparison ----------

// What an answer row is waiting for, and the place on the page that supplies it.
const WAITING = {
  'needs-open': ['Needs the Open MIN.D video', '#slot-open'],
  'needs-kickr': ['Needs the Kickr Shift video', '#slot-kickr'],
  'needs-crank': ['Needs a crank length for the Kickr Shift', '#crank-kickr'],
  'scale-disagrees': ['Scale disagrees between videos', '#comparison-notes'],
};

// A waiting cell is a door: a link to the slot or field that fills it.
function door(text, target) {
  const link = html('a', 'door', text);
  link.href = target;
  link.addEventListener('click', (event) => {
    const field = document.querySelector(target);
    if (!field || field.tagName !== 'INPUT') return;
    event.preventDefault();
    field.scrollIntoView({ block: 'center' });
    field.focus({ preventScroll: true });
  });
  return link;
}

const MEASURE_LABELS = {
  cadence: ['Cadence', 'revolutions per minute'],
  kneeBottom: ['Knee angle at the bottom of the stroke', 'degrees'],
  kneeTop: ['Knee angle at the top of the stroke', 'degrees'],
  hipClosed: ['Hip angle at its most closed', 'degrees'],
  torso: ['Torso angle from horizontal', 'degrees'],
  shoulder: ['Shoulder angle', 'degrees'],
  elbow: ['Elbow angle', 'degrees'],
  ankleSmallest: ['Ankle angle at its smallest', 'degrees'],
  ankleLargest: ['Ankle angle at its largest', 'degrees'],
  ankleRange: ['Ankle angle range', 'degrees'],
  hipBehind: ['Hip joint behind the bottom bracket', 'millimeters'],
  hipAbove: ['Hip joint above the bottom bracket', 'millimeters'],
  wristAhead: ['Wrist ahead of the bottom bracket', 'millimeters'],
  wristAbove: ['Wrist above the bottom bracket', 'millimeters'],
};
const FIT_LABELS = {
  saddleHeight: 'Saddle height',
  saddleBehind: 'Saddle center behind the bottom bracket',
  saddleAbove: 'Saddle center above the bottom bracket',
  barAhead: 'Handlebar center ahead of the bottom bracket',
  barAbove: 'Handlebar center above the bottom bracket',
  hoodAhead: 'Hood ahead of the bottom bracket',
  hoodAbove: 'Hood above the bottom bracket',
  crankLength: 'Crank length',
};

const plain = (v, digits) => { const t = v.toFixed(digits); return Number(t) === 0 ? (0).toFixed(digits) : t; };
const withSpread = (m, digits) => `${plain(m.value, digits)} ± ${plain(m.spread, digits)}`;
function signed(m, digits) {
  const t = plain(Math.abs(m.value), digits);
  const sign = Number(t) === 0 ? '' : m.value > 0 ? '+' : '−';
  return `${sign}${t} ± ${plain(m.spread, digits)}`;
}

function renderAnswer(c) {
  for (const adj of c.adjustments) {
    const row = $('answer-table').querySelector(`tr[data-key="${adj.key}"]`);
    const waiting = WAITING[adj.status];
    // Greyed: the scales disagree (no numbers), or a video's scale is not checked (numbers, marked).
    const unchecked = !waiting && !adj.scaleChecked;
    row.classList.toggle('waiting', Boolean(waiting) && adj.status !== 'scale-disagrees');
    row.classList.toggle('grey', adj.status === 'scale-disagrees' || unchecked);
    row.querySelector('.direction').textContent = adj.direction || '';
    const amount = row.querySelector('.amount');
    if (waiting) amount.replaceChildren(door(...waiting));
    else amount.textContent = adj.status === 'no-difference' ? '—' : String(adj.millimeters);
    if (unchecked) amount.append(html('span', 'unit', 'scale not checked'));
    row.querySelector('.spread').textContent = waiting ? '' : `± ${adj.spread}`;
  }
  // One line above the table for anything that makes these rows less sure than they look.
  const tracked = Object.values(slots).filter((s) => s.result && s.result.ok);
  const videos = (list) => `${listNames(list.map((s) => s.title))} ${list.length > 1 ? 'videos' : 'video'}`;
  const moved = tracked.filter(cameraMoved);
  const unlevelled = tracked.filter((s) => !s.record.levelLine);
  const poor = tracked.filter((s) => !s.result.pedalCircle.fitsWell);
  const cautions = [];
  if (moved.length) cautions.push(`The camera moved during the ${videos(moved)}.`);
  if (unlevelled.length) cautions.push(`No level line is marked on the ${videos(unlevelled)}.`);
  if (poor.length) cautions.push(`The pedal circle fits poorly on the ${videos(poor)}, so ${poor.length > 1 ? 'their scale is' : 'its scale is'} not checked.`);
  $('answer-caution').hidden = !cautions.length;
  $('answer-caution').textContent = cautions.length ? `Read these rows with care. ${cautions.join(' ')}` : '';
}

function riderButtons(container, onPick) {
  container.replaceChildren();
  const all = riders();
  container.hidden = all.length < 2;
  all.forEach((rider, i) => {
    const button = html('button', 'btn rider-pick', rider.label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(i === selectedRider));
    button.addEventListener('click', () => { selectedRider = i; onPick(); });
    container.append(button);
  });
}

// The tape-measure route: the chosen rider's targets, what the tape reads on the Kickr Shift now, and
// the move that turns one into the other.
function renderTargets() {
  const all = riders();
  const rider = all[selectedRider];
  const any = all.some(hasNumbers);
  $('targets').hidden = !any;
  $('targets-absent').hidden = any;
  $('targets-caption').textContent = rider.bike ? `${rider.label}, ${rider.bike}` : rider.label;
  const moves = Object.fromEntries(tapeMoves(rider, kickrNow).map((m) => [m.key, m]));
  for (const row of $('targets-table').tBodies[0].rows) {
    const key = row.dataset.key;
    const value = rider[key];
    const target = row.querySelector('.target');
    target.textContent = typeof value === 'number' ? plain(value, Number.isInteger(value) ? 0 : 1) : 'Not on the sheet';
    target.classList.toggle('waiting', typeof value !== 'number');
    const move = moves[key];
    if (move) row.querySelector('.move').textContent = move.status === 'move' ? `${move.direction} ${move.millimeters}` : move.status === 'matches' ? move.direction : '';
  }
}

function wireTargets() {
  for (const row of $('targets-table').tBodies[0].rows) {
    const input = row.querySelector('.now-input');
    if (!input) continue;
    const key = row.dataset.key;
    if (typeof kickrNow[key] === 'number') input.value = String(kickrNow[key]);
    input.addEventListener('input', () => {
      const checked = input.value.trim() === '' ? null : sanitizeFitNumbers({ [key]: Number(input.value) });
      if (checked) kickrNow[key] = checked[key]; else delete kickrNow[key];
      writeStored(KEY_NOW, kickrNow);
      renderTargets();
      renderStored();
    });
  }
  $('targets-absent').querySelector('a').addEventListener('click', () => { $('fit-entry').open = true; });
}

function renderComparison(c) {
  const body = $('comparison-table').tBodies[0];
  body.replaceChildren();
  const ok = { kickr: Boolean(slots.kickr.result && slots.kickr.result.ok), open: Boolean(slots.open.result && slots.open.result.ok) };
  // Positions first: they are the rows the answer above is made from.
  for (const row of [...c.positions, ...c.rows]) {
    const [label, unit] = MEASURE_LABELS[row.key];
    const digits = unit === 'millimeters' ? 0 : 1;
    // A millimeter value whose video scale has nothing checking it is greyed and its unit says so.
    const unchecked = (id) => Boolean(row.checked) && Boolean(row[id]) && !row.checked[id];
    const tr = body.insertRow();
    const th = html('th', '', label);
    th.scope = 'row';
    th.append(html('span', 'unit', unchecked('kickr') || unchecked('open') ? `${unit}, scale not checked` : unit));
    tr.append(th);
    for (const id of ['kickr', 'open']) {
      const cell = tr.insertCell();
      cell.className = 'num';
      if (row[id]) { cell.textContent = withSpread(row[id], digits); cell.classList.toggle('grey', unchecked(id)); }
      else {
        cell.append(!ok[id] ? door(`Needs the ${slots[id].title} video`, `#slot-${id}`) : door(`Needs a crank length for the ${slots[id].title}`, `#crank-${id}`));
        cell.classList.add('waiting', 'wrap');
      }
    }
    const diff = tr.insertCell();
    diff.className = 'num';
    diff.textContent = row.difference ? signed(row.difference, digits) : '';
    diff.classList.toggle('grey', unchecked('kickr') || unchecked('open'));
  }
  const notes = [];
  notes.push('Each value is the median over pedal strokes. The ± is the spread between pedal strokes only. It does not cover camera placement error or the scale of the video.');
  notes.push('Difference is Open MIN.D minus Kickr Shift.');
  const strokes = Object.values(slots).filter((s) => ok[s.id]).map((s) => `${s.title}: ${s.result.strokesUsed < s.result.strokesFound ? `based on ${s.result.strokesUsed} of ${s.result.strokesFound} strokes` : `${s.result.strokesUsed} pedal ${s.result.strokesUsed === 1 ? 'stroke' : 'strokes'}`}`);
  if (strokes.length) notes.push(`${strokes.join('. ')}.`);
  const sc = c.scale;
  if (sc.disagreementPercent !== null) {
    const gap = plain(Math.abs(sc.disagreementPercent), 1);
    notes.push(`Scale check: thigh plus shin measures ${plain(sc.legByPedalCircle.kickr, 0)} millimeters by the Kickr Shift pedal circle and ${plain(sc.legByPedalCircle.open, 0)} by the Open MIN.D pedal circle, ${gap} percent apart. ${sc.agrees
      ? 'Positions use the average of the two. Agreement shows the two videos match each other, not that either is exact.'
      : `That is past the ${SCALE_DISAGREEMENT_LIMIT_PERCENT} percent limit. Check both crank lengths and that both videos are filmed from straight out to the side.`}`);
  } else if (sc.legMillimeters !== null) {
    const byLeg = Object.values(slots).filter((s) => sc.source[s.id] === 'leg length');
    if (byLeg.length) notes.push(`No crank length is entered for the ${byLeg[0].title}, so its millimeters come from the rider's thigh plus shin length measured on the other video, and the two scales are not checked against each other.`);
    else if (ok.kickr !== ok.open) notes.push('With one video, millimeters rest on that video\'s pedal circle and crank length alone and are not checked against a second video. They can be off by more than the ±.');
  }
  for (const slot of Object.values(slots)) {
    if (sc.poorFit[slot.id]) notes.push(`On the ${slot.title} video the ball of the foot strays from its pedal circle by more than ${PEDAL_FIT_LIMIT_SHARE * 100} percent of the circle's radius, so that video's scale is not checked.`);
  }
  notes.push('The bottom bracket is taken as the center of the circle the ball of the foot traces. It is drawn on each video so you can see if it is off.');
  $('comparison-notes').replaceChildren(...notes.map((n) => html('li', '', n)));
}

// ---------- charts ----------

const CHARTS = [{ key: 'knee', title: 'Knee angle, degrees' }, { key: 'hip', title: 'Hip angle, degrees' }, { key: 'ankle', title: 'Ankle angle, degrees' }];
const BINS = 360 / CURVE_STEP_DEGREES;
const PLOT = { width: 360, height: 216, left: 36, right: 12, top: 10, bottom: 30 };
const chartViews = [];
let hoverBin = null;

function niceScale(low, high) {
  const span = Math.max(high - low, 1);
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => span / s <= 5) || 100;
  const min = Math.floor(low / step) * step, max = Math.ceil(high / step) * step;
  const ticks = [];
  for (let t = min; t <= max + 1e-9; t += step) ticks.push(t);
  return { min, max, ticks };
}

function buildCharts() {
  const grid = $('chart-grid');
  for (const def of CHARTS) {
    const figure = html('figure', 'chart');
    const readout = html('div', 'readout');
    const plot = svg('svg', { viewBox: `0 0 ${PLOT.width} ${PLOT.height}`, role: 'img', tabindex: 0, 'aria-label': `${def.title} against crank angle. Arrow keys read out values.` });
    figure.append(html('h3', '', def.title), readout, plot);
    grid.append(figure);
    const view = { def, readout, plot, x: null, y: null, series: [] };
    chartViews.push(view);
    const binAt = (event) => {
      const box = plot.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width * PLOT.width;
      const degrees = (px - PLOT.left) / (PLOT.width - PLOT.left - PLOT.right) * 360;
      return Math.max(0, Math.min(BINS, Math.round(degrees / CURVE_STEP_DEGREES)));
    };
    plot.addEventListener('pointermove', (e) => setHover(binAt(e)));
    plot.addEventListener('pointerdown', (e) => setHover(binAt(e)));
    plot.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setHover(null); });
    plot.addEventListener('focus', () => { if (hoverBin === null) setHover(0); });
    plot.addEventListener('keydown', (e) => {
      const move = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (e.key === 'Escape') return setHover(null);
      if (!move) return;
      e.preventDefault();
      setHover(((hoverBin ?? 0) + move + BINS) % BINS);
    });
  }
}

function setHover(bin) {
  hoverBin = bin;
  for (const view of chartViews) drawHover(view);
}

function chartSeries(key) {
  return Object.values(slots).filter((s) => s.result && s.result.ok).map((s) => ({ id: s.id, title: s.title, ...s.result.curves[key] }));
}

function renderCharts() {
  const any = Object.values(slots).some((s) => s.result && s.result.ok);
  $('charts-status').hidden = any;
  $('charts-body').hidden = !any;
  for (const key of $('chart-legend').querySelectorAll('[data-series]')) key.hidden = !(slots[key.dataset.series].result && slots[key.dataset.series].result.ok);
  if (!any) return;
  for (const view of chartViews) drawChart(view);
  renderChartTable();
}

function drawChart(view) {
  const { plot } = view;
  const series = chartSeries(view.def.key);
  view.series = series;
  plot.replaceChildren();
  let low = Infinity, high = -Infinity;
  for (const s of series) {
    s.median.forEach((m, i) => {
      if (m === null) return;
      low = Math.min(low, m - s.spread[i]);
      high = Math.max(high, m + s.spread[i]);
    });
  }
  if (!Number.isFinite(low)) return;
  const scale = niceScale(low, high);
  const innerWidth = PLOT.width - PLOT.left - PLOT.right, innerHeight = PLOT.height - PLOT.top - PLOT.bottom;
  const x = (degrees) => PLOT.left + degrees / 360 * innerWidth;
  const y = (value) => PLOT.top + (scale.max - value) / (scale.max - scale.min) * innerHeight;
  view.x = x; view.y = y;
  for (const tick of scale.ticks) {
    plot.append(svg('line', { class: tick === scale.min ? 'axis' : 'grid', x1: PLOT.left, x2: PLOT.width - PLOT.right, y1: y(tick), y2: y(tick) }));
    plot.append(svg('text', { class: 'tick', x: PLOT.left - 6, y: y(tick) + 4, 'text-anchor': 'end' }, String(tick)));
  }
  for (const degrees of [0, 90, 180, 270, 360]) {
    plot.append(svg('text', { class: 'tick', x: x(degrees), y: PLOT.height - 12, 'text-anchor': degrees === 0 ? 'start' : degrees === 360 ? 'end' : 'middle' }, `${degrees}°`));
  }
  plot.append(svg('text', { x: PLOT.left + innerWidth / 2, y: PLOT.height - 1, 'text-anchor': 'middle' }, 'Crank angle'));
  // The stroke repeats, so each curve is closed back to its 0° value at 360°.
  const at = (s, bin) => ({ m: s.median[bin % BINS], sd: s.spread[bin % BINS] });
  for (const s of series) {
    let line = '', pen = false;
    let upper = [], lower = [];
    const flushBand = () => {
      if (upper.length > 1) plot.append(svg('path', { class: `band ${s.id}`, d: `M${upper.join('L')}L${lower.reverse().join('L')}Z` }));
      upper = []; lower = [];
    };
    for (let bin = 0; bin <= BINS; bin++) {
      const { m, sd } = at(s, bin);
      if (m === null) { pen = false; flushBand(); continue; }
      const px = x(bin * CURVE_STEP_DEGREES).toFixed(1);
      line += `${pen ? 'L' : 'M'}${px},${y(m).toFixed(1)}`;
      pen = true;
      upper.push(`${px},${y(m + sd).toFixed(1)}`);
      lower.push(`${px},${y(m - sd).toFixed(1)}`);
    }
    flushBand();
    s.path = line;
  }
  for (const s of series) plot.append(svg('path', { class: `line ${s.id}`, d: s.path }));
  // Direct labels sit where the two curves are farthest apart, each on its own side, with a leader.
  let labelBin = 0, widest = -1;
  for (let bin = 0; bin < BINS; bin++) {
    const values = series.map((s) => s.median[bin]);
    if (values.some((v) => v === null)) continue;
    const gap = series.length > 1 ? Math.abs(values[0] - values[1]) : values[0] - scale.min;
    if (gap > widest) { widest = gap; labelBin = bin; }
  }
  const ordered = [...series].filter((s) => s.median[labelBin] !== null).sort((a, b) => b.median[labelBin] - a.median[labelBin]);
  ordered.forEach((s, rank) => {
    const above = rank === 0;
    const px = x(labelBin * CURVE_STEP_DEGREES), py = y(s.median[labelBin]);
    const room = above ? py - PLOT.top : PLOT.height - PLOT.bottom - py;
    const reach = Math.min(16, Math.max(6, room - 12));
    const ty = above ? py - reach : py + reach;
    const anchor = px < PLOT.left + 50 ? 'start' : px > PLOT.width - PLOT.right - 50 ? 'end' : 'middle';
    plot.append(svg('line', { class: 'leader', x1: px, y1: py + (above ? -3 : 3), x2: px, y2: ty + (above ? 2 : -2) }));
    plot.append(svg('text', { class: 'strong', x: px, y: above ? ty - 2 : ty + 10, 'text-anchor': anchor }, s.title));
  });
  view.hoverLayer = svg('g');
  plot.append(view.hoverLayer);
  drawHover(view);
}

function drawHover(view) {
  if (!view.hoverLayer) return;
  view.hoverLayer.replaceChildren();
  view.readout.replaceChildren();
  if (hoverBin === null || !view.series.length) return;
  const degrees = hoverBin * CURVE_STEP_DEGREES;
  const px = view.x(degrees);
  view.hoverLayer.append(svg('line', { class: 'cross', x1: px, x2: px, y1: PLOT.top, y2: PLOT.height - PLOT.bottom }));
  const lead = html('span', '', 'At ');
  lead.append(html('b', '', `${degrees}°`));
  view.readout.append(lead);
  for (const s of view.series) {
    const m = s.median[hoverBin % BINS];
    if (m === null) continue;
    view.hoverLayer.append(svg('circle', { class: `dot ${s.id}`, cx: px, cy: view.y(m), r: 5 }));
    const item = html('span', 'k');
    item.append(html('span', `sw ${s.id}`), html('b', '', `${plain(m, 1)}°`), document.createTextNode(` ± ${plain(s.spread[hoverBin % BINS], 1)} ${s.title}`));
    view.readout.append(item);
  }
}

function renderChartTable() {
  const table = $('chart-table');
  const present = Object.values(slots).filter((s) => s.result && s.result.ok);
  const head = table.tHead.insertRow(-1);
  table.tHead.replaceChildren(head);
  const first = html('th', '', 'Crank angle');
  first.scope = 'col';
  head.append(first);
  for (const def of CHARTS) for (const s of present) { const th = html('th', 'num', `${def.title.replace(', degrees', '')}, ${s.title}`); th.scope = 'col'; head.append(th); }
  const body = table.tBodies[0];
  body.replaceChildren();
  for (let bin = 0; bin < BINS; bin++) {
    const row = body.insertRow();
    const th = html('th', '', `${bin * CURVE_STEP_DEGREES}°`);
    th.scope = 'row';
    row.append(th);
    for (const def of CHARTS) for (const s of present) {
      const cell = row.insertCell();
      cell.className = 'num';
      const m = s.result.curves[def.key].median[bin];
      cell.textContent = m === null ? '' : `${plain(m, 1)} ± ${plain(s.result.curves[def.key].spread[bin], 1)}`;
    }
  }
}

// ---------- fit sheet diagram ----------

function buildFitControls() {
  const toggles = $('fit-toggles');
  toggles.replaceChildren();
  if (sheet) {
    sheet.riders.forEach((rider, i) => {
      const label = html('label', 'check');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = shownRiders[i];
      box.addEventListener('change', () => { shownRiders[i] = box.checked; renderFitSheet(); });
      label.append(box, html('span', `sw rider-${i + 1}`), document.createTextNode(`Show ${rider.label}'s fit`));
      toggles.append(label);
    });
  }
  const repaint = () => { buildFitControls(); renderReport(); };
  riderButtons($('target-riders'), repaint);
  riderButtons($('entry-riders'), repaint);
  const grid = $('entry-grid');
  grid.replaceChildren();
  const imported = sheet ? sheet.riders[selectedRider] : {};
  for (const key of FIT_NUMBER_KEYS) {
    const field = html('label', 'field');
    const input = document.createElement('input');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.min = '0';
    input.max = '2000';
    input.step = '0.5';
    input.placeholder = typeof imported[key] === 'number' ? String(imported[key]) : 'millimeters';
    const typed = (entered[selectedRider] || {})[key];
    if (typeof typed === 'number') input.value = String(typed);
    input.addEventListener('input', () => {
      const mine = { ...(entered[selectedRider] || {}) };
      const checked = input.value.trim() === '' ? null : sanitizeFitNumbers({ [key]: Number(input.value) });
      if (checked) mine[key] = checked[key]; else delete mine[key];
      entered[selectedRider] = mine;
      for (let i = 0; i < entered.length; i++) entered[i] = entered[i] || {};
      writeStored(KEY_ENTERED, entered);
      renderReport();
      renderSlot(slots.open);
    });
    field.append(html('span', 'field-label', FIT_LABELS[key]), input);
    grid.append(field);
  }
}

function renderFitSheet() {
  const all = riders();
  const names = all.map((r) => (r.bike ? `${r.label} (${r.bike})` : r.label));
  $('fit-status').textContent = sheet
    ? `Fit sheet on this device for ${listNames(names)}.`
    : 'No fit sheet on this device. Open the import link on this device to add one, or type numbers below.';
  const c = currentComparison;
  const groups = [];   // { rider, kind: 'sheet' | 'kickr-video' | 'open-video', points: [[x, y]], label }
  all.forEach((rider, i) => {
    if (!shownRiders[i]) return;
    const points = [];
    if (typeof rider.saddleBehind === 'number' && typeof rider.saddleAbove === 'number') points.push([-rider.saddleBehind, rider.saddleAbove]);
    if (typeof rider.barAhead === 'number' && typeof rider.barAbove === 'number') points.push([rider.barAhead, rider.barAbove]);
    if (typeof rider.hoodAhead === 'number' && typeof rider.hoodAbove === 'number') points.push([rider.hoodAhead, rider.hoodAbove]);
    if (points.length) groups.push({ rider: i, kind: 'sheet', points, label: rider.label });
  });
  const position = Object.fromEntries(c.positions.map((p) => [p.key, p]));
  for (const id of ['kickr', 'open']) {
    if (!position.hipBehind[id]) continue;
    groups.push({ rider: videoRiderIndex(), kind: `${id}-video`, unchecked: !c.scale.checked[id], points: [[-position.hipBehind[id].value, position.hipAbove[id].value], [position.wristAhead[id].value, position.wristAbove[id].value]], label: null });
  }
  $('fit-unchecked-note').hidden = !groups.some((g) => g.unchecked);
  const diagram = $('fit-diagram');
  diagram.replaceChildren();
  document.querySelector('.fit-figure').hidden = !groups.length;
  $('fit-legend').hidden = !groups.length;
  if (!groups.length) return;
  // Equal scale on both axes; the frame is the data plus the origin, padded.
  const xs = [0], ys = [0];
  for (const g of groups) for (const [px, py] of g.points) { xs.push(px); ys.push(py); }
  const pad = 110;
  const minX = Math.floor((Math.min(...xs) - pad) / 100) * 100, maxX = Math.ceil((Math.max(...xs) + pad) / 100) * 100;
  const minY = Math.floor((Math.min(...ys) - pad) / 100) * 100, maxY = Math.ceil((Math.max(...ys) + pad) / 100) * 100;
  const margin = { left: 40, right: 10, top: 10, bottom: 34 };
  // Drawn at the figure's own width, so the 11 px labels stay 11 px on a phone.
  const width = Math.max(300, Math.min(640, document.querySelector('.fit-figure').clientWidth - 16));
  const unit = (width - margin.left - margin.right) / (maxX - minX);
  const gridStep = unit * 200 >= 75 ? 200 : 400;
  const height = margin.top + (maxY - minY) * unit + margin.bottom;
  diagram.setAttribute('viewBox', `0 0 ${width} ${height.toFixed(0)}`);
  const x = (mm) => margin.left + (mm - minX) * unit, y = (mm) => margin.top + (maxY - mm) * unit;
  for (let mm = Math.ceil(minX / gridStep) * gridStep; mm <= maxX; mm += gridStep) {
    diagram.append(svg('line', { class: 'grid', x1: x(mm), x2: x(mm), y1: y(maxY), y2: y(minY) }));
    diagram.append(svg('text', { class: 'tick', x: x(mm), y: y(minY) + 14, 'text-anchor': 'middle' }, mm === 0 ? '0' : `${Math.abs(mm)} ${mm < 0 ? 'behind' : 'ahead'}`));
  }
  for (let mm = Math.ceil(minY / gridStep) * gridStep; mm <= maxY; mm += gridStep) {
    diagram.append(svg('line', { class: 'grid', x1: x(minX), x2: x(maxX), y1: y(mm), y2: y(mm) }));
    diagram.append(svg('text', { class: 'tick', x: margin.left - 6, y: y(mm) + 4, 'text-anchor': 'end' }, String(mm)));
  }
  diagram.append(svg('text', { x: margin.left + (width - margin.left - margin.right) / 2, y: height - 4, 'text-anchor': 'middle' }, 'Millimeters from the bottom bracket'));
  diagram.append(svg('path', { class: 'origin', d: `M${x(0) - 8},${y(0)}H${x(0) + 8}M${x(0)},${y(0) - 8}V${y(0) + 8}` }));
  diagram.append(svg('text', { class: 'strong', x: x(0) + 12, y: y(0) + 4 }, 'Bottom bracket'));
  for (const g of groups) {
    const layer = svg('g', { class: `rider-${g.rider + 1}${g.unchecked ? ' unchecked' : ''}` });
    const kindClass = g.kind === 'sheet' ? 'sheet' : g.kind;
    layer.append(svg('path', { class: `link ${kindClass}`, d: `M${g.points.map(([px, py]) => `${x(px).toFixed(1)},${y(py).toFixed(1)}`).join('L')}` }));
    for (const [px, py] of g.points) layer.append(svg('circle', { class: g.kind === 'sheet' ? 'hollow' : 'filled', cx: x(px), cy: y(py), r: 6 }));
    diagram.append(layer);
  }
  // One direct label per rider: a short stroke of the rider's color, then the name in ink. The names
  // are stacked under the lowest saddle point so two riders' labels never land on each other.
  const named = groups.filter((g) => g.label);
  if (named.length) {
    const left = Math.max(margin.left + 4, Math.min(...named.map((g) => x(g.points[0][0]))) - 8);
    const top = Math.max(...named.map((g) => y(g.points[0][1]))) + 24;
    named.forEach((g, row) => {
      const key = svg('g', { class: `rider-${g.rider + 1}` });
      key.append(svg('path', { class: 'name-key', d: `M${left},${top + 14 * row - 4}h14` }));
      diagram.append(key, svg('text', { class: 'strong', x: left + 20, y: top + 14 * row }, g.label));
    });
  }
}

// ---------- what is stored, and deleting it ----------

function renderStored() {
  const items = [];
  for (const slot of Object.values(slots)) {
    if (!slot.record) continue;
    items.push(slot.blob ? `${slot.title} video and its tracking, ${megabytes(slot.blob.size)} megabytes` : `${slot.title} tracking, without the video`);
  }
  if (sheet) items.push(`Fit numbers from the import link for ${listNames(sheet.riders.map((r) => r.label))}`);
  if (entered.some((e) => e && Object.keys(e).length)) items.push('Fit numbers typed on this page');
  if (Object.keys(kickrNow).length) items.push('Tape readings typed for the Kickr Shift');
  if (Object.values(slots).some((s) => s.crank !== null)) items.push('Crank lengths');
  $('stored-list').replaceChildren(...(items.length ? items : ['Nothing is stored.']).map((t) => html('li', '', t)));
  $('delete-all').disabled = Boolean(tracking);
}

function askDelete(asking) {
  $('delete-all').hidden = asking;
  $('delete-confirm').hidden = !asking;
  $('delete-cancel').hidden = !asking;
  $('delete-note').textContent = asking ? 'This removes both videos, their tracking, the fit numbers, the tape readings and the crank lengths from this device.' : '';
}

async function deleteEverything() {
  askDelete(false);
  stopBoth();
  const blocked = await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve(false);
    request.onerror = () => resolve(false);
    request.onblocked = () => resolve(true);
  });
  let cleared = true;
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(KEY_PREFIX)) localStorage.removeItem(key);
    if ('caches' in window) for (const name of await caches.keys()) await caches.delete(name);
  } catch { cleared = false; }
  for (const slot of Object.values(slots)) {
    leaveLevelTool(slot);
    setVideo(slot, null);
    slot.record = null; slot.result = null; slot.note = ''; slot.crank = null;
    slot.crankInput.value = '';
  }
  sheet = null;
  entered = [];
  kickrNow = {};
  for (const input of document.querySelectorAll('.now-input')) input.value = '';
  resetFitView();
  buildFitControls();
  $('notice').hidden = true;
  render();
  $('delete-note').textContent = blocked ? 'Another tab has this page open, so the videos are not deleted yet. Close it, then delete again.'
    : cleared ? 'Deleted. Nothing from this page is stored on this device.'
    : 'The videos are deleted. This browser did not clear the rest. Clear this site\'s data in the browser settings.';
}

// ---------- the report as a whole ----------

let currentComparison = null;
const compareSlots = () => compare(slots.kickr.result, slots.open.result, slots.kickr.crank, slots.open.crank);

function renderReport() {
  currentComparison = compareSlots();
  renderAnswer(currentComparison);
  renderTargets();
  renderComparison(currentComparison);
  renderCharts();
  renderFitSheet();
  renderStored();
}

function wireReport() {
  buildCharts();
  buildFitControls();
  wireTargets();
  let figureWidth = 0;
  new ResizeObserver(([entry]) => {
    const now = Math.round(entry.contentRect.width);
    if (now && now !== figureWidth && currentComparison) { figureWidth = now; renderFitSheet(); }
  }).observe(document.querySelector('.fit-figure'));
  $('delete-all').addEventListener('click', () => askDelete(true));
  $('delete-cancel').addEventListener('click', () => askDelete(false));
  $('delete-confirm').addEventListener('click', () => deleteEverything().catch(crash));
}

// ---------- start ----------

// Last resort for a failure nothing else turned into a sentence: say so instead of going quiet.
function crash(error) {
  $('notice').textContent = `Something went wrong on this page: ${error && error.message ? error.message : 'unknown error'}. Reload the page. What is stored on this device stays.`;
  $('notice').hidden = false;
}

const supported = typeof WebAssembly === 'object' && WebAssembly.validate(SIMD_PROBE) && 'indexedDB' in window;

async function start() {
  $('boot').remove();
  for (const def of SLOT_DEFINITIONS) slots[def.id] = buildSlot(def);
  if (!supported) {
    $('notice').textContent = UNSUPPORTED;
    $('notice').hidden = false;
  }
  const cranks = readStored(KEY_CRANKS);
  for (const slot of Object.values(slots)) {
    if (cranks && validCrank(cranks[slot.id])) {
      slot.crank = cranks[slot.id];
      slot.crankInput.value = String(slot.crank);
    }
  }
  $('shared-angle').addEventListener('input', () => {
    stopBoth();
    $('shared-angle-value').textContent = `${$('shared-angle').value}°`;
    showBothAt(Number($('shared-angle').value));
  });
  $('play-both').addEventListener('click', playBoth);
  loadFitNumbers();
  wireReport();
  render();
  receiveImport();
  // Whatever happens while stored slots are read back, the file pickers are handed over afterwards.
  try {
    if (supported) await Promise.all(Object.values(slots).map(restoreSlot));
  } finally {
    restoring = false;
    render();
  }
}

start().catch(crash);
