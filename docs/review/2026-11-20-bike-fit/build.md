# Build record: bike fit comparison page, 2026-11-20

Builder's record for `artifacts/bike-fit/`. It holds no fit number, no rider name and no value measured
from the real video. Captures, tracking data and measured values live outside the repo, under
`~/.claude/dispatch/out/bike-fit/` on the build machine.

## Commits

### First build (range `0a178a8..d65c633`)

| Plan step | Commit | What |
|---|---|---|
| 1 | `5d86562` | Vendored tracking library and model, `VENDOR.md`, `.gitignore` video suffixes, `build.py` unlisted marker and guard |
| 2 | `46df349` | `core.js` (pure fit math), `tests/core.test.mjs`, `tests/package.json` |
| 3 | `e6eaa15` | `index.html`, `style.css`, `app.js`: two slots, on-device tracking, IndexedDB, player with the tracked joints, states |
| 4 | `0d1505b` | Answer block, targets, comparison, charts, fit sheet diagram, import link, delete, `SOURCES.md` |
| 5 | `eee7697` | Found while verifying: reading the database no longer leaves an empty one; phone answer table; legend keys |
| 5 | `09f20ad` | Test fixtures changed so no invented value echoes a real one |
| 5 | `d65c633` | Fit sheet diagram drawn at its own width; rider names no longer overlap |

### Fix round after review rounds one and two (range `d65c633..HEAD`)

| Group | Commit | What |
|---|---|---|
| D, correctness | `7ffdf8e` | Short tracked runs excluded instead of centered by the whole video; a stalled seek becomes a lost frame; sampling-rate decision moved to `core.js` with tests; no video can start until stored slots are read back; an import asks before replacing typed numbers; singular "1 pedal stroke"; invisible labels rejected |
| C, numbers that claim too much | `efaf676` | Pedal-circle fit error gates each video's scale; "scale not checked" on rows, adjustments and diagram markers; footnotes say what the plus-or-minus does and does not cover |
| A, the answer from the videos | `e7ebb4a` | "No measurable difference" with a dash, decided on the rounded numbers shown; one caution line above the table; "straight up and straight back" footnote; waiting cells are links that name the bike |
| B, the tape-measure route | `d11c9ef` | Targets section first on the page: Measure, Target, Now on the Kickr Shift, Move; one-line definitions; crank length row; move computation in `core.js` with tests |
| E, phone use | `76bf87c` | Screen wake lock during tracking and the sentence that asks for it; one filming checklist above both slots; 15 seconds in both places |
| F, strings | `70f8d28` | The content seat's strings, plus the one-line style changes from the content and UX reviews |
| G1, outside the page | `eb895ad` | `integrity` and `crossorigin="anonymous"` on Leaflet in `cross-washington-trail` and `willamette-bikeway` |
| G2 | `1c980f5` | `VENDOR.md`: when the vendored library is upgraded, and the date to decide again |
| H | this commit | This record |

## Design decisions

