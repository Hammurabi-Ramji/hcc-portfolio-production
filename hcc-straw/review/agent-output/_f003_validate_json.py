import json
from pathlib import Path

root = Path(r"C:\IEDB\STRAW Stack\apps\web")
for name in ["package.json", "package-lock.json", "tsconfig.json"]:
    path = root / name
    try:
        json.loads(path.read_text(encoding="utf-8"))
        print(f"{name}: OK")
    except Exception as exc:
        print(f"{name}: FAIL {exc}")
