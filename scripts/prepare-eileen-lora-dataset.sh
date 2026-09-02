#!/usr/bin/env bash
# Prepare images + captions only (no training).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  echo "Usage: $0 --dir ./eileen-images [--dir ./more-paintings]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --dir | --add-dir)
      take_dir_arg "${2:-}"
      shift 2
      ;;
    --dir=* | --add-dir=*)
      take_dir_arg "${1#*=}"
      shift
      ;;
    -*)
      die "unknown flag: $1"
      ;;
    *)
      take_positional_dir "$1"
      shift
      ;;
  esac
done

require_unsloth
PY="$(unsloth_python)"
resolve_train_dirs "$DEFAULT_TRAIN_DIR" prompt

PREPARE_ARGS=()
for SOURCE in "${TRAIN_SOURCES[@]}"; do
  echo "Preparing from: $SOURCE"
  PREPARE_ARGS+=(--source "$SOURCE")
done

"$PY" "$SCRIPT_DIR/lib/prepare_dataset.py" \
  "${PREPARE_ARGS[@]}" \
  --dest "$DEFAULT_PREPARED_DIR" \
  --trigger "$TRIGGER"
