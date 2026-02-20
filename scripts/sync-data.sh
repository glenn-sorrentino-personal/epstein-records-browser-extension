#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_DIR="$ROOT_DIR/source-data"

TARGET_DIRS=(
  "$ROOT_DIR/chrome/data"
  "$ROOT_DIR/firefox/data"
  "$ROOT_DIR/safari/Epstein Records Indicator Safari/Epstein Records Indicator Safari Extension/Resources/data"
)

DATA_FILES=(
  "records.js"
  "names.txt"
  "mentions.txt"
  "collaborator.txt"
  "enemy.txt"
  "black-book.txt"
)

usage() {
  cat <<USAGE
Usage:
  scripts/sync-data.sh         # Copy source-data/* to all browser folders
  scripts/sync-data.sh --check # Verify browser folders match source-data/*
USAGE
}

assert_exists() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "Missing required path: $path" >&2
    exit 1
  fi
}

hash_file() {
  local path="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum "$path" | awk '{print $1}'
  elif command -v sha1sum >/dev/null 2>&1; then
    sha1sum "$path" | awk '{print $1}'
  else
    echo "Missing required command: shasum or sha1sum" >&2
    exit 1
  fi
}

check_mode() {
  local ok=1
  for file in "${DATA_FILES[@]}"; do
    local src="$SOURCE_DIR/$file"
    assert_exists "$src"
    local src_hash
    src_hash="$(hash_file "$src")"

    for target_dir in "${TARGET_DIRS[@]}"; do
      local target="$target_dir/$file"
      assert_exists "$target"

      local target_hash
      target_hash="$(hash_file "$target")"
      if [[ "$src_hash" != "$target_hash" ]]; then
        echo "OUT OF SYNC: $target"
        ok=0
      fi
    done
  done

  if [[ "$ok" -eq 1 ]]; then
    echo "All browser data files are in sync with source-data/."
  else
    echo "Data files are out of sync. Run: scripts/sync-data.sh" >&2
    exit 1
  fi
}

sync_mode() {
  for file in "${DATA_FILES[@]}"; do
    local src="$SOURCE_DIR/$file"
    assert_exists "$src"

    for target_dir in "${TARGET_DIRS[@]}"; do
      assert_exists "$target_dir"
      cp "$src" "$target_dir/$file"
      echo "Synced $file -> ${target_dir#"$ROOT_DIR/"}/$file"
    done
  done

  echo "Sync complete."
}

main() {
  case "${1:-}" in
    "")
      sync_mode
      ;;
    --check)
      check_mode
      ;;
    -h|--help)
      usage
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
}

main "$@"
