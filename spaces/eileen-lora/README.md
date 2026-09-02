---
title: Eileen Style LoRA
emoji: 🎨
colorFrom: yellow
colorTo: pink
sdk: gradio
sdk_version: 5.49.1
app_file: app.py
python_version: "3.12"
startup_duration_timeout: 30m
pinned: false
short_description: Flux.2-klein LoRA of Eileen's paintings
---

# Eileen style LoRA

Flux.2-klein plus the LoRA trained from Eileen's paintings. Trigger word: `eileenart`.

The Space loads `lora/pytorch_lora_weights.safetensors` from this repo. Optional secrets:

- `EILEEN_LORA_REPO` — override and load a Hub model repo instead of the bundled adapter
- `EILEEN_BASE_MODEL` — default `black-forest-labs/FLUX.2-klein-base-4B`
- `HF_TOKEN` — required if the base model is gated

Hardware: **ZeroGPU**. The gallery Studio calls `/gradio_api/call/generate`.
