#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPO_HOST="${EXPO_HOST:-127.0.0.1:8081}"
SCREENSHOT_DIR="${SCREENSHOT_DIR:-$ROOT_DIR/benchmark-shots}"
SIMCTL_DEVICE="${SIMCTL_DEVICE:-booted}"
IOS_DIR="$SCREENSHOT_DIR/ios"

if ! command -v xcrun >/dev/null 2>&1; then
  echo "mobile-benchmark-ios: xcrun is required" >&2
  exit 1
fi

mkdir -p "$IOS_DIR"

CASES=()
while IFS= read -r line; do
  CASES+=("$line")
done < <(
  cd "$ROOT_DIR" &&
    node -e '
      const registry = require("./app-mobile/src/debug-benchmark/cases.json");
      const filters = process.argv.slice(1);
      for (const entry of registry.cases) {
        if (filters.length && !filters.some((filter) => entry.id.includes(filter))) continue;
        console.log([entry.id, entry.case, entry.theme].join("\t"));
      }
    ' "$@"
)

if [[ "${#CASES[@]}" -eq 0 ]]; then
  echo "mobile-benchmark-ios: no cases matched" >&2
  exit 1
fi

index=0
for row in "${CASES[@]}"; do
  IFS=$'\t' read -r id case_name theme <<<"$row"
  uri="exp://$EXPO_HOST/--/debug/benchmark?case=$case_name&theme=$theme"
  echo "Capturing iOS $id"
  xcrun simctl openurl "$SIMCTL_DEVICE" "$uri"
  if [[ -n "${SCREENSHOT_WAIT:-}" ]]; then
    sleep "$SCREENSHOT_WAIT"
  elif [[ "$index" -eq 0 ]]; then
    sleep 12
  else
    sleep 4
  fi
  xcrun simctl io "$SIMCTL_DEVICE" screenshot "$IOS_DIR/$id.png"
  index=$((index + 1))
done

node "$ROOT_DIR/scripts/benchmark-contact-sheet.mjs" "$SCREENSHOT_DIR"
echo "Contact sheet: $SCREENSHOT_DIR/index.html"
