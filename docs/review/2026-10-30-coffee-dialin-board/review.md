# Review — Coffee Dial-In board rebuild (2026-10-30)

**Scope.** robbybro `8f20078` (page rebuild) and its fix commit (this one); mac-dotfiles `65bef64`
(`db.py coffee amend`, shared-producers LIMIT dropped) and `ad4ec20` (export hygiene).
**Trigger.** Robby's feedback on the live board: glossary repeated on every card, unexplained
chip colours, a sparkline tooltip that was "pretty hard to get to show up", the unlogged-shots tile
reading as an alarm, and uncapped lists. Auto-mode build → deployed → retroactive asset review.
**Assets reviewed.** Headless-Chrome captures at 1280 px and 390 px (dark), both pages, before and
after the fixes. Platforms: desktop Chrome **verified** on captures; Android Chrome and iOS Safari
**reasoned** (no hardware). The pointer-specific caption ("Tap a dot…" vs "Hover a dot…") switches on
`matchMedia('(hover: none)')` and is **unverified on hardware**.

## Seats

| Seat | Verdict | P1 | P2 | P3 |
|---|---|---|---|---|
| UX researcher | fixes land, three to tighten | 1 | 5 | 5 |
| Staff engineer | "do not call this done" until the readout bug is fixed | 1 | 2 | 12 |
| CISO | safe to leave deployed, no P1 | 0 | 2 | 5 |
| Database administrator | not seated — no schema, index or write-path change beyond a words-only UPDATE the engineer and CISO both verified parameterised | — | — | — |

## Decisions (seat-tagged)

### Fixed before "done"

| # | Seat | Finding | Fix |
|---|---|---|---|
| 1 | Eng P1 | Sparkline readout sliced `txt.slice(head.length)` after a joined string that had `· rpm` in the middle → "29.4 spm → 29.4 s" on 43 of 46 shots | `parts(p)` returns `{head, tail}`; rendered as `<b>head</b>` + text node, never sliced |
| 2 | Eng P2 | `idxAt` mapped box width to the 240-unit viewBox, ignoring letterboxing → wrong dot at any width ≠ 240 px | pointer → viewBox through `getScreenCTM().inverse()`, bounding-rect fallback |
| 3 | UX P1 | Idle readout said "hover, tap or arrow", words that do not exist on a phone; nothing on screen said what to tap | Idle readout = the **newest shot's numbers** ("Newest: 133 µm · 1000 rpm → 29.4 s …"); the instruction moved to the caption and is pointer-specific |
| 4 | UX P2 | Chip legend swatches were styled as chips (looked tappable; meaning carried by colour alone) | Plain text line: "Chip border: green = recipe settled · amber = still dialing in · ★ = house bean" |
| 5 | UX P2 | "Unlogged shots 7" was the loudest number in the row and the footnote attributed them to Emily, which the data cannot show | Tile is "Shots pulled, 7 days · 12 on the machine · 5 logged · 7 unlogged · tracked, never a fault" |
| 6 | UX P2 | "Bags logged 11 + 2 blends" vs subline summing to 13; "newest 10" claim on a tile instead of by the cards; "Newest" wrong because house beans lead | Headline 13 bags; cap sentence moved into the recipes section head ("10 of 13 bags here, house beans first then newest…"); labels say "house beans first then newest" |
| 7 | Eng P2 | A failed `data/log.js` rendered a healthy-looking empty board; one throw blanked every later section | Visible red banner when the data is missing; each section rendered through `safe()` which writes the error in place |
| 8 | CISO P2 | Scraped storefront URLs assigned to `href` with no scheme check (0 bad today, but third-party content) | `safeLink()` guard in app.js on all 6 link sites; export nulls non-http(s) `website`/`url` |
| 9 | CISO P3 | Private Sheet id (`retired_sheet`) and `~/git/…` path (`water.source`) in the public export | Dropped from the exported rules blob |
| 10 | CISO P2 (partial) | No allowlist on the export; `photo` strip was the only wall | Publish guard in `refresh.py`: refuses to commit if the export matches `/Users/`, `/Volumes/`, an email, or an image file name. Full allowlist **deferred** (below) |
| 11 | CISO P3 | No Content-Security-Policy | `<meta http-equiv>` CSP on both pages (`style-src 'unsafe-inline'` needed for inline `style=` attributes) |
| 12 | Eng P3 | Pin was dead for a mouse (`pointermove` un-pinned); per-chart `document` listener leak; `role=img` with keyboard handling; `:focus` ring on click; expander lost focus; `cadence_days`/`last_release` null → NaN / false-good | pinned charts ignore `pointermove`; one module-level `PINNED` + one document listener; `role=group` + `aria-live=polite` readout; `:focus-visible`; expander re-focuses its button; null guards |
| 13 | Eng P3 | Touch: a scroll starting on a chart pinned it before `pointercancel` | touch pins on `pointerup` only when no `pointercancel` intervened |
| 14 | Eng P3 | Shot-log count "52 of 52 rows" while health says 46 shots (6 rows are queued plans) | Count reads "46 shots + 6 queued plans match, of 52 rows"; expander noun says so |
| 15 | UX P3 | Glossary summary ~105 chars (3 lines on a phone); chips 28 px tall; 10 px end labels | Summary shortened; chips 6 px × 12 px padding; end labels 11 px |

