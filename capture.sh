#!/usr/bin/env bash
# Screenshot a project page into assets/shots/<slug>.png
#
#   ./capture.sh <slug> <url>   shoot one project
#   ./capture.sh                shoot every project in projects.json
#
# Uses headless Chrome directly (no npm deps). --headless=old is deliberate:
# the new headless mode hangs in this sandbox, so we also wrap each shot in a
# watchdog and fall back to leaving any existing PNG untouched on failure.

set -uo pipefail
cd "$(dirname "$0")"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="assets/shots"
W=1440
H=1000
TIMEOUT=45

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME" >&2; exit 1; }
mkdir -p "$OUT"

shoot() {
  local slug="$1" url="$2"
  local dest="$OUT/$slug.png"
  local tmpdir; tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/shot-XXXXXX")"

  echo "  → $slug  ($url)"
  "$CHROME" --headless=old --disable-gpu --hide-scrollbars \
    --no-first-run --no-default-browser-check \
    --user-data-dir="$tmpdir" \
    --window-size="${W},${H}" \
    --virtual-time-budget=6000 \
    --screenshot="$dest" "$url" >/dev/null 2>&1 &
  local pid=$!
  ( sleep "$TIMEOUT"; kill -9 "$pid" 2>/dev/null ) >/dev/null 2>&1 &
  local watchdog=$!
  wait "$pid" 2>/dev/null
  kill -9 "$watchdog" 2>/dev/null
  rm -rf "$tmpdir"

  if [ -s "$dest" ]; then
    echo "    ok  $(du -h "$dest" | cut -f1)"
  else
    echo "    FAILED (no output) — $slug" >&2
    return 1
  fi
}

if [ "$#" -eq 2 ]; then
  shoot "$1" "$2"
  exit $?
fi

if [ "$#" -ne 0 ]; then
  echo "usage: $0 [<slug> <url>]" >&2
  exit 2
fi

# Batch mode: every project that has a real link.
echo "Batch capture from projects.json"
failed=0
while IFS=$'\t' read -r slug url; do
  [ -z "$slug" ] && continue
  shoot "$slug" "$url" || failed=$((failed + 1))
done < <(python3 -c '
import json
for p in json.load(open("projects.json")):
    link = p.get("link")
    if link and link != "private":
        print(p["slug"] + "\t" + link)
')
echo "done ($failed failed)"
exit 0
