// Bike fit comparison: page behavior.
// The fit math is in core.js (pure). This file owns the DOM, the video elements, the pose tracker
// and what is stored on the device. Nothing here talks to another origin.
import { PoseLandmarker } from './vendor/tasks-vision/vision_bundle.mjs';
import { analyze, frameForCrankAngle } from './core.js';

const TRACKER_FILES = {
  wasmLoaderPath: './vendor/tasks-vision/wasm/vision_wasm_internal.js',
  wasmBinaryPath: './vendor/tasks-vision/wasm/vision_wasm_internal.wasm',
};
const MODEL_URL = './vendor/pose_landmarker_heavy.task';
// Longer clips add minutes of tracking and no information; the filming checklist asks for 15 seconds.
const MAX_TRACKED_SECONDS = 30;
// Tracking samples faster than this are thinned: 60 per second already puts 40 samples in a pedal stroke.
const MAX_SAMPLES_PER_SECOND = 60;
const COMMON_FRAME_RATES = [24, 25, 30, 48, 50, 60, 90, 100, 120, 240];
const CRANK_RANGE = [100, 220];
// A WebAssembly module that uses one SIMD instruction; the vendored tracker needs SIMD.
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
const UNSUPPORTED = 'This browser cannot run the pose tracker. Use a current Chrome, Edge or Firefox, or Safari 16.4 or later.';
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
const KEY_CRANKS = 'bike-fit.cranks';

function withStore(mode, work) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: 'id' });
    open.onerror = () => reject(open.error);
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

// ---------- the two slots ----------

const SLOT_DEFINITIONS = [
  { id: 'kickr', title: 'Kickr Shift', crankNote: 'The Kickr Shift crank has pedal holes for 165, 167.5, 170, 172.5 and 175 millimeters.' },
  { id: 'open', title: 'Open MIN.D', crankNote: '', checklist: true },
];
const slots = {};
let tracking = null;    // the slot being tracked; one video at a time
let bothPlaying = false;

function buildSlot(def) {
  const el = $('slot-template').content.firstElementChild.cloneNode(true);
  el.dataset.slot = def.id;
  const q = (selector) => el.querySelector(selector);
  const slot = {
    ...def, el,
    status: q('.slot-status'), progress: q('.slot-progress'), fileInput: q('.file-input'), fileLabel: q('.file-label'), fileButton: q('.btn.file'),
    cancel: q('.cancel'), checklist: q('.checklist'), checklistRow: q('.checklist-row'),
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
  if (!def.checklist) { slot.checklist.remove(); slot.checklistRow.remove(); slot.checklist = null; slot.checklistRow = null; }
  wireSlot(slot);
  $('slots').append(el);
  return slot;
}

// ---------- tracking a video ----------

let modelBytes = null;
async function loadModel(onProgress) {
  if (modelBytes) return modelBytes;
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Problem(`The pose model did not load (the server answered ${response.status}). Reload the page and choose the video again.`);
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

function videoReady(video) {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2) return resolve();
    const done = (ok) => { video.removeEventListener('loadeddata', good); video.removeEventListener('error', bad); ok ? resolve() : reject(new Problem('This video could not be opened in this browser. Choose another file.')); };
    const good = () => done(true), bad = () => done(false);
    video.addEventListener('loadeddata', good);
    video.addEventListener('error', bad);
  });
}

// Frames per second, read from the video itself: the time between frames the browser presents while
// it plays for a moment. Browsers without that callback, or a video that will not play, get 30.
function measureFrameRate(video) {
  if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
    // Still play for an instant: iOS Safari decodes nothing for seeking until a video has played.
    return video.play().then(() => video.pause(), () => {}).then(() => 30);
  }
  return new Promise((resolve) => {
    const times = [];
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      video.pause();
      const gaps = [];
      for (let i = 1; i < times.length; i++) if (times[i] > times[i - 1]) gaps.push(times[i] - times[i - 1]);
      if (gaps.length < 5) return resolve(30);
      gaps.sort((a, b) => a - b);
      const rate = 1 / gaps[gaps.length >> 1];
      const common = COMMON_FRAME_RATES.find((c) => Math.abs(rate - c) / c < 0.04);
      resolve(common || round(rate, 2));
    };
    const onFrame = (now, meta) => {
      times.push(meta.mediaTime);
      if (times.length >= 14) finish();
      else if (!finished) video.requestVideoFrameCallback(onFrame);
    };
    const timer = setTimeout(finish, 1500);
    video.requestVideoFrameCallback(onFrame);
    video.playbackRate = 1;
    video.play().catch(finish);
  });
}

// Shows one moment of the video and resolves once that picture is decoded.
function seekTo(video, seconds) {
  return new Promise((resolve) => {
    if (video.currentTime === seconds && !video.seeking) return resolve();
    const done = () => { video.removeEventListener('seeked', onSeeked); clearTimeout(timer); resolve(); };
    const onSeeked = () => {
      if (video.readyState >= 2) return done();
      video.addEventListener('canplay', done, { once: true });
    };
    const timer = setTimeout(done, 3000);
    video.addEventListener('seeked', onSeeked);
    video.currentTime = seconds;
  });
}

const CANCELLED = Symbol('cancelled');

