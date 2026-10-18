"""Evidence probes for the generator, using an isolated fixture only."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(r'C:\IEDB\STRAW Stack\review')
GEN = Path(r'C:\IEDB\STRAW SaaS Generator')
spec = importlib.util.spec_from_file_location('review_controller', GEN / 'core/controller.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def output_hashes():
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in (GEN / 'output').rglob('*') if p.is_file()}

results = []
for flags in ([], ['--help'], ['--list-templates'], ['--list-components'],
              ['--all', '--template', 'healthcare_saas'], ['--components', 'auth_system']):
    before = output_hashes()
    run = subprocess.run([sys.executable, str(GEN / 'core/controller.py'), *flags],
                         capture_output=True, text=True, cwd=GEN)
    results.append({'probe': 'CLI ' + ' '.join(flags or ['<no args>']),
                    'returncode': run.returncode, 'live_output_unchanged': before == output_hashes(),
                    'stdout': run.stdout, 'stderr': run.stderr})

fixture = ROOT / 'controller-fixture'
(fixture / 'core').mkdir(parents=True, exist_ok=True)
(fixture / 'components/auth_system').mkdir(parents=True, exist_ok=True)
(fixture / 'components/frontend_svelte').mkdir(parents=True, exist_ok=True)
(fixture / 'components/auth_system/lib.rs').write_text('// isolated probe component\n')
config = json.loads((GEN / 'core/config.json').read_text())
config['base_path'] = str(fixture)
config_path = fixture / 'core/config.json'
config_path.write_text(json.dumps(config))
controller = module.SaaSController(config_path)
with contextlib.redirect_stdout(io.StringIO()):
    target = controller.generate_saas('healthcare_saas', ['auth_system', 'auth_system',
                                      'frontend_svelte', 'unknown_component'])
manifest = json.loads((target / 'manifest.json').read_text())
results.append({'probe': 'missing implementation and unknown component reporting',
                'manifest': manifest, 'placeholder_created': (target / 'src/frontend_svelte/README.md').exists(),
                'placeholder_reported_missing': 'frontend_svelte' in manifest['missing_components'],
                'build_manifest_present': (target / 'Cargo.toml').exists() or (target / 'package.json').exists(),
                'deduplicated': manifest['active_components'].count('auth_system') == 1})
try:
    controller.generate_saas('unknown_template')
except ValueError as exc:
    results.append({'probe': 'unknown template rejection', 'rejected': True, 'message': str(exc)})
results.append({'probe': 'default template mapping', 'configured_templates': len(controller.list_templates()),
                'configured_components': len(controller.list_components()),
                'not_in_any_default': sorted(set(controller.list_components()) -
                    {c for t in controller.list_templates() for c in controller.get_template_defaults(t)}),
                'unknown_defaults': sorted({c for t in controller.list_templates()
                                           for c in controller.get_template_defaults(t)} -
                                           set(controller.list_components()))})
(ROOT / 'controller-checks.json').write_text(json.dumps(results, indent=2))
for result in results:
    print(json.dumps({k: v for k,v in result.items() if k not in ('stdout', 'stderr', 'message')}))
