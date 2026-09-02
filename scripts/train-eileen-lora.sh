#!/usr/bin/env bash
# End-to-end: collect training folders, prepare them, download the base model, train a LoRA.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

RESUME=0
TRAIN_STEPS="${TRAIN_STEPS:-800}"

usage() {
  cat <<EOF
Train Eileen's style LoRA with Unsloth (FLUX.2-klein on this Mac).

Usage:
  $0 --dir ./eileen-images
  $0 --dir ./eileen-images/art --dir ./eileen-images/eileen
  $0 --resume --dir ./eileen-images
  TRAIN_DIR=./eileen-images $0

--dir can be repeated to merge folders into one dataset. Positional
paths work the same way. If you pass none, the script prompts
(default: $DEFAULT_TRAIN_DIR).

Skips excluded/ and *copy* files. Downloads the base model into the
Hugging Face cache if it is not already present.

Environment:
  HF_TOKEN              optional if `hf auth login` already succeeded
  EILEEN_BASE_MODEL     default black-forest-labs/FLUX.2-klein-base-4B
  EILEEN_FAMILY         default flux.2-klein
  EILEEN_MIXED_PRECISION default bf16 (required on Apple Silicon)
  EILEEN_BASE_PRECISION  default bf16 (nf4 bitsandbytes crashes on MPS)
  EILEEN_TRIGGER        default eileenart
  TRAIN_STEPS           default 800
  TRAIN_DIR             extra training directory (same as --dir)
  UNSLOTH_PYTHON        override Studio venv python
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
    --)
      shift
      break
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
require_hf_auth
PY="$(unsloth_python)"

DEFAULT_FOR_PROMPT="$DEFAULT_TRAIN_DIR"
resolve_train_dirs "$DEFAULT_FOR_PROMPT" prompt

echo "Training from:"
PREPARE_ARGS=()
SOURCE_ARGS=()
for SOURCE in "${TRAIN_SOURCES[@]}"; do
  echo "  $SOURCE"
  PREPARE_ARGS+=(--source "$SOURCE")
  SOURCE_ARGS+=(--source-dir "$SOURCE")
done

"$PY" "$SCRIPT_DIR/lib/prepare_dataset.py" \
  "${PREPARE_ARGS[@]}" \
  --dest "$DEFAULT_PREPARED_DIR" \
  --trigger "$TRIGGER"

export PYTORCH_ENABLE_MPS_FALLBACK=1
TRAIN_ARGS=(
  --data-dir "$DEFAULT_PREPARED_DIR"
  --output-dir "$DEFAULT_OUTPUT_DIR"
  "${SOURCE_ARGS[@]}"
  --base-model "$BASE_MODEL"
  --family "$FAMILY"
  --mixed-precision "$MIXED_PRECISION"
  --base-precision "$BASE_PRECISION"
  --instance-prompt "${TRIGGER} style painting"
  --trigger "$TRIGGER"
  --train-steps "$TRAIN_STEPS"
)
if [[ "$RESUME" -eq 1 ]]; then
  TRAIN_ARGS+=(--resume)
fi
"$PY" "$SCRIPT_DIR/lib/train_flux_lora.py" "${TRAIN_ARGS[@]}"
