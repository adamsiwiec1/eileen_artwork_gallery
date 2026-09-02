#!/usr/bin/env python3
"""Generate one local preview with a trained LoRA on MPS/CPU."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lora-dir", required=True)
    parser.add_argument("--base-model", default="black-forest-labs/FLUX.2-klein-base-4B")
    parser.add_argument(
        "--prompt",
        default="eileenart oil painting of a quiet harbor at dusk, painterly brushwork",
    )
    parser.add_argument("--out", default="")
    parser.add_argument("--steps", type=int, default=20)
    args = parser.parse_args()

    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

    import torch
    from diffusers import DiffusionPipeline

    lora_dir = Path(args.lora_dir).resolve()
    if not lora_dir.is_dir():
        raise SystemExit(f"LoRA directory missing: {lora_dir}")

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    dtype = torch.float16 if device == "mps" else torch.float32
    print(f"Loading {args.base_model} on {device}")
    pipe = DiffusionPipeline.from_pretrained(args.base_model, torch_dtype=dtype)
    pipe.load_lora_weights(str(lora_dir))
    pipe = pipe.to(device)

    image = pipe(args.prompt, num_inference_steps=args.steps, guidance_scale=3.5).images[0]
    out = Path(args.out) if args.out else lora_dir / "sample.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
