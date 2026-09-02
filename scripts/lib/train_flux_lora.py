#!/usr/bin/env python3
"""Train a style LoRA with Unsloth Studio's diffusion trainer.

`unsloth train` is the LLM SFT command. Image LoRAs go through
`DiffusionLoraConfig` + `run_dit_lora_training` in the Studio backend.
This script locates that venv, downloads the base model if needed, then trains.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

LIB_DIR = Path(__file__).resolve().parent
if str(LIB_DIR) not in sys.path:
    sys.path.insert(0, str(LIB_DIR))


def find_studio_backend() -> Path:
    # uv/Homebrew Pythons make sys.executable a symlink into the base install.
    # Search the venv prefix first, then the unresolved executable path.
    version = f"python{sys.version_info.major}.{sys.version_info.minor}"
    candidates = [
        Path(sys.prefix) / "lib" / version / "site-packages" / "studio" / "backend",
        Path(sys.executable).parent.parent / "lib" / version / "site-packages" / "studio" / "backend",
    ]
    for here in (Path(sys.executable), Path(sys.executable).resolve()):
        for parent in here.parents:
            candidates.extend(parent.glob("lib/python*/site-packages/studio/backend"))
    env = os.environ.get("UNSLOTH_STUDIO_BACKEND")
    if env:
        candidates.append(Path(env))
    for path in candidates:
        if path.is_dir():
            return path
    raise SystemExit(
        "Could not find Unsloth Studio's backend next to this Python. "
        "Run via scripts/train-eileen-lora.sh so it picks the Studio venv."
    )


def emit(event: dict) -> None:
    kind = event.get("type", "event")
    if kind == "progress":
        step = event.get("step", event.get("global_step", "?"))
        loss = event.get("loss", event.get("running_loss", ""))
        print(f"  step {step}  loss={loss}", flush=True)
        return
    if kind in {"model_load_started", "model_load_completed", "complete", "error"}:
        detail = {k: v for k, v in event.items() if k != "type"}
        print(f"[{kind}] {detail}", flush=True)
        return
    print(f"[{kind}]", flush=True)


def write_last_run(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _rewrite_unsloth_fn(fn, replacements: list[tuple[str, str]]) -> int:
    """Replace strings in an Unsloth function and rebind it on its module."""
    import inspect
    import textwrap

    src = textwrap.dedent(inspect.getsource(fn))
    new = src
    applied = 0
    for old, repl in replacements:
        if old in new:
            new = new.replace(old, repl)
            applied += 1
    if new == src:
        return 0
    exec(new, fn.__globals__)
    return applied


def patch_unsloth_for_apple_silicon() -> None:
    """Unsloth's DiT trainer only knows cuda/cpu. On this Mac that means:

    device="cpu" while bitsandbytes still places nf4 weights on MPS, then
    the first step dies with "All tensors must be on MPS device". Dense
    bf16 is also gated as CUDA-only. Rewrite those two assumptions at
    runtime so Flux.2-klein can train on MPS without editing site-packages.
    """
    import torch

    if sys.platform != "darwin" or not torch.backends.mps.is_available():
        return

    import core.training.diffusion_dit_trainer as dit
    import core.training.diffusion_train_common as common

    device_edits = [
        (
            'device = "cuda" if torch.cuda.is_available() else "cpu"',
            'device = "cuda" if torch.cuda.is_available() else '
            '("mps" if torch.backends.mps.is_available() else "cpu")',
        ),
        (
            'weight_dtype = torch.bfloat16 if device == "cuda" else torch.float32',
            'weight_dtype = torch.bfloat16 if device in ("cuda", "mps") else torch.float32',
        ),
    ]
    autocast_edits = [
        (
            'torch.autocast(device_type = "cuda", dtype = torch.bfloat16)\n'
            "        if device == \"cuda\"\n"
            "        else nullcontext()",
            'torch.autocast(device_type = device, dtype = torch.bfloat16)\n'
            '        if device in ("cuda", "mps")\n'
            "        else nullcontext()",
        ),
    ]

    n_run = _rewrite_unsloth_fn(dit.run_dit_lora_training, device_edits)
    n_loop = _rewrite_unsloth_fn(dit._train_dit, autocast_edits)
    if n_run == 0 or n_loop == 0:
        print(
            "warning: Unsloth trainer source changed; MPS patches did not fully apply "
            f"(run={n_run}, loop={n_loop})",
            flush=True,
        )
    else:
        print(
            f"Patched Unsloth DiT trainer for MPS (device/dtype={n_run}, autocast={n_loop})",
            flush=True,
        )

    orig_resolve = dit._resolve_base_precision

    def resolve_base_precision(cfg, spec, device):
        mode = (getattr(cfg, "base_precision", "nf4") or "nf4").strip().lower()
        if mode == "bf16" and device == "mps":
            return "bf16"
        return orig_resolve(cfg, spec, device)

    dit._resolve_base_precision = resolve_base_precision

    orig_preflight = common.training_precision_preflight_error

    def preflight(family, precision):
        err = orig_preflight(family, precision)
        if (
            err
            and "needs a CUDA GPU" in err
            and (precision or "").strip().lower() == "bf16"
            and torch.backends.mps.is_available()
        ):
            return None
        return err

    common.training_precision_preflight_error = preflight


def make_config(args: argparse.Namespace, *, base_model: str, family: str, resume: str | None):
    from core.training.diffusion_train_common import DiffusionLoraConfig

    return DiffusionLoraConfig(
        base_model=base_model,
        data_dir=str(Path(args.data_dir).resolve()),
        output_dir=str(Path(args.output_dir).resolve()),
        instance_prompt=args.instance_prompt,
        resolution=args.resolution,
        train_steps=args.train_steps,
        learning_rate=args.learning_rate,
        train_batch_size=1,
        gradient_accumulation_steps=args.grad_accum,
        lora_rank=args.lora_rank,
        seed=args.seed,
        mixed_precision=args.mixed_precision,
        gradient_checkpointing=True,
        lr_scheduler="constant_with_warmup",
        lr_warmup_steps=20,
        cache_latents=True,
        base_precision=args.base_precision,
        hf_token=args.hf_token
        or os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGING_FACE_HUB_TOKEN"),
        model_family=family or None,
        resume_from_checkpoint=resume,
        save_steps=args.save_steps,
        save_total_limit=2,
        adapter_name="eileenart",
    )


def train(args: argparse.Namespace) -> int:
    from download_base_model import download

    backend = find_studio_backend()
    sys.path.insert(0, str(backend))
    os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

    token = args.hf_token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    data_dir = Path(args.data_dir).resolve()
    if not data_dir.is_dir():
        raise SystemExit(f"Prepared dataset is missing: {data_dir}")

    resume = args.resume_from or None
    if args.resume and not resume:
        checkpoints = sorted(output_dir.glob("checkpoint-*"), key=lambda p: p.stat().st_mtime)
        resume = str(checkpoints[-1]) if checkpoints else None
        print(f"Resuming from {resume}" if resume else "No checkpoint found; starting a fresh run")

    from core.training.diffusion_train_common import get_trainer

    patch_unsloth_for_apple_silicon()

    # One family only. Flux.1 dies on MPS (cpu/mps tensor mismatch). Flux.2-klein
    # trains on this Mac with bf16. Do not fall through to SDXL — that download
    # is what filled the disk on earlier runs.
    family = args.family or "flux.2-klein"
    base_model = args.base_model
    if family == "flux.2-klein" and args.mixed_precision != "bf16":
        print("flux.2-klein needs bf16 on Apple Silicon; overriding mixed_precision", flush=True)
        args.mixed_precision = "bf16"
    if sys.platform == "darwin" and args.base_precision == "nf4":
        print(
            "nf4 bitsandbytes on MPS leaves some tensors on CPU; using dense bf16",
            flush=True,
        )
        args.base_precision = "bf16"

    print(f"Ensuring base model is present: {base_model}")
    download(base_model, token)
    cfg = make_config(args, base_model=base_model, family=family, resume=resume)
    trainer = get_trainer(family)
    print(f"Training {family} LoRA ({args.mixed_precision}) for {args.train_steps} steps from {data_dir}")
    trainer(cfg, on_event=emit)
    used_family = family
    used_base = base_model

    source_dirs = [str(Path(path).resolve()) for path in args.source_dir if path]
    write_last_run(
        output_dir / "last-run.json",
        {
            "data_dir": source_dirs[0] if source_dirs else str(data_dir),
            "data_dirs": source_dirs or [str(data_dir)],
            "prepared_dir": str(data_dir),
            "output_dir": str(output_dir),
            "base_model": used_base,
            "family": used_family,
            "train_steps": args.train_steps,
            "trigger": args.trigger,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    print(f"Done. Adapter directory: {output_dir}")
    return 0


def main() -> int:
    started = time.time()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--source-dir", action="append", default=[])
    parser.add_argument("--base-model", default="black-forest-labs/FLUX.2-klein-base-4B")
    parser.add_argument("--family", default="flux.2-klein")
    parser.add_argument("--instance-prompt", default="eileenart style painting")
    parser.add_argument("--trigger", default="eileenart")
    parser.add_argument("--resolution", type=int, default=512)
    parser.add_argument("--train-steps", type=int, default=800)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--lora-rank", type=int, default=16)
    parser.add_argument("--grad-accum", type=int, default=1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--base-precision",
        default="bf16" if sys.platform == "darwin" else "nf4",
    )
    parser.add_argument(
        "--mixed-precision",
        default="bf16" if sys.platform == "darwin" else "fp16",
    )
    parser.add_argument("--hf-token", default="")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--resume-from", default="")
    parser.add_argument("--save-steps", type=int, default=200)
    args = parser.parse_args()
    code = train(args)
    print(f"Elapsed {time.time() - started:.0f}s")
    return code


if __name__ == "__main__":
    sys.exit(main())
