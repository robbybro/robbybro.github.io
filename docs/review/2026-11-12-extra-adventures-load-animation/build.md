# Build hand-back: extra-adventures content, photos, load animation

Built 2026-11-12 by the build engineer, alone (no subagents). The panel reviewed `dd03df3` and found no P1; its fix pass and then Robby's override follow as later sections. Where sections disagree, the latest one is the current state.

## Commits (`9e102af..9014297`, plus the record commits)

| Commit | What |
|---|---|
| `f8bfa41` | Part 1: Woodinville card, Boeing tour and Museum of Flight card, Seward Park, San Juan blurb |
| `426a674` | Part 2: six photos placed, Golden Gardens Park in the parks list |
| `5c16558` | Part 3: load animation, sun, back chip, `build_sun.py`, `tests/` |
| `1d78316` | Fix pass: Eng items 1 to 9, UX items 11 to 16 |
| `9014297` | Fix pass item 10: `artifacts/index.html` regenerated |
| `cac021c` | Owner override: the intro plays through; back chip restyled |
| `84fad67` | Five more photos replace the last placeholders |
| `2dc018c` | `artifacts/index.html` regenerated |
| `22381cf` | Follow-up review fixes: Eng 1 to 7, UX 8 and 9 |

Live: all three are on https://robbybro.com/artifacts/extra-adventures/ . Parts 1 and 2 were live by 8:02pm; Part 3 was live at 8:04pm on 2026-11-12, about 100 seconds after the commit (the `git-push` job, then GitHub Pages), and the served page is byte-identical to the committed `index.html` (158,372 bytes). `shots/live-*.png` are from the live URL.

## Acceptance points

