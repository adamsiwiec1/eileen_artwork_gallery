# RunPod GitHub import looks for ./Dockerfile on main.
# Build context is the repo root (see .dockerignore).
#
# Official RunPod PyTorch 2.8 + CUDA 12.8 + Python 3.11 (Docker Hub tag exists).
# There is no slimmer official runpod/pytorch runtime tag for this stack —
# the only "runtime" tag is 3.10-2.0.1-118-runtime (2023). This devel image
# is ~10 GB compressed and can strain GitHub-hosted runners; the workflow
# frees disk before the pull.
FROM runpod/pytorch:2.8.0-py3.11-cuda12.8.1-cudnn-devel-ubuntu22.04

LABEL org.opencontainers.image.source=https://github.com/adamsiwiec1/eileen_artwork_gallery
LABEL org.opencontainers.image.description="RunPod serverless worker for the Eileen LoRA"

WORKDIR /

COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt

COPY handler.py /handler.py

ENV PYTHONUNBUFFERED=1
ENV EILEEN_BASE_MODEL=black-forest-labs/FLUX.2-klein-base-4B
ENV EILEEN_LORA_REPO=ukryty/eileenart-lora
ENV EILEEN_TRIGGER=eileenart
ENV EILEEN_STEPS=8
ENV EILEEN_GUIDANCE=4.0

CMD ["python", "-u", "/handler.py"]
