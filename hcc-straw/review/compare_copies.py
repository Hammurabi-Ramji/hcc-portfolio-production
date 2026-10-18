"""Audit generated copies without modifying source or generated bundles."""
from pathlib import Path
import hashlib
import json

ROOT = Path(r'C:\IEDB\STRAW Stack')
GEN = Path(r'C:\IEDB\STRAW SaaS Generator')
IGNORE = {'node_modules', 'target', 'dist', '.git', '.next', '.svelte-kit', '__pycache__'}

def files(folder):
    return {p.relative_to(folder).as_posix(): p for p in folder.rglob('*')
            if p.is_file() and not IGNORE.intersection(p.relative_to(folder).parts)}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

inventory = json.loads((ROOT / 'review/current-inventory.json').read_text(encoding='utf-8-sig'))
bundles = []
folder_coverage = []
for area in ('templates', 'output'):
    for template in sorted((GEN / area).iterdir()):
        if not template.is_dir():
            continue
        container = template / 'src' if area == 'output' else template
        manifest = json.loads((template / 'manifest.json').read_text())
        listed = manifest.get('active_components', manifest.get('bundled_components', []))
        actual = [p.name for p in container.iterdir() if p.is_dir() and p.name not in IGNORE]
        records = []
        for name in sorted(set(listed) | set(actual)):
            source, copied = GEN / 'components' / name, container / name
            original = files(source) if source.exists() else {}
            replica = files(copied) if copied.exists() else {}
            added = sorted(replica.keys() - original.keys())
            missing = sorted(original.keys() - replica.keys())
            changed = sorted(k for k in original.keys() & replica.keys()
                             if digest(original[k]) != digest(replica[k]))
            records.append({'component': name, 'source': str(source), 'copy': str(copied),
                            'file_count': len(replica), 'added': added, 'missing': missing,
                            'changed': changed, 'matches_source': not (added or missing or changed),
                            'source_exists': source.exists(), 'copy_exists': copied.exists()})
        bundles.append({'area': area, 'template': template.name, 'manifest': str(template / 'manifest.json'),
                        'manifest_status': manifest.get('status'), 'listed': listed, 'actual': actual,
                        'missing_listed_directories': sorted(set(listed)-set(actual)),
                        'unlisted_directories': sorted(set(actual)-set(listed)),
                        'build_entrypoints': [n for n in ('Cargo.toml', 'package.json', 'src/main.rs')
                                             if (template / n).exists()], 'components': records})

for row in inventory:
    if row['kind'] != 'generated-or-copy':
        continue
    folder = Path(row['folder'])
    relative = folder.relative_to(Path(row['root']))
    if row['root'] == str(GEN):
        parts = relative.parts
        offset = 3 if parts[0] == 'output' else 2
        if len(parts) > offset:
            source = GEN / 'components' / Path(*parts[offset:])
            before, after = files(source) if source.exists() else {}, files(folder)
            changes = sorted(k for k in before.keys() & after.keys() if digest(before[k]) != digest(after[k]))
            folder_coverage.append({'folder': str(folder), 'source_folder': str(source),
                                    'comparison': 'source tree', 'changed_files': changes,
                                    'missing_files': sorted(before.keys()-after.keys()),
                                    'extra_files': sorted(after.keys()-before.keys())})
        else:
            folder_coverage.append({'folder': str(folder), 'comparison': 'bundle structure and manifest',
                                    'child_folders': sorted(p.name for p in folder.iterdir() if p.is_dir())})
    else:
        folder_coverage.append({'folder': str(folder), 'comparison': 'build/test artifact inventory',
                                'file_count': len(files(folder)),
                                'note': 'Generated build or test artifact; runtime freshness requires rebuild/test. No byte-equivalent source directory.'})

frontend_path = ROOT / 'review/frontend-copy-comparison.json'
if frontend_path.exists():
    frontend = json.loads(frontend_path.read_text())
    if frontend.get('exit_code') == 0:
        frontend_root = ROOT / 'straw-app/public/ui'
        for row in folder_coverage:
            folder = Path(row['folder'])
            if folder == frontend_root or frontend_root in folder.parents:
                prefix = folder.relative_to(frontend_root).as_posix()
                selected = [f for f in frontend['files'] if prefix == '.' or f['relative'].startswith(prefix + '/')]
                row.update(comparison='isolated clean native compiler output',
                           comparison_record='frontend-copy-comparison.json',
                           compared_files=len(selected),
                           mismatches=[f['relative'] for f in selected if not f['matches_clean_build']])

components = [r for b in bundles for r in b['components']]
summary = {'date': '2026-10-09', 'bundle_count': len(bundles), 'component_copy_count': len(components),
           'matching_component_copies': sum(r['matches_source'] for r in components),
           'drifted_component_copies': sum(not r['matches_source'] for r in components),
           'compared_nested_folders': len(folder_coverage),
           'generated_entrypoints_present': sum(bool(b['build_entrypoints']) for b in bundles),
           'bundles': bundles, 'folder_coverage': folder_coverage}
(ROOT / 'review/copy-comparison.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
print(json.dumps({k: v for k,v in summary.items() if k not in ('bundles', 'folder_coverage')}, indent=2))
for b in bundles:
    print(f"{b['area']}/{b['template']}: {len(b['components'])} components, "
          f"{sum(not r['matches_source'] for r in b['components'])} drifted, entrypoints={b['build_entrypoints']}")
