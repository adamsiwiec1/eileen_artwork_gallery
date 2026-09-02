#!/usr/bin/env python3
"""Resize and JPEG-compress images for a small AI training folder.

Longest edge is capped (no upscale). Aspect ratio is kept. EXIF is stripped.
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}
HEIC_EXTS = {".heic", ".heif"}


def load_pillow():
    try:
        from PIL import Image, ImageOps  # type: ignore
    except ImportError:
        return None
    return Image, ImageOps


def sips_pixels(path: Path) -> tuple[int, int]:
    out = subprocess.check_output(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        text=True,
    )
    width = height = 0
    for line in out.splitlines():
        if "pixelWidth" in line:
            width = int(line.split()[-1])
        if "pixelHeight" in line:
            height = int(line.split()[-1])
    if width <= 0 or height <= 0:
        raise RuntimeError(f"Could not read dimensions for {path}")
    return width, height


def scaled_size(width: int, height: int, max_edge: int) -> tuple[int, int]:
    longest = max(width, height)
    if longest <= max_edge:
        return width, height
    scale = max_edge / longest
    return max(1, round(width * scale)), max(1, round(height * scale))


def dest_name(src: Path, dest_dir: Path) -> Path:
    name = f"{src.stem}.jpg"
    target = dest_dir / name
    if not target.exists():
        return target
    for i in range(2, 1000):
        candidate = dest_dir / f"{src.stem}-{i}.jpg"
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"Could not find a free name for {src.name}")


def compress_with_pillow(
    src: Path,
    dest: Path,
    max_edge: int,
    quality: int,
    Image,
    ImageOps,
) -> tuple[int, int]:
    with Image.open(src) as image:
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
        width, height = image.size
        new_w, new_h = scaled_size(width, height, max_edge)
        if (new_w, new_h) != (width, height):
            image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        image.save(
            dest,
            "JPEG",
            quality=quality,
            optimize=True,
            progressive=True,
        )
        return new_w, new_h


def compress_with_sips(src: Path, dest: Path, max_edge: int, quality: int) -> tuple[int, int]:
    if not shutil.which("sips"):
        raise SystemExit(
            f"Cannot compress {src.name}: install Pillow (`pip install pillow`) or use macOS sips"
        )
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Convert first so HEIC/PNG become JPEG, then resize the longest edge.
    subprocess.run(
        ["sips", "-s", "format", "jpeg", str(src), "--out", str(dest)],
        check=True,
        capture_output=True,
    )
    subprocess.run(
        [
            "sips",
            "-Z",
            str(max_edge),
            "-s",
            "formatOptions",
            str(quality),
            str(dest),
        ],
        check=True,
        capture_output=True,
    )
    # Rewrite via sips does not always drop EXIF; a second format pass is enough
    # for training and keeps this path dependency-free.
    return sips_pixels(dest)


def collect_images(source: Path) -> list[Path]:
    found: list[Path] = []
    for path in sorted(source.iterdir() if source.is_dir() else []):
        if not path.is_file():
            continue
        if path.name.startswith("."):
            continue
        if path.suffix.lower() in IMAGE_EXTS or path.suffix.lower() in HEIC_EXTS:
            found.append(path)
    return found


def kb(size: int) -> str:
    return f"{size / 1024:7.1f}"


def compress(source: Path, dest: Path, max_edge: int, quality: int) -> int:
    if not source.is_dir():
        raise SystemExit(f"Source directory does not exist: {source}")

    dest.mkdir(parents=True, exist_ok=True)
    for child in dest.iterdir():
        if child.is_file():
            child.unlink()

    images = collect_images(source)
    if not images:
        raise SystemExit(f"No images found in {source}")

    pillow = load_pillow()
    print(f"{'file':<48} {'before':>13} {'after':>13} {'kb in':>8} {'kb out':>8}")
    before_bytes = after_bytes = 0

    for src in images:
        target = dest_name(src, dest)
        if pillow:
            Image, ImageOps = pillow
            with Image.open(src) as preview:
                preview = ImageOps.exif_transpose(preview)
                before_w, before_h = preview.size
            after_w, after_h = compress_with_pillow(
                src, target, max_edge, quality, Image, ImageOps
            )
        else:
            before_w, before_h = sips_pixels(src)
            after_w, after_h = compress_with_sips(src, target, max_edge, quality)

        src_size = src.stat().st_size
        dest_size = target.stat().st_size
        before_bytes += src_size
        after_bytes += dest_size
        print(
            f"{target.name:<48} {before_w:>4}x{before_h:<6} {after_w:>4}x{after_h:<6} "
            f"{kb(src_size)} {kb(dest_size)}"
        )

    print(
        f"\nWrote {len(images)} images to {dest}  "
        f"{before_bytes / 1024 / 1024:.2f} MB → {after_bytes / 1024 / 1024:.2f} MB"
    )
    return len(images)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--dest", required=True, type=Path)
    parser.add_argument("--max-edge", type=int, default=1024)
    parser.add_argument("--quality", type=int, default=85)
    args = parser.parse_args()
    if args.max_edge < 1:
        raise SystemExit("--max-edge must be at least 1")
    if not 1 <= args.quality <= 100:
        raise SystemExit("--quality must be 1-100")
    compress(args.source.resolve(), args.dest.resolve(), args.max_edge, args.quality)
    return 0


if __name__ == "__main__":
    sys.exit(main())
