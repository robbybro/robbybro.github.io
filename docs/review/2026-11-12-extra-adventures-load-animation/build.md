# Build hand-back: extra-adventures content, photos, load animation

Built 2026-11-12 by the build engineer, alone (no subagents). Not reviewed: a fresh panel does that.

## Commits (`9e102af..5c16558`)

| Commit | What |
|---|---|
| `f8bfa41` | Part 1: Woodinville card, Boeing tour and Museum of Flight card, Seward Park, San Juan blurb |
| `426a674` | Part 2: six photos placed, Golden Gardens Park in the parks list |
| `5c16558` | Part 3: load animation, sun, back chip, `build_sun.py`, `tests/` |

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
