"""ZeroGPU Gradio Space: Flux.2-klein + the Eileen style LoRA."""

from __future__ import annotations

import os
from pathlib import Path

import spaces
import torch
import gradio as gr
from diffusers import Flux2KleinPipeline

BASE_MODEL = os.environ.get("EILEEN_BASE_MODEL", "black-forest-labs/FLUX.2-klein-base-4B")
LORA_REPO = os.environ.get("EILEEN_LORA_REPO", "ukryty/eileenart-lora").strip()
TRIGGER = os.environ.get("EILEEN_TRIGGER", "eileenart")
LOCAL_LORA = Path(__file__).resolve().parent / "lora"

pipe = Flux2KleinPipeline.from_pretrained(BASE_MODEL, torch_dtype=torch.bfloat16)
if LORA_REPO:
    pipe.load_lora_weights(LORA_REPO)
elif (LOCAL_LORA / "pytorch_lora_weights.safetensors").is_file():
    pipe.load_lora_weights(str(LOCAL_LORA))
pipe.to("cuda")


@spaces.GPU(duration=90)
def generate(prompt: str, seed: int, steps: int, guidance: float):
    text = prompt if TRIGGER in prompt else f"{TRIGGER} {prompt}"
    generator = torch.Generator("cuda").manual_seed(int(seed))
    image = pipe(
        text,
        num_inference_steps=int(steps),
        guidance_scale=float(guidance),
        generator=generator,
    ).images[0]
    return image


with gr.Blocks(title="Eileen style LoRA") as demo:
    gr.Markdown("# Eileen style LoRA")
    prompt = gr.Textbox(
        label="Prompt",
        value=f"{TRIGGER} oil painting of a quiet harbor at dusk",
    )
    seed = gr.Number(label="Seed", value=42, precision=0)
    steps = gr.Slider(4, 28, value=8, step=1, label="Steps")
    guidance = gr.Slider(1.0, 7.0, value=4.0, step=0.1, label="Guidance")
    output = gr.Image(type="pil", label="Painting")
    button = gr.Button("Generate")
    button.click(
        generate,
        inputs=[prompt, seed, steps, guidance],
        outputs=output,
        api_name="generate",
    )

if __name__ == "__main__":
    demo.launch()