| Decision | Choice | Why |
|---|---|---|
| Library version | `@mediapipe/tasks-vision` 0.10.35 | Every 1.x release checked posts usage metrics to a Google endpoint with no switch; 0.10.35 is the last without the call. Security seat ruled: stay. Upgrade rule is in `vendor/VENDOR.md`. |
| Model | heavy pose model | On a real side-on riding video the full model's heel and toe points trailed the shoe on the upstroke; the pedal circle and ankle angle rest on those points. |
| Delegate | CPU only | The graphics delegate gives slightly different joint positions and differs between devices; two videos may be tracked on different devices. |
| Frame stepping | seek, await `seeked`, then track | Gives every frame once, in order, on every browser. In Chrome it returned the same landmarks as also waiting for a presented-frame callback. |
| Sampling rate | middle of the cluster of shortest gaps between presented frames; under 24 becomes 30; capped at 60 | A busy browser skips frames, which only lengthens gaps. The first version used the median and once read a third of the true rate. Now a tested pure function. |
| Pedal circle | ball of the foot at 0.67 of the heel-to-toe line; circle refitted around every frame from the two surrounding strokes | The fitted radius was stable across foot points; refitting follows a hand-held camera's drift. A run too short to refit is left out, not centered by the whole video. |
| Smoothing | five-point quadratic; gaps of three frames or fewer bridged | A moving average would shrink the pedal circle. |
| Spread | standard deviation between pedal strokes; two videos combine as the root of the sum of squares | Named for what it is. It is not an accuracy. |
| Adjustments | hip joint and wrist positions about the bottom bracket, Open minus Kickr, straight up and straight back | The Kickr Shift's seatpost angle could not be verified from Wahoo's documents, so nothing is resolved along the post. |
| Scale | each video's crank length over its pedal-circle radius; thigh plus shin must then agree; the average is used for both | The same rider is on both bikes. Disagreement past 5 percent greys the rows. |
| Scale gate | foot path more than 5 percent of the radius off its circle marks that video "scale not checked" | Same share at which two disagreeing videos are refused; one video alone is never called checked. |
| Fit numbers | arrive only by an import link in the address fragment, or typed on the page | Nothing personal is in the repo. The fragment is read and removed before anything asynchronous runs. |
| Rider names | built at runtime from the import payload | The source carries no names. |
| Delete | this page's database, this page's `bike-fit.` localStorage keys, every Cache Storage cache | Sibling pages on the same origin keep their own localStorage. Security seat ruled the scope satisfies S8. |
| Wahoo facts | adjuster names and the five crank holes, from the owner's manual; no units claimed | `SOURCES.md` cites page and date. |
| Content-Security-Policy | the plan's policy, unchanged | No directive was loosened in either round. |
| Tests entry | `tests/package.json` names the test file | So `node --test artifacts/bike-fit/tests/` works on current Node. |

## Fix round: what was checked

All checks ran in headless Google Chrome on the build machine against the page's own code, with one
real riding video chosen through the file input, and with invented riders ("Rider A", "Rider B") for
every fit number.

| Check | Result | How |
|---|---|---|
| AC1 skeleton on the eight near-side joints at three crank positions | Pass | Three stage captures read by eye |
| AC2 strokes, cadence and six measure groups with spread | Pass | Written to `kickr-measures.json` outside the repo |
| AC3 same video in both slots | Pass | Every difference 0; all four rows "No measurable difference" with a dash and their spread |
| AC4 unit tests | Pass | `node --test artifacts/bike-fit/tests/`: 31 tests, 31 pass |
| AC5 crafted import links | Pass | Six crafted links and tampered storage: nothing stored, nothing injected, fragment gone; a valid link asks first |
| AC6 no media, names or fit numbers; one origin | Pass | Range scan; network log shows the page's own origin only; `build.py` output has no mention of the page |
| AC7 delete | Pass | Database, this page's keys and caches gone, also after reload; a sibling page's key survives |
| AC8 layout | Pass | 390 and 1280 pixels, light and dark, three states: no sideways scroll, targets then the video answer first, no control under 48 pixels |
| AC9 palette | Pass | The data-viz validator, both pairs, light and dark |
| A1 | Pass | Unit tests on rounded decisions; page rows checked |
| B1 | Pass | Unit tests on the move computation; typed readings give direction and millimeters, persist across reload, out-of-range reading is not stored |
| C1 | Pass | Unit test with scattered foot points either side of the limit; page marks rows, adjustments and markers |
| D1 | Pass | Unit test: drifting camera with tracking cut into short runs |
| D2 | Pass | Seeks made to stall in the browser: five frames recorded as lost and named; eight in a row stop tracking with a sentence |
| D3 | Pass | Unit tests: 24, 25, 30, 50, 60, 90, 100, 120, 240, skipped frames, jittered and variable-rate timestamps |
| D4 | Pass | With the stored video made slow to load, both file inputs stay disabled until it is read back |
| D5 | Pass | Typed numbers with no sheet: a valid link asks; "Keep" leaves them, "Replace" replaces them |
| E1 | Pass | With the wake-lock interface stubbed: requested at the start, released on finish, cancel and error |
| G1 | Pass | Hashes computed from the fetched files equal the security review's; both map pages load Leaflet, tiles and markers |