| # | Point | Result | Evidence |
|---|---|---|---|
| 1.1 | Woodinville card | Met | `shots/content-desktop-daytrips.png`; facts below |
| 1.2 | Boeing tour + Museum of Flight card | Changed | One card, a pill to each official site, tour status as the official tour page states it, "opposite directions" confirmed by coordinates. The brief's "Tukwila" and "at Boeing Field" are not in the copy: the official site gives a Seattle address and the pages fetched never say Boeing Field |
| 1.3 | Seward Park in the parks list | Met | `shots/content-phone-parks.png`; `query=Seward+Park+Seattle` (no place id could be verified) |
| 1.4 | San Juan blurb | Met | Reads exactly "San Juan Island has some heavy hitters." (Robby's mid-build wording) |
| 2.1 | Six photos placed | Met | `shots/content-*.png`; all six `photos/*.jpg` with alt, width, height, `loading="lazy"`, `figure.photo` |
| 2.2 | Golden Gardens Park + photo beside the list | Met | `shots/content-desktop-parks.png`, `shots/content-phone-parks.png` |
| 2.3 | Other placeholders and footer line untouched; rows not broken | Met | Five picsum figures and the footer sentence are byte-identical to before; rows checked at 390 and 1440 |
| 3.1 | Scroll-driven header removed | Met | `pin()`, the scroll `layout()`, brand height growth and `overflow-anchor` are gone from the file |
| 3.2 | Resting layout | Met | Probe: title end on the right content margin and bikes on the left margin at 360, 390, 768, 1440 (within 1px); `shots/*-rest.png` |
| 3.3 | Seven beats | Met | Timeline below; `shots/phone-390x844-t*.png`, `shots/desktop-1440x900-t*.png`; probe rows for level, crossing, slope, centered, sun, landing, roll, scroll |
| 3.4 | Back chip | Met | Probe: 32px tall, 12px from the left and bottom, 44px target, footer text clears it at the page end; light and dark shots. Hover, focus-visible and pressed styles are in the CSS and were not exercised by a pointer |
| 3.5 | No content jump; input finishes it | Met | Probe: the subtitle's position is identical while the animation runs and after it ends; key, tap and scroll each clear it at once |
| 3.6 | Reduced motion | Met | Probe pass with Chrome forced to reduced motion: no animation classes, sun hidden, wheels do not turn on scroll |
| 3.7 | 5 to 7 s, one timeline, transforms only, fonts awaited | Met | Probe: ends by itself in 5.9 to 6.1 s (six runs); `fonts.load` + `fonts.ready` with a 1.5 s timeout and a re-measure if the font lands later |
| 3.8 | Ground from measured geometry, four widths, resize | Met | Probe: rear and front wheel within 0.05px of the letter tops at 360, 390, 768, 1440 (level and slope at all four, the crossing at 1440); ad hoc runs at 320x568, 844x390, 1024x600, 2560x1300 within 1.5px. Re-measured on resize while it runs; rest is CSS only |
| 3.9 | No horizontal scroll; stage clips | Met | Probe: `scrollWidth - clientWidth` is 0 at every held moment and at rest, four widths |
| 3.10 | Sun absent at rest, inline frames from a script | Met | `build_sun.py`, four frames; probe: sun `display: none` at rest |
| 3.11 | Screenshots saved | Met | 38 files in `shots/`: 34 from the local server, 4 from the live URL |

## Animation timeline

| Phase | Start s | End s | What moves |
|---|---|---|---|
| Title slides left | 0 | 3.2 | Title at the zoomed size slides left at constant speed until 2.75, then coasts to a stop with its end on the right content margin. Bikes centered and still until 2.75, on the letter tops, pitch from the ground under the rear and front wheels (0 over "Extra", 2.5 degrees over "Adventures", blended across the wheelbase), wheels turning at ground speed. Sun drifts left to right, frames cycling at 7 per second |
| Bikes ride off, sun sets | 2.75 | 3.95 | As the title slows the bikes keep their ground speed, so they move right, up the slope and off the right edge. Sun moves down and off the left |
| Zoom out | 4.0 | 4.95 | Title scales back to 1 about its right bottom corner and rises into the header; the veil slides up off the page |
| Bikes roll in | 4.95 | 5.9 | Bikes at resting size roll in from the left to their resting spot, wheels turning |
| Rest | 5.9 | | Every inline transform and both state classes removed; only the wheels follow the scroll |

## Facts added to the page (all fetched 2026-11-12)

| Fact on the page | Source |
|---|---|
| Woodinville: more than 130 wineries, four districts | https://woodinvillewinecountry.com/ ("Woodinville's 130+ wineries are arrayed across four winemaking districts") |
| Woodinville: about a 30-minute drive from downtown Seattle | https://woodinvillewinecountry.com/why-woodinville/ ("Woodinville is just 30 minutes from downtown Seattle"); cross-check: OSRM driving route from Westlake Park, 29.1 minutes, 19.7 miles, no traffic |
| Boeing Future of Flight is in Mukilteo | https://www.boeingfutureofflight.com/ (8415 Paine Field Blvd, Mukilteo, WA 98275) |
| About 25 miles north of downtown Seattle | https://www.boeingfutureofflight.com/faq ("located 25-miles north of downtown Seattle"). The home page heading says "30 mi N of Seattle"; the page uses the FAQ's downtown figure |
| The Boeing Everett Factory Tour runs; 80 minutes, guided, views production from the factory balcony; 4 feet minimum height; no phones or cameras | https://www.boeingfutureofflight.com/tour ("This 80-minute guided experience", "front-row look at current airplane production from the factory balcony", "Must be at least 4 feet (48 in/122 cm) tall", electronics, cameras and phones not allowed). No suspension notice on the page; tickets on sale ($42 to $46 per the FAQ) |
| The Museum of Flight is south of downtown on East Marginal Way | https://www.museumofflight.org/visit/parking-and-directions (9404 East Marginal Way S., Seattle, WA 98108); south by coordinates: OpenStreetMap Nominatim puts the museum at latitude 47.518, Westlake Park at 47.611, Boeing Future of Flight at 47.918 |
| Seward Park, Golden Gardens Park (names only) | https://www.seattle.gov/parks/allparks/seward-park , https://www.seattle.gov/parks/allparks/golden-gardens-park |

Page text was read through WebFetch, which returns a model's reading of the page, so the quotes are as it returned them.

Looked up and not shipped: Wikipedia gives San Juan Island 55.053 square miles and 8,632 people (2020), Orcas Island 57.3 square miles, and says "Orcas Island is slightly larger, and less populous, than neighboring San Juan Island" (https://en.wikipedia.org/wiki/San_Juan_Island , https://en.wikipedia.org/wiki/Orcas_Island ; a secondary source, area figures uncited there). By that reading the old "less populated" was wrong and "smaller" right.

"Less popular": the phrase is not on the page. The San Juan Island blurb was treated as Emily's target, and Robby then set the wording.

## Tests

`python3 artifacts/extra-adventures/tests/run.py` (headless Chrome, real time, under a minute): **154 passed, 0 failed**, then under forced reduced motion **6 passed, 0 failed**. Four consecutive runs gave the same counts, the last on the committed code.

The probe caught one real bug before commit: the first animation frame's timestamp can be earlier than the `performance.now()` read just before it, which made the clock negative, threw in the sun-frame lookup, and silently skipped the animation on about 1 load in 5. Fixed (the first frame only sets the reference); the error path itself behaved as designed and took the veil down.

## Verified, reasoned, unverified

| Platform | Status | Basis |
|---|---|---|
| Desktop Chrome | Verified | Chrome 157 headless: screenshots at held moments and the real-time probe, 1440x900 |
| Android Chrome | Reasoned | Same engine, verified at 360 and 390 px width in desktop Chrome; not on hardware; tap tested as a synthetic `pointerdown` |
| iOS Safari | Unverified | Reasoned only: `overflow: clip` (16+, `hidden` fallback), `100lvh` (15.4+, `100vh` fallback), `env()` insets, canvas text metrics, 2D transforms without layer promotion so the zoomed text is painted as vectors |
| Desktop Safari | Unverified | Same reasoning; Safari is installed but its automation is off |
| Desktop Firefox | Unverified | Not installed here; reasoned from the same feature list |

Not verified anywhere: frame rate on real hardware (headless Chrome here paces about 20 frames per second even on a resting page, so it says nothing); the chip's hover, focus-visible and pressed looks; safe-area insets on a notched phone; the fallback-font path when Londrina Solid fails to load.

## Did not do, or changed

| Item | Why |
|---|---|
| "Tukwila" and "at Boeing Field" left out of the copy | Not confirmed by the official pages fetched |
| Overlay instead of a height-eased stage | Zero layout shift; reasoning in `build-plan.md` |
| On wide screens the bikes ride past the end of the title on the same slope (208px of air at 1440) | The title ends at the content margin, the screen edge is further right |
| Chip label is the old link's words, lowercase, "back to the wedding site" | No content constraint; kept the page's string |
| No smaller or webp photo variants | Optional in the brief. `granite-mountain.jpg` is 2048 px and 484 KB for a frame at most 500 px wide |
| `artifacts/index.html` not regenerated | Outside the request. `artifacts/build.py` derives each card's "updated" date from git, so the Extra Adventures card is stale until `python3 artifacts/build.py` is run and committed |
| `docs/review/README.md` line and `review.md` | The Lead's |
| `shots/` left untracked | 5.1 MB of PNG in a public Pages repo; the earlier run in this repo committed only its `review.md`. The Lead's call |
| Sandbox | Headless Chrome cannot start inside the Bash sandbox (Mach port and socket directory denied), so captures and the probe ran with it off |

## Notes for the seats

- **Capture flake:** in 8 of about 90 screenshots taken through my iframe harness the chip was not painted (1 of about 50 after `--run-all-compositor-stages-before-draw` was added); 0 of 16 direct-window screenshots; the probe finds it at the bottom left and hit-testable every time. All 38 saved shots show it. Cause unknown.
- **Placeholders:** picsum.photos timed out (20 s) on 2026-11-12 at about 7:45pm, so the five remaining placeholder frames show a broken-image icon on honey. Unchanged by this build.
- **Day Trips lead** still says "on the way north"; Woodinville and The Museum of Flight are not north of Seattle. Content seat's call.
- **Dark theme** was checked by setting `data-theme="dark"` in the harness; nothing in the page turns it on.
- **Title size step:** stacked below 760 px (title fills the width, up to 95 px), one row from 760 px (78 px rising to 96 px).
- **Classic scrollbars below 760 px:** the title size comes from `100vw`, which includes the scrollbar, so on a narrow desktop window the title overhangs its left margin by the scrollbar width. Phones are unaffected.
- **Page weight:** `index.html` went from 120 KB to 158 KB (24 KB of that is the four sun frames).

## Fix pass (2026-11-12, after the panel's review of `dd03df3`)

Live: `1d78316` and `9014297` were on https://robbybro.com/artifacts/extra-adventures/ at 8:35pm on 2026-11-12, about 160 seconds after the second commit; the served page is byte-identical to the committed `index.html` (161,129 bytes), the resized photo is served (102,426 bytes), and the artifacts index card reads "updated Nov 12, 2026".

| # | Seat | Item | Result | What was done, and the evidence |
|---|---|---|---|---|
| 1 | Eng | Hook renamed, clamped, ignored under reduced motion or a hash, never an invisible overlay, NaN on purpose | Done | The parameter is `?intro-t=`. Only a plain number matches (`/[?&]intro-t=(\d+(?:\.\d+)?)(?:&|$)/`), anything else is `null` by an explicit `isFinite` test and the animation plays normally; values are capped just below the end of the timeline. The head script no longer reads it, so a hash or reduced motion always wins. Probe: `?t=1.5`, `?utm_source=x&t=2`, `?intro-t=abc`, `?intro-t=`, `?intro-t=1.2.3`, `?intro-t=-3`, `?intro-t=NaN` all play normally; `?intro-t=99` holds the last moment with nothing over the page; `?intro-t=1.5#rest` and reduced motion are at rest |
| 2 | Eng | Wall-clock cap | Done | `wallStart` set in `start()`; a tick more than 9 s later calls `finish()`. Probe: with frame timestamps that advance half a millisecond per frame the animation ends at 8.98 to 9.04 s |
| 3 | Eng | Title without Londrina Solid | Done | `fit()` runs once the fonts settle or time out, on resize, and again if the font lands late: if the title is wider than its row it sets `--fs` to fit. The bikes got `flex: none` (they were being squeezed to 31px instead). Probe pass with both Google Fonts hosts dead: the fallback is 10.39em wide against 7.57em, and the title sits inside both margins at 390, 768 and 1440. `shots/fonts-blocked-phone-390x844-rest.png`, `shots/fonts-blocked-phone-390x844-t2.2.png`. The wheel offsets at rest are tuned to Londrina Solid, so with the fallback the resting bikes overlap the first letters by a few pixels |
| 4 | Eng | `finish()` order | Done | Classes off and transforms cleared first, wheels last. Probe: with a wheel that throws when turned, the page is back at rest (it fails on the old order) |
| 5 | Eng | First click swallowed late in the intro | Changed | No script state: the stretched `.brand` is `pointer-events: none` for the whole animation and only the veil takes clicks, so the page becomes clickable exactly as the veil slides off it, not only once it has fully lifted. Probe: the veil blocks the page at 0.3 s, the page under the veil's edge takes clicks at 4.4 s, the whole page does at 5.4 s |
| 6 | Eng | Chip out of the first tab stop; scroll padding | Done | The chip is the last element before the script at the end of the body; `scroll-padding-bottom: calc(56px + env(safe-area-inset-bottom))` on `html`. Probe: first tab stop is a page link, last is the chip |
| 7 | Eng | Four-wheel guard and the contract | Done | `start()` returns to rest unless there are four wheels; the order contract is a comment above `WHEELS` in `build_mark.py` (the mark block is byte-identical after re-running it). Probe: a page with the fourth wheel removed gets no animation and no error |
| 8 | Eng | `granite-mountain.jpg` | Done | 1024x768, 102 KB (was 2048x1536, 484 KB), `width` and `height` updated. Made with `djpeg -scale 1/2`, `cjpeg -quality 86`, then `jpegtran -copy none` (sips was not needed); its only non-image segment is the JFIF header. The original is in git at `426a674` |
| 9 | Eng | Probe additions | Done | Held moments at 3.5, 3.9, 4.4 and 5.4 s at all four widths (no sideways overflow, title's end pinned, bikes, sun and veil where each phase puts them). Deterministic regression for the early frame timestamp: every timestamp shifted a second back; it fails on a copy with the original bug put back and passes now. A 700 px frame that keeps its 15px scrollbar: the title sits inside both margins (19.6 to 669.0 in 16.0 to 669.0), fixed by `fit()` measuring the content box. Without script the old overhang remains |
| 10 | Eng | Regenerate the artifacts index | Done | `9014297`; the card reads "updated Nov 12, 2026" |
| 11 | UX | Skip intro control | Done | `<button class="chip skip" id="skip" type="button">Skip intro</button>`, first in the body, bottom right, shown only while the animation classes are on (so never under reduced motion or on a hash link), same finish path. Any key already ends the animation, so for a keyboard the first Tab does it; the click handler is for a screen reader's activate |
| 12 | UX | Day Trips lead | Done | "A few options that can be part of a day trip (or overnight) from Seattle." |
| 13 | UX | Boeing and Museum of Flight card | Changed | Now: "These are in opposite directions from downtown Seattle. The factory tour is at Boeing Future of Flight in Mukilteo, about 25 miles north: 80 minutes, 4-foot minimum height, no phones or cameras. The Museum of Flight is south of downtown." That is 237 characters against Woodinville's 96; the facts the brief said to keep do not fit in less. Pills are "Boeing tour" and "Museum of Flight" and share a line at 360, 390, 768 and 1440 (probe) |
| 14 | UX | Chip boundary and contrast | Done | A solid 1px ring in both themes. Measured by the probe from computed colors. Light: label 13.34:1; boundary 3.99:1 on the page, 4.88:1 on a card. Dark: label 8.74:1; boundary 5.71:1 on the page, 4.88:1 on a card, 3.91:1 against the chip's own fill. Skip intro measures the same |
| 15 | UX | Header top padding | Done | 16px above the highest ink at all four widths (probe: bikes top 16.0 stacked; last letter top 16.1 at 768 and 16.3 at 1440) |
| 16 | UX | Day Trips pills at the card bottom | Done | Day Trips cards are flex columns with the pill row on `margin-top: auto` (probe: pill bottoms within 1px across each row of cards, four widths). The Quick Outings cards were not asked for and are unchanged |

Not changed, by instruction: the chip stays visible over content, the bikes ride past the end of the title, the animation's length and that it plays on every load.

### The UX seat's two claims, checked against the code

| Claim | True? | Basis |
|---|---|---|
| The chip's hit target is under 44px | No | `.chip::before { content: ""; position: absolute; inset: -6px 0; }` adds 6px above and below the 32px drawing, and has since `5c16558`. The probe hit-tests it: the point 5px above and the point 5px below the drawing both resolve to the chip, the point 8px above does not. Width is the chip's own, about 203px |
| There is no safe-area-inset handling | No | Since `5c16558` the chip is placed with `env(safe-area-inset-left)` and `env(safe-area-inset-bottom)`, the footer's bottom padding adds `env(safe-area-inset-bottom)`, and the viewport meta has `viewport-fit=cover`. The fix pass adds `env(safe-area-inset-right)` for Skip intro and the bottom inset in the scroll padding. None of it has been seen on a notched phone |

### Tests after the fix pass

`python3 artifacts/extra-adventures/tests/run.py`, about 80 s: **286 passed, 0 failed**; under forced reduced motion **8 passed, 0 failed**; with Google Fonts unreachable **11 passed, 0 failed**. Two consecutive runs on the final code, the second after the commit.

### Screenshots

`shots-kept/` (tracked): `phone-390x844-marquee.png`, `phone-390x844-rest.png`, `desktop-1440x900-marquee.png`, `desktop-1440x900-rest.png`, captured after the fixes. `shots/` is local only (in `.gitignore`): 40 files, all re-captured after the fixes, the four `live-*` ones from the live URL after it deployed.

### Earlier lines this pass makes out of date

- The hook is `?intro-t=`, not `?t=`.
- The Day Trips lead, the classic-scrollbar overhang (with script), the 2048 px Granite Mountain file, the stale index card and the untracked `shots/` are all dealt with above.
- The probe counts are 286, 8 and 11, not 154 and 6.
- `index.html` is 161 KB.

## Owner override: no cancel (2026-11-13)

Robby: "if a user scrolls down, it cancels the animation. I don't think we let them cancel it. Let's have it play through every time they refresh." This reverses the brief's "scroll, tap or key finishes it" (acceptance point 3.5) and the UX seat's Skip intro control (fix pass item 11). Commit `cac021c`.

Live: `cac021c` was on https://robbybro.com/artifacts/extra-adventures/ at 10:45am on 2026-11-13, about four and a half minutes after the commit; the served page is byte-identical to the committed `index.html` (162,546 bytes).

| # | Item | Result | What was done, and the evidence |
|---|---|---|---|
| 1 | Remove every user-input cancel path and the Skip intro button | Done | The `wheel`, `touchstart`, `pointerdown` and `keydown` listeners, the scroll-ends-it branch, the button, its styles and its right safe-area inset are gone. Probe: four keys, pointer, mouse, touch, wheel and click events and a scripted scroll leave it running |
| 2 | No scrolling under the veil; no shift when the scrollbar returns; wheel spin only afterwards | Done | `html.opening { overflow: hidden; overscroll-behavior: none; scroll-behavior: auto }`, `touch-action: none` on the veil, and the scroll handler puts anything that gets past them back at 0. `scrollbar-gutter: stable` on `html`. Probe at 700 px with a real 15px scrollbar: the page is 685px wide locked and at rest and the subtitle does not move. Probe: the page is at scroll 0 at every held moment; afterwards it scrolls and the wheels turn |
| 3 | Every refresh plays it in full from the top; bfcache | Done | The head script sets `history.scrollRestoration = "manual"` whenever the animation will play, and `start()` scrolls to 0. Probe: scrolled to 1500, reloaded, back at 0 with the animation playing, 5.95 s to rest. A bfcache restore (Back from another page) is left showing the page as it was, at its old scroll position, with no replay: replaying would throw someone who came Back to mid-page up to the top and hold them there |
| 4 | Keep the non-user endings | Done | Reduced motion and a #hash link still skip it; the head watchdog and the error path are unchanged. The 9 s cap changed form: see item 5 |
| 5 | Hidden tab pauses; cap counts visible time; background tab plays from 0 | Done | `tick()` holds the clock while `document.hidden`. The cap is now a timer armed only while the tab is visible, with the visible time carried across pauses, so it no longer needs frames to arrive. Probe: hidden for 4 s mid-run, the title does not move, it carries on when shown and finishes by itself at 10.07 s on the wall. A tab loaded hidden sits on the first frame and plays in full (5.96 s) from the moment it is shown |
| 6 | Accessibility while locked | Done | The content (`.wrap`) is `inert` from the moment the script takes over until `finish()`. The back chip is outside it and stays focusable and clickable on purpose: it is visible the whole time, and it is the one way to leave. So during the animation Tab reaches the chip and nothing else. Probe: content inert and chip live at every held moment, content live at rest |
| 7 | Probe | Done | "Ends it" checks replaced by "does not end it, page stays at 0, scrolls afterwards"; added the hidden-tab and background-tab cases and refresh from mid-page; the cap, reduced-motion and font-less cases kept |
| 8 | build.md | Done | This section |
| 9 | Back chip dressed like the section chips | Done | Label and arrow in `var(--olive)`, Londrina Solid, uppercase, `.05em` letter-spacing, 15px, on `var(--paper)`, honey with ink text on hover and press: the same six computed values as `nav.jump a` (probe compares them). Kept: fixed bottom left, 32px, 44px target, safe-area insets, focus ring, 1px boundary |

Chip contrast, measured by the probe from computed colors:

| Theme | Label | Boundary on the page | Boundary on a card and against its own fill | Label on hover (ink on honey) |
|---|---|---|---|---|
| Light | 4.88:1 | 3.99:1 | 4.88:1 | 7.20:1 |
| Dark | 7.42:1 | 5.71:1 | 4.88:1 | 1.52:1 |

The dark hover figure fails 4.5:1. It is the section chips' own hover (`nav.jump a:hover`), copied as asked; the color was not changed. Nothing in the page turns the dark theme on.

### Also changed in this pass

- **A held `?intro-t=` frame is released after 9 s.** With no way to dismiss it, a held frame would otherwise hide the page for good. Probe: released at 9.05 s.
- **The classic-scrollbar overhang is now fixed in CSS in Chrome.** With `scrollbar-gutter: stable` Chrome's `100vw` no longer includes the gutter, so the title fits at 700 px without `fit()` stepping in.

### What a guest gets

| Guest | What happens |
|---|---|
| Opens or refreshes the page | About 6 s of animation over a page-colored veil. Scrolling, tapping and keys do nothing; only the back chip works. Then the page |
| Arrives on a link to a section (`#day-trips`) | No animation; the page opens at that section |
| Has reduced motion turned on | No animation, ever; the resting header |
| Comes Back to the page from another site | Usually the page exactly as they left it, no animation (the browser's back cache). If the browser reloads it instead, the animation plays from the top |
| Switches tabs during it | It waits and carries on when they return |
| Clicks a link in the last second, while the bikes roll in | Nothing: the page is visible by then but stays locked and inert until the bikes stop |
| On a connection so slow that the page's own HTML takes more than 4 s | The head watchdog lifts the veil and the animation does not play on that load |

### Tests

`python3 artifacts/extra-adventures/tests/run.py`, about 105 s: **320 passed, 0 failed**; under forced reduced motion **8 passed, 0 failed**; with Google Fonts unreachable **11 passed, 0 failed**. Two consecutive runs on the final code, the second after the commit.

### Not verified

The scroll lock on a real iPhone or Android phone (reasoned from `overflow: hidden` on the root plus `touch-action: none` on the veil; the scroll handler is the backstop). A real user wheel or touch scroll cannot be synthesized in the probe; it asserts the lock's computed style and that a scripted scroll is put back. `inert` needs Safari 15.5, Chrome 102 or Firefox 112; on older browsers focus can go behind the veil.

`shots-kept/` was re-captured after this pass.

## Five more photos: the last placeholders (2026-11-13)

Five album photos, already downscaled and stripped by the Lead, replace the five picsum placeholders one for one. Commit: see the commit that adds this section.

| File | Pixels | Where | Result | Frame and `object-position` |
|---|---|---|---|---|
| `orcas-island.jpg` | 1500x1130 | `#orcas` banner | Done | 16:7 banner, `50% 25%`: the ferry's lower decks along the top, both bikes below; the front bike's tire is trimmed at the bottom edge |
| `san-juan-island.jpg` | 1130x1500 | `#san-juan` | Changed | Not a banner: a square frame, anchored bottom left and enlarged 1.6 times (`object-position: 0% 100%; transform: scale(1.6)` from the same corner), so the frame holds Emily & Robby and both bikes and leaves out the sky and the utility pole |
| `olympic-national-park.jpg` | 1125x1500 | `#olympic` | Changed | Not a banner: a square frame, `50% 72%`: both faces, the canopy edge, the table and the bowl |
| `victoria.jpg` | 1500x844 | `#victoria` banner | Done | 16:7 banner, `50% 100%`: the harbor lights and the docked ferry, the black sky cut |
| `tofino.jpg` | 1500x844 | `#tofino` banner | Done | 16:7 banner, `50% 65%`: headland, surf and the surfer |

**Frame choice for the two portraits.** One rule for both (`figure.photo.tall`, article class `side`): a square frame. Below 760 px it sits across the top of the card like the banners (326x326 at 390). From 760 px it sits at the right of the card, 320x320, beside a `.head` block holding the title, the chips, the blurb and "How to get there"; "What to do" runs full width underneath. Looked at, at 390 and 1440: both faces, the bikes and the table are in frame in all four.

Also in this commit:

- Captions are the plain place names; no "(photo coming)" is left.
- The footer reads "Questions? Just ask us." The sentence about photos being on the way is gone.
- `tests/run.py` no longer points picsum.photos at a dead port; its docstring says the page's only third party is Google Fonts.
- Probe additions: 11 images, all `photos/*.jpg`, with alt text, `loading="lazy"`, and `width`/`height` equal to the file's own size (this also re-checks the resized Granite Mountain); no "picsum", "photo coming" or "on the way" anywhere in the page; the two portrait frames square and placed as above at 390 and 1440; the four banners 16:7.

**Third parties.** The page source references two outside hosts, `fonts.googleapis.com` (the stylesheet) and `fonts.gstatic.com` (the font files it names). The probe reads the browser's own resource list after load at 390 and 1440 and finds those two and the page's own host, nothing else. Links a guest clicks are not requests the page makes.

Not done: no smaller variants. `orcas-island.jpg` is 481 KB and `olympic-national-park.jpg` 402 KB; both are lazy-loaded and far down the page.

This makes the earlier lines about the picsum placeholders (the "Placeholders" note and acceptance point 2.3's "five picsum figures") history.

### Tests

`python3 artifacts/extra-adventures/tests/run.py`: **338 passed, 0 failed**; under forced reduced motion **8 passed, 0 failed**; with Google Fonts unreachable **11 passed, 0 failed**.

Screenshots (local, `shots/`): `photo-phone-390-<name>.png` and `photo-desktop-1440-<name>.png` for each of the five.

## Follow-up review fixes (2026-11-13, fresh Eng and UX seats on `fb25bfa..2dc018c`)

No P1, four P2. Commit `22381cf`.

Live: `22381cf` was on https://robbybro.com/artifacts/extra-adventures/ at 11:21am on 2026-11-13, about five minutes after the commit; the served page is byte-identical to the committed `index.html` (165,562 bytes) and the re-encoded photo is served (250,624 bytes).

| # | Seat | Sev | Item | Result | What was done, and the evidence |
|---|---|---|---|---|---|
| 1 | Eng | P2 | `begin()` could strand the page veiled, locked and inert | Done | `fit(); start();` run inside a try whose catch is `finish()`; the late-font `fit()` and the resize `fit()` are caught the same way. The visible-time cap is armed in the script body, in the same statement that makes the content inert, not in `start()`, so the page is back within 9 s of the script taking over whatever happens before the animation starts (it was up to about 10.5 s with the font wait, and unbounded on a throw). Probe: with `fit()` made to throw, the page is at rest at hand-over; with the start made never to come (font promise hangs, fallback timer lost), the cap lifts the veil at 9.00 s. Both rows, and the reduced-motion row in item 5, fail on the page as it was at `84fad67` and pass now |
| 2 | Eng | P2 | `scrollRestoration = "manual"` never undone | Done | `finish()` sets it back to `"auto"`. Probe: after the animation, the Day Trips chip scrolls to 4913, Back returns to 0 with the hash gone. Refresh from mid-page still starts at the top with the animation playing (the head script sets `"manual"` again on each load that will play) |
| 3 | Eng | P2 | Olympic caption about 121 px below its photo between 760 and 1000 px | Changed | Not `align-self: start`: from 760 px the figure is now a float (item 8), so it is no longer a grid item and cannot be stretched. Probe: caption 4.0 px under its frame for both portraits at 390, 700, 760, 1024 and 1440 |
| 4 | Eng | P3 | A hash set during the intro ended at the top | Done | `finish()`: if the veil was up and `location.hash` names an element, `scrollIntoView()`. Probe: `#hikes` added mid-run, the run ends by itself, the page then sits with `#hikes` at the top |
| 5 | Eng | P3 | Reduced motion turned on mid-intro | Done | A `change` listener on the media query (with the `addListener` fallback) updates `reduce` and calls `finish()` if the veil is up. Probe, with a stand-in media query in a doctored copy: ends at once, and the wheels then stay still on scroll |
| 6 | Eng | P3 | Square portrait frame 680 px at 759 | Done | `.photo.tall { width: 100%; max-width: 22rem; justify-self: center }`. 326 px at 390 as before, 352 px centered at 700; from 760 px it is the float, 272 px at 760 and 320 px from about 830 |
| 7 | Eng | P3 | `orcas-island.jpg` 481 KB | Changed | 1125x848, not 1200: `djpeg -scale 6/8` (a libjpeg scale, no resampling tool needed) then `cjpeg -quality 82` and `jpegtran -copy none`. 251 KB, JFIF header only, `width`/`height` updated. It is a second-generation encode of the Lead's 1500 px file |
| 8 | UX | P2 | San Juan Island card: about 170 px of empty card at 1440 | Done | From 760 px the two portrait cards are `display: flow-root` with the figure floated right (`clamp(15rem, 40%, 20rem)` wide). What follows the heading block starts beside the photo while there is photo left and below it when there is not. Looked at, at 760, 1024 and 1440: San Juan Island has "What to do" beside the photo and the card ends with its text; Olympic has the heading block beside the photo and "What to do" full width under it, as before. Probe at those widths: "What to do" starts 12 px under the heading block, 0 px spare at the end of the card. `shots/portrait-<width>-san-juan.png`, `shots/portrait-<width>-olympic.png` |
| 9 | UX | P3 | Resting bikes touch the top of "EXTRA" at 390 | Done | 6 px added to the stacked layout's bike margin; the title moves down 6 px, its right edge does not move. Probe: wheels 5.3 to 5.6 px above the letter tops at 360 and 390; title end still on the right content margin |

Not changed, by instruction: no cancel, every-refresh play, release at rest, chip always visible, title right-aligned, captions, footer link.

### Tests

`python3 artifacts/extra-adventures/tests/run.py`, about two minutes: **389 passed, 0 failed**; under forced reduced motion **8 passed, 0 failed**; with Google Fonts unreachable **11 passed, 0 failed**. Two consecutive runs on the final code, the second after the commit.

`shots-kept/phone-390x844-rest.png` was re-captured (the header is 6 px taller); the other three kept files came out byte-identical.

## Footer link removed; the page ends clear of the chip (2026-11-13)

From Robby. One commit (the one that adds this section).

| # | Item | Result | What was done, and the evidence |
|---|---|---|---|
| 1 | Remove the footer back link | Done | The `<a class="back">` and both `footer .back` rules are gone; the footer is "Questions? Just ask us." The chip is the page's only link to emilyandrobby.wedding (probe counts one) |
| 2 | At the end of the page the chip overlaps nothing | Done | The chip's box is now four named lengths on `:root` (`--chip-h` 32px, `--chip-reach` 6px, `--chip-gap` 12px, `--inset-bottom` = `env(safe-area-inset-bottom)`), and the chip, its tap target, the scroll padding and the footer all use them. The footer's bottom padding is `gap + inset + height + reach + 16px`, so with the page scrolled to its end the last line is 16px above the top of the 44px tap target by construction, whatever the inset. Probe, scrolled to the end: 16.5px at 360, 15.5px at 390, 16.2px at 768, 15.8px at 1440 (the fractions are the scroll position rounding), and the whole target is inside the viewport. With `--inset-bottom` forced to 34px at 390 the chip sits 46px from the bottom edge and the clearance is still 15.5px. That forces the inset through the same custom property the real `env()` value feeds; a real device inset was not available |

Looked at: `shots/phone-390x844-page-end.png`, `shots/desktop-1440x900-page-end.png` (local).

`python3 artifacts/extra-adventures/tests/run.py`: **390 passed, 0 failed**; under forced reduced motion **8 passed, 0 failed**; with Google Fonts unreachable **11 passed, 0 failed**.
