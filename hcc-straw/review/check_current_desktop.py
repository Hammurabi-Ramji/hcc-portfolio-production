from pathlib import Path
import shutil, subprocess, json, hashlib, datetime
root=Path(r'C:\IEDB\STRAW Stack'); source=root/'straw-app'; review=root/'review'; fixture=review/'current-desktop-fixture'; fixture.mkdir(exist_ok=True)
crates=('engine','axum-loop','wasm-frontend')
fingerprints={}
for name in crates:
 src=source/'crates'/name; dst=fixture/'crates'/name
 shutil.copytree(src,dst,dirs_exist_ok=True,ignore=shutil.ignore_patterns('target','.git'))
 for p in src.rglob('*'):
  if p.is_file() and 'target' not in p.parts:fingerprints[p.relative_to(source).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
manifest=(source/'Cargo.toml').read_text();a=manifest.index('members =');b=manifest.index('[workspace.dependencies]');manifest=manifest[:a]+'members = ["crates/engine", "crates/axum-loop", "crates/wasm-frontend"]\n\n'+manifest[b:]
(fixture/'Cargo.toml').write_text(manifest)
metadata={'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Isolated copied current engine, Axum and WASM crates; excludes Tauri/frontend compiler; fixture lockfile may resolve offline without modifying source lockfile.','source_sha256':fingerprints}
(review/'desktop-current-check-snapshot.json').write_text(json.dumps(metadata,indent=2))
with (review/'desktop-current-core-tests.log').open('w') as log:
 run=subprocess.run([r'C:\Users\hammu\.cargo\bin\cargo.exe','test','--workspace','--offline'],cwd=fixture,stdout=log,stderr=subprocess.STDOUT)
metadata['exit_code']=run.returncode
(review/'desktop-current-check-snapshot.json').write_text(json.dumps(metadata,indent=2))
print('Current isolated core crate tests exit',run.returncode)
print((review/'desktop-current-core-tests.log').read_text(errors='replace')[-5000:])
