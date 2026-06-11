#!/usr/bin/env python3
"""Install SUE native messaging host manifest for Chrome/Edge on Windows."""

from __future__ import annotations

import json
import os
from pathlib import Path

HOST_NAME = "com.hammurabi.sue.nativehost"


def build_manifest(host_script: Path, extension_id: str) -> dict:
    return {
        "name": HOST_NAME,
        "description": "SUE Native Host",
        "path": str(host_script),
        "type": "stdio",
        "allowed_origins": [f"chrome-extension://{extension_id}/"],
    }


def main() -> None:
    extension_id = os.environ.get("SUE_EXTENSION_ID", "YOUR_EXTENSION_ID")
    workspace = Path(__file__).resolve().parents[1]
    host_script = workspace / "native-host" / "host.py"
    manifest_path = workspace / "config" / "host-manifest.generated.json"

    manifest = build_manifest(host_script, extension_id)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("Generated manifest:", manifest_path)
    print("Next step: register this manifest path in Windows registry for Chrome/Edge.")


if __name__ == "__main__":
    main()
