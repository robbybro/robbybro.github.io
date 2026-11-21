# Vendored third-party files

Everything the page runs that was not written here. Nothing is loaded from another origin at runtime.
Checked and recorded 2026-11-20.

## MediaPipe Tasks Vision (pose tracking library)

| | |
|---|---|
| Package | `@mediapipe/tasks-vision` |
| Version | `0.10.35`, published 2026-04-27 |
| Source | `https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-0.10.35.tgz` |
| Tarball SHA-256 | `84597a25e13d123b5f4cbe768bb72e97a2c28c7a465f0ace287d8cbe5246bff0` |
| Tarball integrity (npm registry, matched) | `sha512-HOvadwVRE6JC+45nyYhmnywnr5h/J8KZvOeUNVOG9q/0875pZgItznFB9bRTvLc264YSJqiZ1NsIpCStJw/egg==` |
| License | Apache License 2.0. `package.json` declares `Apache-2.0`; the tarball ships no license file, so `LICENSE` here is the text fetched from `https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE` on 2026-11-20 (SHA-256 `8707eef0533987efc5b155d64761eeb6e20793f50b9bd1a68dad1cf4719d0ed8`, "Apache License, Version 2.0, January 2004"). |

Files copied unmodified from the tarball's `package/` folder:

| File here | SHA-256 |
|---|---|
| `tasks-vision/vision_bundle.mjs` | `55d7ab624fbb70dcc5adc4ae6d7ea9cfcb569139d3dbfbf2b1deafcb966bc0fe` |
| `tasks-vision/wasm/vision_wasm_internal.js` | `e7fd9858e8e8f221d9b96eddc11f8e077f263e0b7bbd79d3cbe882b134274f8c` |
| `tasks-vision/wasm/vision_wasm_internal.wasm` | `6a5c64584c2ab61c763b6e204afbdbc7ce1caf7f5216187322bca8df94f646bc` |

Not copied: the CommonJS bundle, the source maps, the type definitions, and the `module` and `nosimd`
WebAssembly variants. The page loads the standard build only, which needs WebAssembly SIMD
(Chrome 91, Firefox 89, Safari 16.4 or later).

### Why 0.10.35 and not the newest release

- Newest on 2026-11-20 is `1.2.3`, published 2026-11-11: nine days old, inside the two-week hold.
- Every `1.x` release checked (`1.0.1`, `1.1.1`, `1.2.0`, `1.2.2`) sends usage metrics to Google: the
  bundle posts to `https://odml.pa.googleapis.com/v1/log` when a task is created, with no option to turn
  it off, and the package's own privacy notice (README, "Last modified: June 5, 2026") says so. That was
  observed here: with `1.2.2` loaded, the browser reported the request and the Content-Security-Policy
  blocked it.
- `0.10.35` is the last release whose bundle contains no such call (`0.10.34` and `0.10.35` were searched
  for `odml.pa.googleapis`: no match). The only URLs in its two JavaScript files are documentation links
  inside the WebAssembly loader, and neither file uses `eval(` or `new Function`.
- The page's `connect-src 'self'` policy stays as the second barrier if a later upgrade brings the call back.

### When to upgrade

Stay on `0.10.35` until one of these is true, then vendor a newer release and rerun the page's checks:

- A security advisory names this release, or names a code path this page uses.
- A `1.x` release that is at least two weeks old drops the usage-metrics call or adds a way to turn it off.
- A browser change breaks the path this page uses (the WebAssembly loader, `createFromOptions`, `detectForVideo`).
- The page ever accepts input from anywhere other than the owner's own file picker.

If none has happened by 2027-05-20, decide again on that date.

Before upgrading: search the new bundle for `googleapis` and read the package's privacy notice.

### Maintenance (checked 2026-11-20)

| | |
|---|---|
| Maintainer | Google (`google-ai-edge/mediapipe` on GitHub) |
| GitHub stars | 37,762 |
| Last push to the repository | 2026-11-20 |
| npm downloads, week of 2026-11-13 | 8,818,474 |
| Release cadence | eight releases between 2026-04-27 and 2026-11-11 |
| How much of this page touches it | two calls in `app.js`: `PoseLandmarker.createFromOptions` and `detectForVideo` |

## Pose model

| | |
|---|---|
| File | `pose_landmarker_heavy.task` (BlazePose GHUM 3D, heavy, 16-bit float weights) |
| Source | `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task` (stored 2023-04-28; the `float16/1/` path serves the same bytes) |
| SHA-256 | `64437af838a65d18e5ba7a0d39b465540069bc8aae8308de3e318aad31fcbc7b` |
| Same file as | `https://huggingface.co/litert-community/MediaPipe-PoseLandmarker-Heavy`, the model page Google's Pose Landmarker guide links to; its file hash matches |
| License | Apache License 2.0, as stated on that model page: "Stated as Apache License, Version 2.0 in the bundled upstream Google model-card PDF." Read 2026-11-20. |

The model is handed to the library as bytes (`modelAssetBuffer`), fetched from this folder.

### Why the heavy model and not the full one

Both were run on a real side-on riding clip. Shoulder, elbow, wrist, hip, knee and ankle landed in the
same places with either. The heel and toe did not: on the upstroke the full model's foot points trailed
the shoe, and the heavy model's stayed on it. The pedal circle, the bottom bracket estimate and the ankle
angle all rest on those two points, so the heavy model is used. The cost is a file about three times
larger (30.7 MB against 9.4 MB) and more time per frame.

### Why the CPU delegate

The library can run the model on the graphics processor or in WebAssembly on the processor. The two give
slightly different joint positions for the same frame, and graphics processors differ between devices.
Two videos compared here may be analyzed on different devices, so the page always uses the processor
(`delegate: "CPU"`), which computes the same way everywhere.

## Content-Security-Policy

The page ships the policy from the plan unchanged. No directive was loosened.

| Directive | Why the library needs it |
|---|---|
| `script-src 'self' 'wasm-unsafe-eval'` | the loader is added as a same-origin script tag, and compiling WebAssembly needs `'wasm-unsafe-eval'` |
| `connect-src 'self'` | the WebAssembly binary and the model are fetched from this folder |
