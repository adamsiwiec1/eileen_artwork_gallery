# RunPod GitHub import looks for ./Dockerfile on main.
# Build context is the repo root.
FROM runpod/pytorch:2.8.0-py3.11-cuda12.8.1-cudnn-devel-ubuntu22.04

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