### Dispositioned, not fixed

| # | Seat | Finding | Disposition |
|---|---|---|---|
| D1 | CISO P2 | Export should be an allowlist of the keys the page reads, not a denylist | Deferred: the `refresh.py` guard covers the leak classes named; an allowlist needs the key inventory from `app.js` kept in sync with db.py — a maintenance cost not yet earned. Revisit if a second leak class appears. |
| D2 | CISO P3 | Amended free text (taste/verdict) and `by_whom: Emily` publish unreviewed | Owner's call, already the case before today; the page has always carried Emily's name and verdicts. Not changed. |
| D3 | Eng P3 | `coffee amend` also annotates `status='queued'` rows; `--taste ""` writes empty string not NULL; `--by` is free text | Wanted: editing a plan's `next_change` is a use. Empty-string and free-text `--by` match the existing `coffee shot` behaviour. |
| D4 | Eng P3 | Touch cannot scrub, only tap | Accepted for now; tap-to-read answers Robby's complaint. `touch-action: pan-y` stays so the page scrolls. |
| D5 | Eng P3 | No JS tests; `parts()`/`idxAt`/`renderTable` would have caught the P1 | Noted. The repo has no JS test harness; adding one is a separate decision. |
| D6 | UX P3 | Floating tooltip duplicates the readout on desktop | Removed from the sparkline as part of fix 1 (the readout is the single surface); `bindTip` stays for the country bars. |
| D7 | UX P3 | Drag-scrub / `pointerleave` behaviour on iOS Safari unverified | Unverified on hardware. |

## Cross-seat notes
- Eng found the unvalidated `href` and routed it to the CISO, who had it independently as P2 → fixed once (8).
- UX finding "Bags logged is honest" agrees with the standing rule (no on-the-counter state in the store, Robby 2026-10-13); the eng seat confirmed the export order (house first, then newest) which drove the label fix (6).

## Owner overrides
None yet. Open for Robby: D1 (allowlist), D4 (touch scrub).

## Verification after fixes
- `node --check app.js` passes. Both pages render 0 "failed to render" sections at 1280 px and 390 px.
- Readout under Ghost Rider: "Newest: 180 µm · 1200 rpm → 35.4 s · 18 g → 37 g · Sep 10, 2026 · in band — a lot more balance, real depth".
- DOM: 10 cards on the board, 13 on bags.html; expanders "Top 10 of 37 producers", "Top 10 of 40 roasters", "Newest 10 of 52 rows"; 0 `javascript:` hrefs; 22 external links all `rel=noopener`.
- Export: no `retired_sheet`, no `water.source`, no `/Users/` or image path; `coffee amend --id 999999` exits 1 with "no shot with id".
