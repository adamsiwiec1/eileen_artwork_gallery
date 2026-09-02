# Shared helpers for Eileen LoRA scripts. Source from any script under scripts/.

_this="${BASH_SOURCE[0]:-}"
if [[ -z "$_this" && -n "${ZSH_VERSION:-}" ]]; then
  _this="${(%):-%x}"
fi
ROOT="$(cd "$(dirname "$_this")/../.." && pwd)"
cd "$ROOT"

LAST_RUN="$ROOT/outputs/eileen-lora/last-run.json"
DEFAULT_TRAIN_DIR="$ROOT/eileen-images"
DEFAULT_PREPARED_DIR="$ROOT/data/eileen-lora"
DEFAULT_OUTPUT_DIR="$ROOT/outputs/eileen-lora"
TRIGGER="${EILEEN_TRIGGER:-eileenart}"
BASE_MODEL="${EILEEN_BASE_MODEL:-black-forest-labs/FLUX.2-klein-base-4B}"
FAMILY="${EILEEN_FAMILY:-flux.2-klein}"
MIXED_PRECISION="${EILEEN_MIXED_PRECISION:-bf16}"
BASE_PRECISION="${EILEEN_BASE_PRECISION:-bf16}"

die() {
  echo "error: $*" >&2
  exit 1
}

unsloth_python() {
  if [[ -n "${UNSLOTH_PYTHON:-}" && -x "${UNSLOTH_PYTHON}" ]]; then
    printf '%s\n' "$UNSLOTH_PYTHON"
    return 0
  fi

  local bin=""
  bin="$(command -v unsloth 2>/dev/null || true)"
  if [[ -n "$bin" ]]; then
    local resolved venv_python
    resolved="$(python3 -c "import os; print(os.path.realpath('$bin'))")"
    venv_python="$(dirname "$resolved")/python"
    if [[ -x "$venv_python" ]]; then
      printf '%s\n' "$venv_python"
      return 0
    fi
  fi

  local studio_python="$HOME/.unsloth/studio/unsloth_studio/bin/python"
  if [[ -x "$studio_python" ]]; then
    printf '%s\n' "$studio_python"
    return 0
  fi

  return 1
}

require_hf_auth() {
  if [[ -n "${HF_TOKEN:-}" || -n "${HUGGING_FACE_HUB_TOKEN:-}" ]]; then
    return 0
  fi
  if command -v hf >/dev/null && hf auth whoami >/dev/null 2>&1; then
    return 0
  fi
  cat >&2 <<'EOF'
Not logged in to Hugging Face.

  1. In this terminal: hf auth login
  2. Re-run the train script. No need to export HF_TOKEN after that.

Do not paste the token into chat.
EOF
  exit 1
}

require_unsloth() {
  if unsloth_python >/dev/null; then
    return 0
  fi
  cat >&2 <<'EOF'
Unsloth is not installed. On this Mac run:

  curl -fsSL https://unsloth.ai/install.sh | sh

Then re-run this script. Set UNSLOTH_PYTHON if you installed it somewhere else.
EOF
  exit 1
}

# Populated by take_dir_arg / take_positional_dir before resolve_train_dirs.
DIR_FLAGS=()
POSITIONAL_DIRS=()
TRAIN_SOURCES=()

last_data_dirs() {
  if [[ ! -f "$LAST_RUN" ]]; then
    return 0
  fi
  python3 -c "
import json, sys
data = json.load(open(sys.argv[1]))
dirs = data.get('data_dirs') or []
if not dirs and data.get('data_dir'):
    dirs = [data['data_dir']]
print('\n'.join(d for d in dirs if d))
" "$LAST_RUN" 2>/dev/null || true
}

take_dir_arg() {
  local value="${1:-}"
  [[ -n "$value" ]] || die "--dir needs a path"
  DIR_FLAGS+=("$value")
}

take_positional_dir() {
  POSITIONAL_DIRS+=("$1")
}

# Sets TRAIN_SOURCES in the current shell so `die` is not lost in a subshell.
resolve_train_dirs() {
  local default="${1:-$DEFAULT_TRAIN_DIR}"
  local fallback="${2:-prompt}"
  local dirs=()
  local line answer path

  TRAIN_SOURCES=()

  if [[ ${#DIR_FLAGS[@]} -gt 0 ]]; then
    dirs+=("${DIR_FLAGS[@]}")
  fi
  if [[ ${#POSITIONAL_DIRS[@]} -gt 0 ]]; then
    dirs+=("${POSITIONAL_DIRS[@]}")
  fi
  if [[ -n "${TRAIN_DIR:-}" ]]; then
    dirs+=("$TRAIN_DIR")
  fi

  if [[ ${#dirs[@]} -eq 0 && "$fallback" == "last" ]]; then
    while IFS= read -r line; do
      [[ -n "$line" ]] && dirs+=("$line")
    done < <(last_data_dirs)
  fi

  if [[ ${#dirs[@]} -eq 0 ]]; then
    if [[ -t 0 && "$fallback" != "default" ]]; then
      read -r -p "Training image directory [$default]: " answer
      dirs+=("${answer:-$default}")
    else
      dirs+=("$default")
    fi
  fi

  for path in "${dirs[@]}"; do
    path="$(abs_path "$path")"
    [[ -d "$path" ]] || die "training directory not found: $path"
    TRAIN_SOURCES+=("$path")
  done

  [[ ${#TRAIN_SOURCES[@]} -gt 0 ]] || die "no training directories given"
}

abs_path() {
  local path="$1"
  if [[ "$path" != /* ]]; then
    path="$ROOT/${path#./}"
  fi
  python3 -c "import os,sys; print(os.path.realpath(sys.argv[1]))" "$path"
}
