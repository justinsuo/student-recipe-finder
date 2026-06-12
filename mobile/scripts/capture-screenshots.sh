#!/usr/bin/env bash
#
# Capture an up-to-date screenshot of every key Waivy screen from the iOS
# simulator into docs/screenshots/. It flips the app into "tour mode" (a flag
# file in the app container), which makes the app seed demo data and auto-walk
# each screen, announcing each one so we can grab a clean device screenshot.
#
# Requires: a booted simulator with Waivy installed and the Metro dev server
# running (the normal `npx expo start` / `expo run:ios` dev state). Pass a UDID
# as $1, or it auto-detects the booted simulator.
#
# Usage: bash mobile/scripts/capture-screenshots.sh [UDID]
set -uo pipefail

BUNDLE="com.waivy.app"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
OUT="$REPO/docs/screenshots"

UDID="${1:-}"
if [ -z "$UDID" ]; then
  UDID="$(xcrun simctl list devices booted | grep -oE '\([0-9A-Fa-f-]{36}\)' | tr -d '()' | head -1)"
fi
if [ -z "$UDID" ]; then echo "✗ no booted simulator (boot one and run the app first)"; exit 1; fi

if ! xcrun simctl get_app_container "$UDID" "$BUNDLE" data >/dev/null 2>&1; then
  echo "✗ Waivy ($BUNDLE) is not installed on $UDID — run \`cd mobile && npx expo run:ios\` first"; exit 1
fi

mkdir -p "$OUT"
echo "▶ capturing Waivy screenshots from $UDID"

xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1
DOCS="$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data)/Documents"
mkdir -p "$DOCS"
printf '{"enabled":true,"perRouteMs":3200}' > "$DOCS/shots.json"
rm -f "$DOCS/shot-current.txt"

xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null 2>&1
echo "  app launched in tour mode (needs Metro running); capturing…"

last=""; count=0; end=$(( $(date +%s) + 180 ))
while [ "$(date +%s)" -lt "$end" ]; do
  cur="$(cat "$DOCS/shot-current.txt" 2>/dev/null || true)"
  if [ -n "$cur" ] && [ "$cur" != "$last" ]; then
    last="$cur"
    if [ "$cur" = "__done__" ]; then echo "  tour complete"; break; fi
    sleep 0.8
    if xcrun simctl io "$UDID" screenshot "$OUT/$cur.png" >/dev/null 2>&1; then
      count=$((count+1)); echo "  ✓ $cur"
    fi
  fi
  sleep 0.25
done

# Cleanup: remove the flag so normal launches don't tour.
rm -f "$DOCS/shots.json" "$DOCS/shot-current.txt"
xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1
xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null 2>&1

if [ "$count" -eq 0 ]; then
  echo "✗ captured 0 screens — is the Metro dev server running? (npx expo start)"; exit 1
fi

# Downscale to a gallery-friendly width to keep the repo lean + README crisp.
for f in "$OUT"/*.png; do sips --resampleWidth 480 "$f" >/dev/null 2>&1 || true; done

echo "▶ captured $count screens → $OUT"
