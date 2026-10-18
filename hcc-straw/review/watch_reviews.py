"""Keep the two requested task lists current while folder agents finish."""
from pathlib import Path
import json
import subprocess
import sys
import time

ROOT = Path(r'C:\IEDB\STRAW Stack\review')
seen = set()
first = True
while True:
    try:
        registry = [r for r in json.loads((ROOT / 'agent-registry.json').read_text(encoding='utf-8-sig')) if r.get('scope_status', 'active') == 'active']
    except (json.JSONDecodeError, OSError):
        time.sleep(1)
        continue
    saved = [r for r in registry if Path(r['report']).exists()]
    current = {r['report'] for r in saved}
    newly = [r for r in saved if r['report'] not in seen]
    if current != seen:
        run = subprocess.run([sys.executable, str(ROOT / 'refresh_todos.py')],
                             capture_output=True, text=True)
        print(run.stdout.strip(), flush=True)
        if run.returncode:
            print(run.stderr, flush=True)
            break
        if not first:
            for row in newly:
                content = Path(row['report']).read_text(encoding='utf-8-sig')
                lines = [line for line in content.splitlines()
                         if ('P1' in line or 'P2' in line) and not line.startswith('- [ ]')]
                summary = lines[0] if lines else 'Folder inventory and patch/acceptance report saved.'
                print(f"NEW {row['relative']}: {summary[:450]}", flush=True)
        seen = current
        first = False
    if len(saved) == len(registry) and all(r.get('completed') for r in registry):
        subprocess.run([sys.executable, str(ROOT / 'refresh_todos.py')], check=True)
        print('All current dedicated folder agents completed and both task lists refreshed.', flush=True)
        break
    time.sleep(2)
