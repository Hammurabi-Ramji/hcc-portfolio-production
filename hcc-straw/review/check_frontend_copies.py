from pathlib import Path
import shutil, subprocess, json, hashlib
root=Path(r'C:\IEDB\STRAW Stack'); source=root/'straw-app'; review=root/'review'; fixture=review/'frontend-build-fixture'; fixture.mkdir(exist_ok=True)
for name in ('tools/frontend-build','ui','third-party'):
 shutil.copytree(source/name,fixture/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('target','.git'))
for name in ('index.html','Cargo.lock'):shutil.copy2(source/name,fixture/name)
manifest=(source/'Cargo.toml').read_text(encoding='utf-8');a=manifest.index('members =');b=manifest.index('[workspace.dependencies]');manifest=manifest[:a]+'members = ["tools/frontend-build"]\n\n'+manifest[b:]
(fixture/'Cargo.toml').write_text(manifest,encoding='utf-8')
with (review/'frontend-clean-build.log').open('w') as log:
 run=subprocess.run([r'C:\Users\hammu\.cargo\bin\cargo.exe','run','--offline','--package','frontend-build'],cwd=fixture,stdout=log,stderr=subprocess.STDOUT)
result={'exit_code':run.returncode,'scope':'Isolated compiler/UI/vendor copy; no saved production browser modules regenerated','files':[]}
if run.returncode==0:
 for p in sorted((fixture/'public/ui').rglob('*')):
  if p.is_file():
   rel=p.relative_to(fixture/'public/ui'); copied=source/'public/ui'/rel
   result['files'].append({'relative':rel.as_posix(),'production_exists':copied.exists(),'matches_clean_build':copied.exists() and p.read_bytes()==copied.read_bytes()})
 result['extra_production_files']=sorted(p.relative_to(source/'public/ui').as_posix() for p in (source/'public/ui').rglob('*') if p.is_file() and not (fixture/'public/ui'/p.relative_to(source/'public/ui')).exists())
(review/'frontend-copy-comparison.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('Frontend clean build exit',run.returncode,'compared',len(result['files']),'modules; mismatches',sum(not f['matches_clean_build'] for f in result['files']))
print((review/'frontend-clean-build.log').read_text(errors='replace')[-2000:])
