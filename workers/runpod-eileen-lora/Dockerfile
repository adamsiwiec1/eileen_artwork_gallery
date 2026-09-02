# Build from the repo root:
#   docker build -f workers/runpod-eileen-lora/Dockerfile .
# GitHub deploy: Dockerfile path = workers/runpod-eileen-lora/Dockerfile
FROM runpod/pytorch:2.8.0-py3.11-cuda12.8.1-cudnn-devel-ubuntu22.04

WORKDIR /app

COPY workers/runpod-eileen-lora/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY workers/runpod-eileen-lora/handler.py /app/handler.py

ENV PYTHONUNBUFFERED=1
ENV EILEEN_BASE_MODEL=black-forest-labs/FLUX.2-klein-base-4B
ENV EILEEN_LORA_REPO=ukryty/eileenart-lora
ENV EILEEN_TRIGGER=eileenart
ENV EILEEN_STEPS=8
ENV EILEEN_GUIDANCE=4.0

CMD ["python", "-u", "/app/handler.py"]
