# Extra Adventures: Emily's edits, album photos, load animation

- **Date:** 2026-11-12
- **Page:** https://robbybro.com/artifacts/extra-adventures/
- **Build range:** `9e102af..dd03df3` (reviewed), fix pass `1d78316`, `9014297`, `fb25bfa`
- **Seats:** UX researcher · Eng · CISO, each fresh, on the deployed result. No database change, so no DB admin seat.
- **Build record:** `build.md` and `build-plan.md` beside this file. Four screenshots kept in `shots-kept/`; the full set is local only.

## Result

| Seat | P1 | P2 | P3 |
|---|---|---|---|
| UX researcher | 0 | 6 | 4 |
| Eng | 0 | 3 | 11 |
| CISO | 0 | 0 | 6 |

## Decisions

| Seat | Sev | Finding | Disposition |
|---|---|---|---|
| Eng | P2 | `?t=` freeze hook live in production; an ordinary `t=` parameter could hide the page behind the intro | Fixed `1d78316`: renamed `?intro-t=`, numeric only, capped, loses to a hash and to reduced motion |
| Eng | P2 | No wall-clock cap on the intro on a slow device | Fixed `1d78316`: 9 s cap |
| Eng | P2 | Title clipped when Londrina Solid does not load | Fixed `1d78316`: title shrinks to fit; verified with both font hosts blocked at 390, 768, 1440 |
| UX | P2 | Skip is invisible | Fixed `1d78316`: "Skip intro" button, bottom right, intro only. Added without Robby asking; his to remove |
| UX | P2 | Day Trips lead said "on the way north" | Fixed `1d78316`: "from Seattle" |
| UX | P2 | Boeing card off voice and long | Fixed `1d78316`: cut to the sourced facts, both pills on one row. Still longer than the Woodinville card |
| UX | P2 | Chip boundary weak in dark | Fixed `1d78316`: 1 px ring; label 13.34:1 light, 8.74:1 dark; boundary 3.99:1 light, 5.71:1 dark |
| UX | P2 | Fixed chip sits over content on phones | Open to Robby. The always-visible fixed chip is his spec |
| UX | P2 | Bikes ride open air past the end of the title before exiting | Open to Robby. Exit off the right edge is his spec |
| Eng | P3 | `finish()` order, swallowed first click, chip tab order, wheel-count guard, Granite Mountain file size, stale artifacts index, thin probe coverage of the late beats | Fixed `1d78316`, `9014297` |
| UX | P3 | Title tight to the top edge; uneven Day Trips card rows | Fixed `1d78316` |
| Eng | P3 | Wheel contact modeled on lowest ink, about 2 px off the tire bottoms at desktop zoom | Accepted; visually minor |
| Eng | P3 | No layer promotion; frame rate on a real phone unmeasured | Open: measure on hardware |
| Eng, CISO | P3 | `tests/` and the generator scripts are publicly served | Accepted; nothing private in them |
| CISO | P3 | Screenshot folder is safe to publish but 5 MB of permanent repo weight | Four kept in `shots-kept/`; `shots/` ignored |
| CISO | P3 | Build notes name the auto-push job | Accepted; low sensitivity |
| CISO | P3 | Five placeholder images still load from picsum.photos, which was timing out | Open to Robby; predates this change |
| CISO | P3 | Google Fonts still third party | Accepted; predates this change |
| CISO | P3 | `Claude-Session:` trailer on commits in a public repo (already on 80 commits) | Open to Robby; no history rewrite |

## Dissent and cross-seat notes

- **UX vs Eng, chip hit target.** UX reported the chip target as about 32 px. Eng reported 44 px. Settled against the code and the probe: 44 px (6 px of hit area above and below the 32 px drawing, since `5c16558`). Eng is right.
- **UX, safe-area insets.** UX reported no safe-area handling. Settled against the code: present for the chip and footer since `5c16558`; the fix pass added the right inset for the skip button. Not seen on a notched phone.
- **UX did not view** the 360 px captures or the live 1040 px captures.

## Platforms

| Platform | Status |
|---|---|
| Desktop Chrome | Verified: headless at 1440, live in a real window at about 1040 |
| Android Chrome | Reasoned: same engine at 360 and 390 px; not on hardware |
| iOS Safari | Unverified |
| Desktop Safari | Unverified |
| Desktop Firefox | Unverified |

## Owner overrides

| Date | Seat overridden | Seat's argument | Robby's decision | Outcome |
|---|---|---|---|---|
| 2026-11-13 | UX (skip must be visible), and the Lead's build constraint that scroll, tap or key ends the intro | A guest who came for information waits about 6 s behind a veil with no way out | "I don't think we let them cancel it. Let's have it play through every time they refresh, because it's great and people should see it." | `cac021c`: no cancel path, "Skip intro" removed, scroll locked and content inert until rest, every refresh plays from the top. Kept: reduced motion, hash deep links, the 9 s cap and watchdog |

Also from Robby, 2026-11-13 (not overrides): back chip in the title green and the section chips' typeface (`cac021c`; label 4.88:1 light, 7.42:1 dark; dark hover 1.52:1, copied from the section chips, dark theme is never switched on); five more album photos replace the last placeholders (`84fad67`), so the page no longer calls picsum.photos.

Still open to Robby: the chip over content, the bikes' open-air exit, the session trailer, and whether the page should unlock when the veil lifts instead of when the bikes finish rolling in (taps in that last second are dropped).

## Follow-up range `fb25bfa..2dc018c`

Fresh Eng and UX seats, 2026-11-13, on the no-cancel change, the chip restyle and the five photos. No P1. Fix pass `22381cf`; probe after it 389 passed, 0 failed (plus 8 of 8 reduced motion, 11 of 11 fonts blocked).

| Seat | Sev | Finding | Disposition |
|---|---|---|---|
| Eng | P2 | A throw in `fit()` before `start()` left the page veiled, locked and inert for good (reproduced) | Fixed `22381cf`: try/catch to `finish()`, cap armed before `begin` |
| Eng | P2 | `scrollRestoration = "manual"` never undone; Back after a section chip did not return to the top | Fixed `22381cf` |
| Eng | P2 | Olympic caption 121 px below its photo at 760 to 1000 px | Fixed `22381cf` (photo floated; caption 4 px under its frame) |
| UX | P2 | San Juan Island card had a 170 px hole at desktop | Fixed `22381cf` |
| Eng | P3 | Hash set mid-intro lost; reduced motion toggled mid-intro ignored; square photo 680 px at 759; Orcas file weight | Fixed `22381cf` |
| UX | P3 | Bikes touch "EXTRA" at phone width | Fixed `22381cf` |
| UX | P3 | Olympic caption differs from the card heading | Kept: the caption is Robby's own comment on the photo |
| UX | P3 | Square photo pushes the title down on phones; captions small; title right-aligned | Accepted; right alignment is Robby's spec |
| UX | P3 | Two back links at page end with different wording | Robby 2026-11-13: drop the footer link. Done `060b032` |
| UX | P2 (first round) | Fixed chip sits over content on phones | Robby 2026-11-13: "It's fine if it's over content", provided the end of the page clears it. Done `060b032`: footer padding built from the chip's box; 15.5 to 16.5 px clear at 360, 390, 768, 1440 |
| UX | P3 | Chip drawn 34 px tall | No change: the hit area is 44 px (probe hit test) |
| Eng | P3 | iOS Safari scroll lock unverified; needs a real iPhone | Open: hardware check |
