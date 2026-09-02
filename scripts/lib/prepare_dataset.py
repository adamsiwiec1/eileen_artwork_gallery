#!/usr/bin/env python3
"""Flatten training folders into Unsloth's image+caption layout.

Accepts one or more --source directories and rebuilds the dest folder from
them. Skips `excluded/` directories and `*copy*` filenames. Converts HEIC
with `sips` on macOS.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
HEIC_EXTS = {".heic", ".heif"}
SKIP_DIR_NAMES = {"excluded", ".git", "node_modules", "__pycache__"}


def is_copy_name(name: str) -> bool:
    stem = Path(name).stem.lower()
    return " copy" in f" {stem}" or stem.endswith("copy") or stem.endswith("copy2")


def should_skip_dir(path: Path) -> bool:
    return any(part.lower() in SKIP_DIR_NAMES for part in path.parts)


def unique_name(dest_dir: Path, filename: str) -> str:
    target = dest_dir / filename
    if not target.exists():
        return filename
    stem, suffix = Path(filename).stem, Path(filename).suffix
    for i in range(2, 1000):
        candidate = f"{stem}-{i}{suffix}"
        if not (dest_dir / candidate).exists():
            return candidate
    raise RuntimeError(f"Could not find a free name for {filename}")


def convert_heic(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if shutil.which("sips"):
        subprocess.run(
            ["sips", "-s", "format", "jpeg", str(src), "--out", str(dest)],
            check=True,
            capture_output=True,
        )
        return
    try:
        from PIL import Image  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            f"Cannot convert {src.name}: install macOS sips or `pip install pillow`"
        ) from exc
    Image.open(src).convert("RGB").save(dest, "JPEG", quality=92)


def collect_images(source: Path) -> list[Path]:
    found: list[Path] = []
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        if should_skip_dir(path.relative_to(source)):
            continue
        if is_copy_name(path.name):
            continue
        suffix = path.suffix.lower()
        if suffix in IMAGE_EXTS or suffix in HEIC_EXTS:
            found.append(path)
    return found


def caption_text(src: Path, source: Path, trigger: str) -> str:
    rel = src.relative_to(source)
    haystack = f"{source.name} {' '.join(rel.parts)}".lower()
    hint = "portrait of the artist" if "eileen" in haystack else "original artwork"
    return f"{trigger} style painting, {hint}"


def write_captions(dest: Path, rows: list[tuple[str, str]]) -> Path:
    captions = dest / "captions.jsonl"
    with captions.open("w", encoding="utf-8") as fh:
        for name, text in rows:
            fh.write(json.dumps({"file_name": name, "text": text}, ensure_ascii=False) + "\n")
    return captions


def reset_dest(dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for child in dest.iterdir():
        if child.is_file():
            child.unlink()


def prepare(sources: list[Path], dest: Path, trigger: str) -> int:
    missing = [str(source) for source in sources if not source.is_dir()]
    if missing:
        raise SystemExit(f"Training directory does not exist: {', '.join(missing)}")

    reset_dest(dest)
    written: list[tuple[str, str]] = []

    for source in sources:
        images = collect_images(source)
        for src in images:
            suffix = src.suffix.lower()
            if suffix in HEIC_EXTS:
                jpeg_sibling = src.with_suffix(".jpeg")
                jpg_sibling = src.with_suffix(".jpg")
                if jpeg_sibling.exists() or jpg_sibling.exists():
                    continue
                name = unique_name(dest, f"{src.stem}.jpeg")
                convert_heic(src, dest / name)
            else:
                name = unique_name(dest, src.name)
                shutil.copy2(src, dest / name)
            written.append((name, caption_text(src, source, trigger)))

    if not written:
        joined = ", ".join(str(source) for source in sources)
        raise SystemExit(f"No usable images under {joined} (excluded/ and *copy* are skipped)")

    write_captions(dest, written)
    print(f"Prepared {len(written)} images from {len(sources)} folder(s) in {dest}")
    return len(written)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", action="append", required=True, type=Path)
    parser.add_argument("--dest", required=True, type=Path)
    parser.add_argument("--trigger", default="eileenart")
    args = parser.parse_args()
    prepare([path.resolve() for path in args.source], args.dest.resolve(), args.trigger)
    return 0


if __name__ == "__main__":
    sys.exit(main())
