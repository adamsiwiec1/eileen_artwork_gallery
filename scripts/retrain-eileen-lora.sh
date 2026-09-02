#!/usr/bin/env bash
# Retrain the LoRA. Reuses last --dir folders unless you pass new ones.
# Fresh run by default. Pass --resume to continue from the latest checkpoint.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

RESUME=0

usage() {
  cat <<EOF
Retrain Eileen's style LoRA.

Usage:
  $0
  $0 --dir ./eileen-images --dir ./more-paintings
  $0 --resume --dir ./eileen-images

With no --dir, reuses the folders from $LAST_RUN when that file exists.

  --dir PATH  training folder (repeatable)
  --resume    continue from outputs/eileen-lora/checkpoint-*
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --resume)
      RESUME=1
      shift
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

FALLBACK="last"
if [[ ${#DIR_FLAGS[@]} -eq 0 && ${#POSITIONAL_DIRS[@]} -eq 0 && -z "${TRAIN_DIR:-}" ]]; then
  DEFAULT_FOR_PROMPT="$DEFAULT_TRAIN_DIR"
  FIRST_LAST=""
  while IFS= read -r line; do
    [[ -z "$FIRST_LAST" && -n "$line" ]] && FIRST_LAST="$line"
  done < <(last_data_dirs)
  [[ -n "$FIRST_LAST" ]] && DEFAULT_FOR_PROMPT="$FIRST_LAST"
else
  FALLBACK="prompt"
  DEFAULT_FOR_PROMPT="$DEFAULT_TRAIN_DIR"
fi

resolve_train_dirs "$DEFAULT_FOR_PROMPT" "$FALLBACK"

ARGS=()
if [[ "$RESUME" -eq 1 ]]; then
  ARGS+=(--resume)
fi
for SOURCE in "${TRAIN_SOURCES[@]}"; do
  ARGS+=(--dir "$SOURCE")
done

exec "$SCRIPT_DIR/train-eileen-lora.sh" "${ARGS[@]}"
