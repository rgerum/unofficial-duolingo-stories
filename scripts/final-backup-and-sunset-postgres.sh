#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/final-backup-and-sunset-postgres.sh [--url <postgres-url>] [--out-dir <dir>] [--force] [--dry-run]

Description:
  Creates a final timestamped backup set for the legacy Postgres mirror:
  - custom dump (.dump)
  - plain SQL dump (.sql)
  - optional globals dump (.globals.sql)
  - SHA-256 checksum file
  - restore manifest preview (.manifest.txt)

Environment:
  LEGACY_POSTGRES_URL   Postgres connection string (used if --url is not provided)
  FORCE=1               Skip interactive confirmation

Examples:
  LEGACY_POSTGRES_URL='postgresql://user:pass@host/db?sslmode=require' \
    scripts/final-backup-and-sunset-postgres.sh

  scripts/final-backup-and-sunset-postgres.sh --url 'postgresql://user:pass@host/db?sslmode=require' --force
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

URL="${LEGACY_POSTGRES_URL:-}"
OUT_DIR="sql_dump"
FORCE="${FORCE:-0}"
DRY_RUN=0

while (($# > 0)); do
  case "$1" in
  --url)
    URL="${2:-}"
    shift 2
    ;;
  --out-dir)
    OUT_DIR="${2:-}"
    shift 2
    ;;
  --force)
    FORCE=1
    shift
    ;;
  --dry-run)
    DRY_RUN=1
    shift
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown argument: $1" >&2
    usage
    exit 1
    ;;
  esac
done

if [[ -z "$URL" ]]; then
  echo "Error: missing Postgres URL. Use --url or LEGACY_POSTGRES_URL." >&2
  exit 1
fi

for bin in pg_dump pg_dumpall pg_restore shasum; do
  require_cmd "$bin"
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BASE="duostories-final-${STAMP}"
mkdir -p "$OUT_DIR"

DUMP_FILE="${OUT_DIR}/${BASE}.dump"
SQL_FILE="${OUT_DIR}/${BASE}.sql"
GLOBALS_FILE="${OUT_DIR}/${BASE}-globals.sql"
SHA_FILE="${OUT_DIR}/${BASE}.sha256"
MANIFEST_FILE="${OUT_DIR}/${BASE}.manifest.txt"

mask_url() {
  local raw="$1"
  echo "$raw" | sed -E 's#(postgres(ql)?://[^:]+):[^@]+@#\1:***@#'
}

if [[ "$FORCE" != "1" ]]; then
  echo "About to create final Postgres backup artifacts:"
  echo "  URL:     $(mask_url "$URL")"
  echo "  Out dir: $OUT_DIR"
  echo "  Prefix:  $BASE"
  printf 'Continue? [y/N] '
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

if [[ "$DRY_RUN" == "1" ]]; then
  log "Dry run enabled; no backup files will be written."
  exit 0
fi

log "Creating custom-format dump: $DUMP_FILE"
pg_dump "$URL" --format=custom --file "$DUMP_FILE"

log "Creating plain SQL dump: $SQL_FILE"
pg_dump "$URL" --format=plain --no-owner --no-privileges --file "$SQL_FILE"

log "Attempting globals dump: $GLOBALS_FILE"
if pg_dumpall "$URL" --globals-only >"$GLOBALS_FILE"; then
  log "Globals dump created."
else
  log "Globals dump failed (continuing without globals)."
  rm -f "$GLOBALS_FILE"
fi

log "Writing restore manifest preview: $MANIFEST_FILE"
pg_restore --list "$DUMP_FILE" | head -n 200 >"$MANIFEST_FILE"

log "Writing SHA-256 checksums: $SHA_FILE"
if [[ -f "$GLOBALS_FILE" ]]; then
  shasum -a 256 "$DUMP_FILE" "$SQL_FILE" "$GLOBALS_FILE" >"$SHA_FILE"
else
  shasum -a 256 "$DUMP_FILE" "$SQL_FILE" >"$SHA_FILE"
fi

log "Backup complete."
echo "Artifacts:"
echo "  - $DUMP_FILE"
echo "  - $SQL_FILE"
if [[ -f "$GLOBALS_FILE" ]]; then
  echo "  - $GLOBALS_FILE"
fi
echo "  - $MANIFEST_FILE"
echo "  - $SHA_FILE"
echo
echo "Next steps:"
echo "  1) Upload artifacts and checksum file to durable storage."
echo "  2) Remove POSTGRES_URL2 from Convex and Vercel env settings."
echo "  3) Disable/delete the Neon mirror project."
