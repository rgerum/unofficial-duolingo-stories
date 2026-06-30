# Forced Alignment Admin Workflow

This is a local/admin-only workflow for regenerating word timing keypoints for
human-recorded story audio. It does not add ML dependencies to the app runtime.

Use this flow when a course gets new human audio, or when existing word
timestamps drift past the audio duration.

## Install Aligner

Install the aligner outside the Next.js project, preferably in a Python virtual
environment on the machine that will do the CPU work:

```sh
python3 -m venv ~/forced-align-venv
source ~/forced-align-venv/bin/activate
python -m pip install --upgrade pip
python -m pip install git+https://github.com/MahmoudAshraf97/ctc-forced-aligner.git
```

Install `ffmpeg` if the aligner or audit scripts need it:

```sh
sudo apt-get update
sudo apt-get install -y ffmpeg
```

The repo scripts expect an aligner command that writes word-level JSON to
`{json}` and supports these placeholders:

- `{audio}`: downloaded audio clip path
- `{text}`: one-line transcript path
- `{json}`: expected JSON output path
- `{language}`: story learning-language short code
- `{model}`: optional model name from `FORCED_ALIGN_MODEL`

For `ctc-forced-aligner`, use a small wrapper because its CLI writes JSON next
to the audio file:

```sh
mkdir -p ~/bin
cat > ~/bin/duostories-ctc-align <<'SH'
#!/usr/bin/env bash
set -euo pipefail
AUDIO="$1"
TEXT="$2"
JSON_OUT="$3"
LANGUAGE="${4:-dan}"
MODEL="${5:-MahmoudAshraf/mms-300m-1130-forced-aligner}"
case "$LANGUAGE" in
  da) LANGUAGE="dan" ;;
  en) LANGUAGE="eng" ;;
esac
TMP_JSON="${AUDIO%.*}.json"
rm -f "$TMP_JSON"
~/forced-align-venv/bin/ctc-forced-aligner \
  --audio_path "$AUDIO" \
  --text_path "$TEXT" \
  --language "$LANGUAGE" \
  --alignment_model "$MODEL" \
  --split_size word \
  --compute_dtype float32 \
  --device cpu
cp "$TMP_JSON" "$JSON_OUT"
SH
chmod +x ~/bin/duostories-ctc-align
```

Set the environment:

```sh
export FORCED_ALIGN_MODEL="MahmoudAshraf/mms-300m-1130-forced-aligner"
export FORCED_ALIGN_COMMAND="$HOME/bin/duostories-ctc-align {audio} {text} {json} {language} {model}"
```

If an aligner outputs milliseconds instead of seconds:

```sh
export FORCED_ALIGN_TIME_UNIT=ms
```

## Target Convex

Always set the Convex deployment explicitly before reading or writing:

```sh
export FORCED_ALIGN_CONVEX_URL="https://<deployment>.convex.cloud"
```

Applying updates also requires an admin/contributor auth token:

```sh
export CONVEX_AUTH_TOKEN="..."
```

Do not rely on `.env.local` when operating on production.

## Run One Story

Export story rows and audio only:

```sh
pnpm forced-align:story --story 1234
```

Run alignment and write review artifacts:

```sh
pnpm forced-align:story --story 1234 --align
```

The script writes:

- `tmp/forced-alignment/story-1234/manifest.json`
- `tmp/forced-alignment/story-1234/results.json`
- `tmp/forced-alignment/story-1234/story.patched.txt`
- downloaded audio clips and per-line transcript files

Review `results.json` warnings before applying. Token mismatch warnings usually
mean the spoken audio differs from the story text, or punctuation/number
normalization needs a script tweak.

## Run A Course Batch

Run public stories in a course serially:

```sh
pnpm forced-align:batch --course da-en --output /home/codex/forced-alignment-batches/da-en-$(date +%Y%m%d)
```

Useful options:

```sh
pnpm forced-align:batch --course da-en --story 2448
pnpm forced-align:batch --course da-en --failed-from /path/to/summary.json
pnpm forced-align:batch --course da-en --include-private
pnpm forced-align:batch --course da-en --concurrency 2
```

Keep `--concurrency 1` on small VPS machines unless CPU and memory are known to
be available. The batch output contains `summary.json` and one `story-<id>`
directory per story.

## Check Drift

Before applying an older batch, compare its manifest with current story text and
audio filenames:

```sh
pnpm forced-align:drift \
  --batch-dir /home/codex/forced-alignment-batches/da-en-20260630 \
  --report /home/codex/forced-alignment-batches/da-en-drift.json
```

Any stories with changed audio or changed text should be re-run into a fresh
batch and included after the older batch in the apply step. Later batch dirs win
for the same story id.

## Apply A Batch

Dry-run first:

```sh
pnpm forced-align:apply-batch \
  --batch-dir /home/codex/forced-alignment-batches/da-en-20260630 \
  --report /home/codex/forced-alignment-batches/da-en-apply-dry-run.json
```

Apply after review:

```sh
pnpm forced-align:apply-batch \
  --batch-dir /home/codex/forced-alignment-batches/da-en-20260630 \
  --comment "# Forced alignment: Danish human-audio word timings applied 2026-06-30." \
  --report /home/codex/forced-alignment-batches/da-en-apply.json \
  --apply
```

For official stories, Convex still enforces admin-only overwrites. The applier
uses `storyWrite.setStory`, reparses with the course avatar map, skips rows with
alignment warnings, skips stories whose text/audio no longer matches the batch
manifest, and preserves current audio filenames when writing timing lines.

## Notes

The app stores timing as character-offset keypoints:

```ts
{ rangeEnd: number; audioStart: number }
```

The script maps each aligned word start time to the end character offset of the
matching story word, then serializes the result back to the existing
`$filename;charDelta,timeDelta` audio line format.

With the same aligner version, model, inputs, and CPU/GPU settings, output is
expected to be stable enough for repeat runs. Treat this as a generated artifact:
keep the batch JSON, review warnings and drift, and do not apply blindly.
