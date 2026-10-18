"""Reconcile the current tree after the user-authorized desktop snapshot change."""
from pathlib import Path
import json
import os

STACK = Path(r'C:\IEDB\STRAW Stack')
GEN = Path(r'C:\IEDB\STRAW SaaS Generator')
REVIEW = STACK / 'review'
original = json.loads((REVIEW / 'inventory.json').read_text(encoding='utf-8-sig'))
registry = json.loads((REVIEW / 'agent-registry.json').read_text(encoding='utf-8-sig'))
original_map = {r['folder'].lower(): r for r in original}
ignore = {'.git', 'node_modules', 'target', 'dist', '.next', '.svelte-kit', '__pycache__', 'review'}
rows = []
for root in (STACK, GEN):
    for directory, dirs, files in os.walk(root):
        folder = Path(directory)
        dirs[:] = [d for d in dirs if d not in ignore]
        # Third-party originals are dependencies; the direct NOTICE remains authored scope.
        if folder == STACK / 'straw-app/third-party':
            dirs[:] = []
        if folder == root:
            continue
        relative = folder.relative_to(root).as_posix()
        previous = original_map.get(str(folder).lower())
        generated = ((root == GEN and relative.startswith(('output/', 'templates/')))
                     or relative.startswith('straw-app/public/ui'))
        kind = 'generated-or-copy' if generated else (previous['kind'] if previous else 'source')
        rows.append({'root': str(root), 'folder': str(folder), 'relative': relative,
                     'kind': kind, 'directFiles': sorted(files)})
current_source = {r['folder'].lower(): r for r in rows if r['kind'] == 'source'}
for entry in registry:
    entry['scope_status'] = ('active' if entry['folder'].lower() in current_source
                             or entry['folder'] == str(GEN) else 'removed')
known = {r['folder'].lower() for r in registry} | {str(STACK / 'apps').lower()}
next_index = max(r['index'] for r in registry) + 1
for key, row in sorted(current_source.items()):
    if key in known:
        continue
    name = 'stack--' + row['relative'].replace('/', '--')
    registry.append({'index': next_index, 'folder': row['folder'], 'relative': row['relative'],
                     'task_name': f'/root/review_{next_index:03d}',
                     'report': str(REVIEW / 'folders' / (name + '.md')),
                     'completed': False, 'agent_id': None, 'scope_status': 'active'})
    next_index += 1
current_keys = set(current_source)
old_source = {r['folder'].lower(): r for r in original if r['kind'] == 'source'}
delta = {'decision': 'User requested current replacement tree; original audit retained as history.',
         'added': [current_source[k] for k in sorted(current_keys - old_source.keys())],
         'removed': [old_source[k] for k in sorted(old_source.keys() - current_keys)],
         'direct_file_names_changed': [dict(folder=current_source[k]['folder'],
              old=old_source[k]['directFiles'], current=current_source[k]['directFiles'])
              for k in sorted(current_keys & old_source.keys())
              if sorted(old_source[k]['directFiles']) != sorted(current_source[k]['directFiles'])]}
for name, value in [('current-inventory.json', rows), ('tree-transition.json', delta),
                    ('agent-registry.json', registry)]:
    temporary = REVIEW / (name + '.tmp')
    temporary.write_text(json.dumps(value, indent=2), encoding='utf-8')
    os.replace(temporary, REVIEW / name)
print(json.dumps({'current_source_nested': len(current_source),
                  'active_registry': sum(r['scope_status']=='active' for r in registry),
                  'removed_original_folders': len(delta['removed']),
                  'added_source_folders': len(delta['added'])}, indent=2))
for row in registry:
    if row['index'] >= 134:
        print(row['index'], row['relative'])
