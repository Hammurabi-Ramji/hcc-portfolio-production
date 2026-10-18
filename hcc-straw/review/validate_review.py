"""Validate the frozen review scope, agent coverage and deliverable links."""
from pathlib import Path
from collections import Counter
import json
import re
import sys

ROOT = Path(r'C:\IEDB\STRAW Stack')
GEN = Path(r'C:\IEDB\STRAW SaaS Generator')
REVIEW = ROOT / 'review'
read = lambda name: json.loads((REVIEW / name).read_text(encoding='utf-8-sig'))
registry = [r for r in read('agent-registry.json') if r.get('scope_status', 'active') == 'active']
inventory = read('current-inventory.json')
copies = read('copy-comparison.json')
problems = []

def require(condition, message):
    if not condition:
        problems.append(message)

source = {r['folder'].lower() for r in inventory if r['kind'] == 'source'}
reviewed = {r['folder'].lower() for r in registry}
reviewed.discard(str(GEN).lower())
reviewed.add(str(ROOT / 'apps').lower())
require(source == reviewed, f'Source scope mismatch: missing={source-reviewed}, extra={reviewed-source}')
require(len(registry) == len(source), 'Active registry/current source count mismatch')
for field in ('folder', 'agent_id', 'report'):
    duplicates = [k for k, v in Counter(r.get(field) for r in registry).items() if v > 1]
    require(not duplicates, f'Duplicate {field}: {duplicates}')
for row in registry:
    path = Path(row['report'])
    require(row.get('completed') is True, f'Agent incomplete: {row["index"]}')
    require(path.exists() and path.stat().st_size > 100, f'Missing/empty report: {path}')
    require(bool(row.get('agent_id')), f'Missing agent identity: {row["index"]}')
generated = {r['folder'].lower() for r in inventory if r['kind'] == 'generated-or-copy'}
covered = {r['folder'].lower() for r in copies['folder_coverage']}
require(generated == covered, 'Current copy folder coverage mismatch')

# Validate links in the requested deliverables and evidence index/patch map.
for path in (ROOT / 'to-do.md', GEN / 'to-do.md', REVIEW / 'README.md', REVIEW / 'patch-plan.md'):
    body = path.read_text(encoding='utf-8-sig')
    if path.name == 'to-do.md':
        require('**Folder review complete.**' in body, f'Incomplete deliverable: {path}')
        require('report is pending' not in body, f'Pending review in {path}')
    for match in re.finditer(r'\[[^\]]+\]\((<[^>]+>|[^\s)]+)\)', body):
        target = match.group(1).strip('<>')
        if re.match(r'^(https?://|#|mailto:)', target):
            continue
        target = target.split('#')[0]
        linked = Path(target)
        if not linked.is_absolute():
            linked = path.parent / linked
        require(linked.exists(), f'Broken link in {path}: {target}')

result = {'registry_reviewers': len(registry), 'source_nested_folders': len(source),
          'total_folder_reviews': len(registry) + 2, 'copied_nested_folders': len(covered),
          'problems': problems, 'passed': not problems}
(REVIEW / 'review-validation.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result, indent=2))
sys.exit(bool(problems))
