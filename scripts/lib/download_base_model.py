#!/usr/bin/env python3
"""Download a Hugging Face diffusion pipeline if it is not already cached."""

from __future__ import annotations

import argparse
import os
import sys


def download(repo_id: str, token: str | None) -> str:
    from huggingface_hub import snapshot_download

    try:
        path = snapshot_download(
            repo_id,
            local_files_only=True,
            token=token,
        )
        print(f"Base model already cached: {repo_id}\n  {path}")
        return path
    except Exception:
        pass

    print(f"Downloading {repo_id} (one-time; reused from the Hugging Face cache)...")
    try:
        path = snapshot_download(repo_id, token=token)
    except Exception as exc:  # noqa: BLE001 — Hub errors vary by huggingface_hub version
        message = str(exc)
        if "gated" in message.lower() or "401" in message or "403" in message:
            raise SystemExit(
                f"{repo_id} is gated. Accept the license, then run: hf auth login\n"
                f"  https://huggingface.co/{repo_id}\n{exc}"
            ) from exc
        raise SystemExit(f"Failed to download {repo_id}: {exc}") from exc

    print(f"Downloaded {repo_id}\n  {path}")
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--token", default=os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN"))
    args = parser.parse_args()
    download(args.repo, args.token)
    return 0


if __name__ == "__main__":
    sys.exit(main())
