#!/usr/bin/env bash
# Create/update the ZeroGPU Space that serves the Eileen LoRA.
# Needs a Hugging Face PRO plan (Gradio + ZeroGPU).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

SPACE_ID="${EILEEN_SPACE_ID:-ukryty/eileen-lora}"
LORA_REPO="${EILEEN_LORA_REPO:-ukryty/eileenart-lora}"
SPACE_DIR="$ROOT/spaces/eileen-lora"

require_hf_auth
[[ -f "$SPACE_DIR/app.py" ]] || die "missing $SPACE_DIR/app.py"

echo "Creating Space $SPACE_ID (ZeroGPU, public app)..."
hf repos create "$SPACE_ID" --type space --space-sdk gradio --flavor zero-a10g --public --exist-ok

echo "Uploading Space files..."
hf upload "$SPACE_ID" "$SPACE_DIR" --type space \
  --include "app.py" \
  --include "requirements.txt" \
  --include "README.md" \
  --commit-message "Flux.2-klein Eileen LoRA Space"

echo "Setting Space secrets (token from local hf login, values not printed)..."
hf spaces secrets add "$SPACE_ID" -s HF_TOKEN -s "EILEEN_LORA_REPO=${LORA_REPO}" -s "EILEEN_TRIGGER=${TRIGGER}"

echo "Done. Space: https://huggingface.co/spaces/${SPACE_ID}"
echo "Set SPACE_ID=${SPACE_ID} and IMAGE_PROVIDER=eileen in apps/next/.env"