## How the hand-set capture came about (H1)

`answer-360-answer.png` and `answer-390-answer.png` in the first round were made by a width-measuring
script that wrote text straight into the answer table's cells with `page.evaluate` (a direction, a
number and a spread, the same in all four rows) to see how wide the columns grew. No tracking and no
call to `compare` produced them, so they showed a pairing the code cannot produce. They were never
cited as acceptance evidence, but they sat in the evidence folder unlabeled, which was wrong. Both are
deleted. Every answer-state capture in `v2/` comes from the page's own code:

| State | Source of the data |
|---|---|
| Waiting for a video | the page with nothing loaded |
| No measurable difference, scale not checked | the real video in both slots |
| Direction and millimeters | tracking for two invented stick-figure riders written into the page's database, then read back and compared by the page; file names say `synthetic` |
| Scale disagrees; needs a crank length | the same invented riders with a wrong or missing crank length typed into the page |

## Left out, and why

| Item | Why |
|---|---|
| Content P3 24, "Lengthen" / "Shorten" | The lead's B1 keeps "Lengthen reach" / "Shorten reach" |
| Content P3 22 beyond the crank fields | The fit number fields keep "millimeters" or the imported value; an example there would be an invented fit number in the source |
| UX P3 10, sort one rider first | The source cannot name a rider; order follows the import payload |
| UX P3 11, drop the dotted key, add a zoomed view | The content seat keeps the "Fit sheet" line key; a second view is more than a one-line change |
| Engineering P3 11 to 18, 20 to 22 | Not on the lead's list for this round |
| A typed body anchor, a systematic-error fixture, a time estimate, a narrower cache wipe | Ruled out of this round by the lead |

Added beyond the list, each small: tracking stops with a sentence after eight stalled seeks in a row
(part of the engineering seat's finding on stalled seeks); with no fit numbers on the device, one line
above the video answer says so and links to where they can be typed.

## Not verified

- Nothing has run on a phone, on Firefox or on Safari. Frame stepping on iOS Safari is reasoned, not seen.
- The screen wake lock was exercised through a stub; a real phone's behavior is not confirmed.
- Absolute millimeters from a video have no ground truth; the page now says so instead of implying otherwise.
- Pointer dragging of the level-line ends was not exercised; the keyboard path was.

## v2 fixes (after the fresh engineering re-read, `eng.v2.md`)

One commit, the one that adds this section.

| Finding | Fix | Check |
|---|---|---|
| A stored video that never reports ready or failed left both file pickers disabled for good | Waiting for a video's first picture is time-bound (20 seconds for a chosen file, 6 for a stored one); the "still reading stored slots" lock is cleared in a `finally`; the slot says "The stored video could not be opened on this device. Its tracking is kept. Choose the video again to play it." | Headless Chrome with a stored video made never to become ready: pickers disabled at start, enabled after the time limit, the sentence shown, tracking kept, and a newly chosen video then tracks |
| The slot fact "Camera movement during the video, millimeters" carried no scale mark | It reads "…, millimeters, scale not checked" whenever that video's scale is not checked, from the same flag as every other millimeter value | Read from the page with one video loaded |
| Typed tape readings persist with nothing marking them stale | Footnote under the targets table: "After you move something, measure again and type the new reading." Readings still persist | Read from the page |

Re-run with these changes: `node --test artifacts/bike-fit/tests/` (31 tests, 31 pass); at 390 pixels no
sideways scroll, no control under 48 pixels, section order unchanged.
