#!/usr/bin/env bash
set -euo pipefail

case_name="${1:-all}"
expo_host="${EXPO_HOST:-127.0.0.1:8081}"
wait_seconds="${SCREENSHOT_WAIT:-10}"
out_dir="${SCREENSHOT_DIR:-/tmp/duo-shots}"
device="${ANDROID_SERIAL:-}"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb is required on PATH" >&2
  exit 1
fi

adb_args=()
if [[ -n "$device" ]]; then
  adb_args=(-s "$device")
fi

mkdir -p "$out_dir"

if ! adb "${adb_args[@]}" get-state >/dev/null 2>&1; then
  echo "No adb device is available. Start an emulator or connect a device first." >&2
  exit 1
fi

adb "${adb_args[@]}" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true

encoded_case_name="$(
  node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$case_name"
)"
route="/--/debug/story-shot?case=${encoded_case_name}"
uri="exp://${expo_host}${route}"

adb "${adb_args[@]}" shell am start \
  -a android.intent.action.VIEW \
  -d "$uri" >/dev/null

sleep "$wait_seconds"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
out_file="${out_dir}/${timestamp}-${case_name}.png"
adb "${adb_args[@]}" exec-out screencap -p > "$out_file"

echo "$out_file"
if command -v share-artifact >/dev/null 2>&1; then
  share-artifact "$out_file"
fi
