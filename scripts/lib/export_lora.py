#!/usr/bin/env python3
"""Convert an Unsloth PEFT checkpoint into a deployable Diffusers LoRA."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--dest", required=True)
    parser.add_argument("--base-model", default="black-forest-labs/FLUX.2-klein-base-4B")
    parser.add_argument("--trigger", default="eileenart")
    args = parser.parse_args()

    ckpt = Path(args.checkpoint).resolve()
    adapter = ckpt / "adapter_model.safetensors"
    if not adapter.is_file():
        raise SystemExit(f"PEFT adapter missing: {adapter}")

    dest = Path(args.dest).resolve()
    dest.mkdir(parents=True, exist_ok=True)

    from safetensors.torch import load_file
    from diffusers import Flux2KleinPipeline

    layers = load_file(str(adapter))
    Flux2KleinPipeline.save_lora_weights(
        save_directory=str(dest),
        transformer_lora_layers=layers,
        weight_name="pytorch_lora_weights.safetensors",
    )

    state_path = ckpt / "trainer_state.json"
    step = None
    if state_path.is_file():
        state = json.loads(state_path.read_text(encoding="utf-8"))
        step = state.get("global_step")
        shutil.copy2(state_path, dest / "trainer_state.json")

    card = dest / "README.md"
    card.write_text(
        "\n".join(
            [
                "---",
                "library_name: diffusers",
                "base_model: " + args.base_model,
                "tags:",
                "- lora",
                "- flux2",
                "- text-to-image",
                "---",
                "",
                "# Eileen style LoRA",
                "",
                f"Flux.2-klein adapter trained on Eileen's paintings. Trigger: `{args.trigger}`.",
                f"Exported from `{ckpt.name}`"
                + (f" (step {step})." if step is not None else "."),
                f"Exported at {datetime.now(timezone.utc).isoformat()}.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(f"Wrote Diffusers LoRA to {dest} (step={step})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
