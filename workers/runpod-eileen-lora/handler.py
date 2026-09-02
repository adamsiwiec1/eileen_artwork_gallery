"""RunPod queue worker: Flux.2-klein + Eileen style LoRA."""

from __future__ import annotations

import base64
import io
import os
from typing import Any

import runpod
import torch
from diffusers import Flux2KleinPipeline
from PIL import Image

BASE_MODEL = os.environ.get("EILEEN_BASE_MODEL", "black-forest-labs/FLUX.2-klein-base-4B")
LORA_REPO = os.environ.get("EILEEN_LORA_REPO", "ukryty/eileenart-lora").strip()
TRIGGER = os.environ.get("EILEEN_TRIGGER", "eileenart")
DEFAULT_STEPS = int(os.environ.get("EILEEN_STEPS", "8"))
DEFAULT_GUIDANCE = float(os.environ.get("EILEEN_GUIDANCE", "4.0"))

if os.path.isdir("/runpod-volume"):
    os.environ.setdefault("HF_HOME", "/runpod-volume/huggingface")

_PIPE: Flux2KleinPipeline | None = None


def _device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def get_pipe() -> Flux2KleinPipeline:
    global _PIPE
    if _PIPE is not None:
        return _PIPE
    device = _device()
    dtype = torch.bfloat16 if device == "cuda" else torch.float32
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    print(f"Loading {BASE_MODEL} on {device}", flush=True)
    pipe = Flux2KleinPipeline.from_pretrained(
        BASE_MODEL,
        torch_dtype=dtype,
        token=token,
    )
    if LORA_REPO:
        print(f"Loading LoRA {LORA_REPO}", flush=True)
        pipe.load_lora_weights(LORA_REPO, token=token)
    pipe.to(device)
    _PIPE = pipe
    print("Pipeline ready", flush=True)
    return pipe


def _as_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _as_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def generate_image(inp: dict[str, Any]) -> Image.Image:
    prompt = str(inp.get("prompt") or "").strip()
    if not prompt:
        raise ValueError("input.prompt is required")
    if TRIGGER not in prompt:
        prompt = f"{TRIGGER} {prompt}"
    seed = _as_int(inp.get("seed"), 42)
    steps = max(4, min(28, _as_int(inp.get("steps"), DEFAULT_STEPS)))
    guidance = max(1.0, min(7.0, _as_float(inp.get("guidance"), DEFAULT_GUIDANCE)))
    device = _device()
    generator = torch.Generator(device).manual_seed(seed)
    image = get_pipe()(
        prompt,
        num_inference_steps=steps,
        guidance_scale=guidance,
        generator=generator,
    ).images[0]
    return image


def to_png_b64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def handler(job: dict[str, Any]) -> dict[str, Any]:
    inp = job.get("input") or {}
    if not isinstance(inp, dict):
        return {"error": "input must be an object"}
    try:
        image = generate_image(inp)
    except Exception as exc:  # noqa: BLE001 — return to the job API
        return {"error": str(exc)}
    return {"image": to_png_b64(image)}


if __name__ == "__main__":
    get_pipe()
    runpod.serverless.start({"handler": handler})