async function trackFile(slot, file) {
  if (tracking) return;
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
    await videoReady(slot.video);
    const video = slot.video;
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Problem('This video has no readable length. Choose another file.');
    const measured = await measureFrameRate(video);
    const framesPerSecond = measured > MAX_SAMPLES_PER_SECOND ? measured / Math.ceil(measured / MAX_SAMPLES_PER_SECOND) : measured;
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
    for (let i = 0; i < count; i++) {
      if (job.cancelled) throw CANCELLED;
      await seekTo(video, (i + 0.5) / framesPerSecond);
      const found = landmarker.detectForVideo(video, Math.round(i * 1000 / framesPerSecond)).landmarks[0];
      frames.push(found ? found.map((p) => [round(p.x, 5), round(p.y, 5), round(p.z, 4), round(p.visibility ?? 0, 3)]) : null);
      job.done = i + 1;
      renderStatus(slot);
    }
    slot.record = { frames, width: video.videoWidth, height: video.videoHeight, framesPerSecond, levelLine: null, truncated: video.duration > MAX_TRACKED_SECONDS + 0.5 };
    compute(slot);
    slot.note = await persist(slot);
    await seekTo(video, 0.5 / framesPerSecond);
  } catch (error) {
    // A cancelled or failed replacement leaves the slot as it was stored.
    const note = error === CANCELLED ? '' : error instanceof Problem ? error.message : `Tracking stopped: ${error && error.message ? error.message : 'unknown error'}. Choose the video again.`;
    await restoreSlot(slot);
    slot.note = note;
  } finally {
    if (landmarker) landmarker.close();
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
  const { frames, width, height, framesPerSecond, levelLine, truncated } = stored;
  slot.record = { frames, width, height, framesPerSecond, levelLine: levelLine || null, truncated: Boolean(truncated) };
  compute(slot);
  setVideo(slot, stored.video instanceof Blob ? stored.video : null);
  if (slot.url) {
    try { await videoReady(slot.video); await seekTo(slot.video, 0.5 / framesPerSecond); } catch { setVideo(slot, null); }
  }
  if (slot.record && !slot.url) slot.note = 'The video itself is not stored on this device. Choose it again to play it.';
}

// ---------- status sentences ----------

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
    return job.total >= job.done ? `Loading the pose model: ${megabytes(job.done)} of ${megabytes(job.total)} megabytes.` : `Loading the pose model: ${megabytes(job.done)} megabytes.`;
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
    if (slot.record.truncated) out.push(`Only the first ${MAX_TRACKED_SECONDS} seconds were tracked.`);
    if (r.cameraDriftPixels > 0.1 * r.pedalCircle.radius) out.push('The camera moved during the clip, which widens the spread; a steady phone gives tighter numbers.');
    if (slot.crank === null) out.push('Enter the crank length to get millimeters.');
  } else if (r) {
    if (r.reason === 'tracking-lost') out.push(`${r.lost.length ? describeLost(r.lost) : 'Tracking lost.'} Film again with your whole body in the picture, then replace the video.`);
    else if (r.reason === 'not-side-on') out.push('Rider not side-on. Film from straight out to the side of the bike, then replace the video.');
    else out.push('No full pedal stroke found. Film at least 10 seconds of steady pedaling, then replace the video.');
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
  const center = at(r.pedalCircle.centers[i]);
  cased(() => { g.beginPath(); g.arc(center[0], center[1], r.pedalCircle.radius * k, 0, 2 * Math.PI); }, 1);
  cased(() => { g.beginPath(); g.moveTo(center[0] - 9, center[1]); g.lineTo(center[0] + 9, center[1]); g.moveTo(center[0], center[1] - 9); g.lineTo(center[0], center[1] + 9); }, 2);
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
    slot.skeletonButton.textContent = slot.showSkeleton ? 'Skeleton on' : 'Skeleton off';
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
  slot.fileLabel.textContent = slot.record ? 'Replace video' : 'Choose video';
  const locked = Boolean(tracking) || !supported;
  slot.fileInput.disabled = locked;
  slot.fileButton.classList.toggle('disabled', locked);
  slot.cancel.hidden = !busy;
  slot.stageWrap.hidden = !slot.url;
  slot.player.hidden = !playable;
  slot.levelTool.hidden = !playable;
  if (slot.checklist) {
    // The filming checklist fills the empty slot, then folds into a row under the loaded video.
    const loaded = Boolean(slot.record) || busy;
    if (loaded && slot.checklist.parentElement !== slot.checklistRow) slot.checklistRow.append(slot.checklist);
    if (!loaded && slot.checklist.parentElement === slot.checklistRow) slot.status.after(slot.checklist);
    slot.checklist.hidden = false;
    slot.checklistRow.hidden = !loaded;
  }
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
  if (marking) slot.levelNote.textContent = 'Drag the two handles onto something level, such as the line where the floor meets the wall.';
  else if (r && r.ok && slot.record.levelLine) slot.levelNote.textContent = `Camera roll of ${round(Math.abs(r.rollDegrees), 1)}° corrected in positions and the torso angle.`;
  else slot.levelNote.textContent = 'Optional. One degree of camera roll moves the hip about 12 millimeters.';
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
    if (slot.crank !== null) fact(body, 'Camera movement during the clip, millimeters', `${round(r.cameraDriftPixels * slot.crank / r.pedalCircle.radius)}`);
  }
  draw(slot);
}

function render() {
  for (const slot of Object.values(slots)) renderSlot(slot);
  const both = bothReady() && !tracking;
  $('shared').hidden = !both;
  if (!both) stopBoth();
}

// ---------- start ----------

// Last resort for a failure nothing else turned into a sentence: say so instead of going quiet.
function crash(error) {
  $('notice').textContent = `Something went wrong on this page: ${error && error.message ? error.message : 'unknown error'}. Reload it; what is stored on this device is kept.`;
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
  render();
  if (supported) await Promise.all(Object.values(slots).map(restoreSlot));
  render();
}

start().catch(crash);
