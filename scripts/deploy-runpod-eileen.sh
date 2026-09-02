#!/usr/bin/env bash
# Print the RunPod console steps (and optionally create an endpoint from an image).
# Does not print secret values. Add RUNPOD_API_KEY to the environment first.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

ENDPOINT_NAME="${RUNPOD_ENDPOINT_NAME:-eileen-lora}"
IMAGE="${RUNPOD_IMAGE:-}"
# 24 GB class is the safe floor for Flux.2-klein + the Qwen text encoder.
GPU_IDS='["NVIDIA RTX A5000","NVIDIA GeForce RTX 3090","NVIDIA L4","NVIDIA RTX A4000"]'

if [[ -z "${RUNPOD_API_KEY:-}" ]]; then
  cat <<'EOF'
Add RUNPOD_API_KEY to this shell (do not paste it into chat), then re-run
or finish in the console:

  1. https://www.runpod.io/console/user/settings  → create an API key
  2. https://www.runpod.io/console/serverless     → New Endpoint
  3. New Endpoint → GitHub: adamsiwiec1/eileen_artwork_gallery (branch main)
  4. Dockerfile path: Dockerfile
     Preflight looks for ./handler.py and ./Dockerfile on main. Wait a minute after push.
  5. Queue endpoint. GPU: 24 GB class (A5000 / 3090 / L4). Workers min 0, max 1.
     Idle timeout 5s. Execution timeout 600s. Container disk 40 GB.
  6. Endpoint environment (names only):
       HF_TOKEN                 (same Hugging Face login that can read
                                 black-forest-labs/FLUX.2-klein-base-4B and
                                 ukryty/eileenart-lora)
       EILEEN_LORA_REPO         ukryty/eileenart-lora
       EILEEN_BASE_MODEL        black-forest-labs/FLUX.2-klein-base-4B
       EILEEN_TRIGGER           eileenart
  7. After deploy, put RUNPOD_ENDPOINT_ID in apps/next/.env
     (the id is the path segment in api.runpod.ai/v2/<id>/).
     Leave IMAGE_PROVIDER unset — both RunPod names select the LoRA worker.

First Studio generate pays the cold-start (model download). Later ones are a few seconds.
EOF
  exit 1
fi

if [[ -z "$IMAGE" ]]; then
  echo "RUNPOD_API_KEY is set. Create the endpoint in the console (GitHub import), or set"
  echo "RUNPOD_IMAGE to a linux/amd64 image and re-run this script to create it via API."
  echo "Dockerfile path: Dockerfile"
  exit 0
fi

export RUNPOD_IMAGE="$IMAGE"
echo "Creating serverless template from RUNPOD_IMAGE..."
TEMPLATE_JSON="$(
  curl -sS -X POST https://rest.runpod.io/v1/templates \
    -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "
import json, os
print(json.dumps({
    'name': '${ENDPOINT_NAME}-tpl',
    'imageName': os.environ.get('RUNPOD_IMAGE', ''),
    'isServerless': True,
    'containerDiskInGb': 40,
    'env': {
        'EILEEN_LORA_REPO': 'ukryty/eileenart-lora',
        'EILEEN_BASE_MODEL': 'black-forest-labs/FLUX.2-klein-base-4B',
        'EILEEN_TRIGGER': 'eileenart',
    },
}))
")"
)"
TEMPLATE_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin).get('id') or '')" <<<"$TEMPLATE_JSON")"
[[ -n "$TEMPLATE_ID" ]] || die "template create failed (no id). Check RUNPOD_IMAGE."

echo "Creating scale-to-zero endpoint..."
ENDPOINT_JSON="$(
  curl -sS -X POST https://rest.runpod.io/v1/endpoints \
    -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "
import json
print(json.dumps({
    'name': '${ENDPOINT_NAME}',
    'templateId': '${TEMPLATE_ID}',
    'gpuTypeIds': ${GPU_IDS},
    'workersMin': 0,
    'workersMax': 1,
    'idleTimeout': 5,
    'executionTimeoutMs': 600000,
}))
")"
)"
ENDPOINT_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin).get('id') or '')" <<<"$ENDPOINT_JSON")"
[[ -n "$ENDPOINT_ID" ]] || die "endpoint create failed (no id)."

echo "Endpoint id (put this in apps/next/.env as RUNPOD_ENDPOINT_ID):"
echo "$ENDPOINT_ID"
echo "Add HF_TOKEN on the endpoint in the RunPod console so it can pull the base model and LoRA."
