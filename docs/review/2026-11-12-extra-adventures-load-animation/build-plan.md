# Build plan: extra-adventures content, photos, load animation

Run: 2026-11-12 · asset: `artifacts/extra-adventures/index.html` (https://robbybro.com/artifacts/extra-adventures/) · auto mode, no gate.
No seat constraint files were written for this run; the Lead's brief is the binding constraint.

## Acceptance points

| # | Point | Source |
|---|---|---|
| 1.1 | Woodinville wine country card in `#day-trips`, drive time and official URL verified | Emily |
| 1.2 | One Day Trips card for the Boeing factory tour and The Museum of Flight, a link to each official site, tour status stated as the official site states it, opposite directions noted if the map says so | Emily |
| 1.3 | Seward Park in the parks list | Emily |
| 1.4 | San Juan Island blurb reads exactly "San Juan Island has some heavy hitters." | Emily, amended by Robby mid-build |
| 2.1 | Six photos placed per the table, relative paths, real alt, width/height, lazy, `figure.photo`, plain place-name captions | brief |
| 2.2 | Golden Gardens Park in the parks list, photo beside the list in the `.hikes` layout | brief |
| 2.3 | Other picsum placeholders and the footer line untouched; grid rows not broken at phone and desktop width | brief |
| 3.1 | Scroll-driven header removed (brand height growth, `pin()`, scroll `layout()`, `overflow-anchor`) | brief |
| 3.2 | Resting layout: bikes small top left, title normal size with its end on the right content margin, tilt kept | brief |
| 3.3 | Seven choreography beats in order (marquee, pitch on slope, boiling sun, bikes exit right while sun sets left, zoom out pinned right, bikes re-enter left, wheels spin on scroll only) | Robby |
| 3.4 | Back link is a fixed bottom-left Material-style chip: 32px, 13px label, arrow icon, elevation, hover / focus-visible / pressed, light and dark, safe areas, 44px target, never covers the last line | brief |
| 3.5 | No content jump; scroll / tap / key finishes the intro | brief |
| 3.6 | Reduced motion: no intro, no boil, no wheel spin | brief |
| 3.7 | About 5 to 7 s, one requestAnimationFrame timeline, transforms only, fonts awaited with a timeout | brief |
| 3.8 | Ground computed from measured title geometry; holds at 360, 390, 768, 1440; recomputed on resize | brief |
| 3.9 | No horizontal scroll at any moment; zoomed title clipped by its stage (`overflow: clip`) | brief |
| 3.10 | Sun absent at rest; frames inline SVG from a repo script, hand-drawn look | brief |
| 3.11 | Screenshots at several timeline points, 390x844 and 1440x900, via a harmless `?t=` hook, saved to `shots/` | brief |

## Files

- `artifacts/extra-adventures/index.html` (all three parts)
- `artifacts/extra-adventures/photos/*.jpg` (already present, added to git in Part 2)
- `artifacts/extra-adventures/build_sun.py` (new, Part 3: generates the sun frames between `sun:start` / `sun:end` markers)
- `artifacts/extra-adventures/build_mark.py` only if the wheel contact data needs correcting

## Design decision: overlay, not a height-eased stage

The header keeps its resting height in the layout from the first paint. During the intro the same header box is extended downward with `padding-bottom` and an equal negative `margin-bottom`, so it covers the viewport as a clipped stage while the content under it never moves. A page-colored veil inside it slides up (a transform) during the zoom-out. Layout shift is zero by construction; the alternative (a tall in-flow stage easing its height) moves every line of content once, about four seconds after load.

## Who builds

All three parts by the build engineer directly: Parts 1 and 2 are a few lines each, Part 3 is one tightly coupled script.

## Test

No test suite exists for this static page. The check that fails if the feature breaks is a headless-Chrome probe run against the local server: resting geometry (title end on the right margin, bikes at left, no horizontal overflow) and wheel contact points on the computed ground at frozen timeline points, at four widths.
