#!/usr/bin/env bash
# Generate one local preview with the trained LoRA.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

require_unsloth
PY="$(unsloth_python)"

LORA_DIR="$DEFAULT_OUTPUT_DIR"
if [[ -f "$LAST_RUN" ]]; then
  FROM_RUN="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('output_dir',''))" "$LAST_RUN")"
  [[ -n "$FROM_RUN" ]] && LORA_DIR="$FROM_RUN"
  FROM_BASE="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('base_model',''))" "$LAST_RUN")"
  [[ -n "$FROM_BASE" ]] && BASE_MODEL="$FROM_BASE"
fi

PROMPT="${1:-eileenart oil painting of a quiet harbor at dusk, painterly brushwork}"

"$PY" "$SCRIPT_DIR/lib/sample_lora.py" \
  --lora-dir "$LORA_DIR" \
  --base-model "$BASE_MODEL" \
  --prompt "$PROMPT" \
  --out "$LORA_DIR/sample.png"
