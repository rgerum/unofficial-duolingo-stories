#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPO_HOST="${EXPO_HOST:-127.0.0.1:8081}"
SCREENSHOT_DIR="${SCREENSHOT_DIR:-$ROOT_DIR/benchmark-shots}"
ANDROID_DIR="$SCREENSHOT_DIR/android"

if ! command -v adb >/dev/null 2>&1; then
  echo "mobile-benchmark: adb is required" >&2
  exit 1
fi

ADB=(adb)
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  ADB+=(-s "$ANDROID_SERIAL")
fi

mkdir -p "$ANDROID_DIR"
"${ADB[@]}" reverse tcp:8081 tcp:8081

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
  echo "mobile-benchmark: no cases matched" >&2
  exit 1
fi

index=0
for row in "${CASES[@]}"; do
  IFS=$'\t' read -r id case_name theme <<<"$row"
  uri="exp://$EXPO_HOST/--/debug/benchmark?case=$case_name&theme=$theme"
  echo "Capturing Android $id"
  # adb shell re-parses the command on the device, so the URI must be quoted
  # again or the `&` between query params backgrounds the command there.
  "${ADB[@]}" shell "am start -a android.intent.action.VIEW -d '$uri'" >/dev/null
  if [[ -n "${SCREENSHOT_WAIT:-}" ]]; then
    sleep "$SCREENSHOT_WAIT"
  elif [[ "$index" -eq 0 ]]; then
    sleep 12
  else
    sleep 4
  fi
  "${ADB[@]}" exec-out screencap -p > "$ANDROID_DIR/$id.png"
  index=$((index + 1))
done

node "$ROOT_DIR/scripts/benchmark-contact-sheet.mjs" "$SCREENSHOT_DIR"
echo "Contact sheet: $SCREENSHOT_DIR/index.html"
