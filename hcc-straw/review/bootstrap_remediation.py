from pathlib import Path
import json,re,shutil
root=Path(r'C:\IEDB\STRAW Stack'); review=root/'review'; prompts=root/'prompts'; prompts.mkdir(exist_ok=True)
request=Path(r'C:\Users\hammu\.codex\attachments\1b24bf27-f35e-485d-8fc1-b8c14549f699\Pasted text.txt').read_text(encoding='utf-8-sig')
(review/'remediation-request.md').write_text(request,encoding='utf-8')
sections=[('dispatcher.md','File 1 — prompts/dispatcher.md','File 2 — prompts/subagent-template.md'),('subagent-template.md','File 2 — prompts/subagent-template.md','File 3 — prompts/roster.md'),('roster.md','File 3 — prompts/roster.md',None)]
for name,start,end in sections:
 body=request.split(start,1)[1];body=body.split(end,1)[0] if end else body;body=body.strip();body=body.removeprefix('markdown').strip();(prompts/name).write_text(body+'\n',encoding='utf-8')
for name in ('agent-output','remediation-baseline'):(review/name).mkdir(exist_ok=True)
(review/'remediation-baseline/to-do.md').write_bytes((root/'to-do.md').read_bytes())
wave0={2,20,22,23,26,27,28,30,45,47,52}
wave1={6,7,8,9,19,21,24,31,32,33,34,35,36,42,43,44,48,49,50}
wave2={4,5,10,11,12,13,14,15,16,17,18,25}
wave3={3,29,37,38,39,40,41,46,51}
rows=[]
todo=(root/'to-do.md').read_text(encoding='utf-8')
for match in re.finditer(r'### STACK-F(\d+) · `([^`]+)`\n(.*?)(?=\n### |\n## |\Z)',todo,re.S):
 number=int(match[1]);rel=match[2];body=match[3];link=re.search(r'\[Evidence, expected behavior and patch details\]\(([^)]+)\)',body)
 report=(root/link[1].strip('<>')) if link else review/'stack-root-review.md'
 agent=f'A-F{number:03d}';wave=0 if number in wave0 else 1 if number in wave1 else 2 if number in wave2 else 3 if number in wave3 else 4
 rows.append({'agent':agent,'folder':str(root/rel),'relative':rel,'report':str(report),'wave':wave,'depends_on':[],'shared_files':[],'state':'PLANNED','status':None,'kind':'folder'})
for number,wave in [(3,1),(4,3),(13,2),(14,4),(15,4),(16,4),(17,4),(18,4)]:
 rows.append({'agent':f'A-S{number:02d}','folder':str(root),'relative':f'cross-task S{number:02d}','report':str(root/'to-do.md'),'wave':wave,'depends_on':[],'shared_files':[],'state':'PLANNED','status':None,'kind':'cross-task'})
rows.append({'agent':'A-CMP','folder':str(root),'relative':'generated/copied comparison','report':str(review/'copy-comparison.json'),'wave':0,'depends_on':[],'shared_files':[],'state':'PLANNED','status':None,'kind':'comparator'})
by={r['agent']:r for r in rows}
deps={
'A-F021':['A-F026','A-F027'],'A-F024':['A-F021','A-F026'],'A-F007':['A-F021','A-F026'],
'A-F009':['A-F007'],'A-F008':['A-F007','A-F009'],'A-F006':['A-F007'],
'A-F019':['A-F007','A-F024','A-F020'],'A-S03':['A-F021','A-F024','A-F019','A-F006','A-F008','A-F009','A-F026','A-F020'],
'A-F035':['A-F034'],'A-F036':['A-F035'],'A-F033':['A-F032'],'A-F050':['A-F047','A-F049'],'A-F044':['A-F043'],
'A-S13':['A-S03','A-F019','A-F020'],'A-F004':['A-S13'],'A-F014':['A-F016'],
'A-F037':['A-F036'],'A-F038':['A-F037'],'A-F039':['A-F050'],'A-F046':['A-F035','A-F036'],'A-F041':['A-F046','A-F050','A-F038'],
'A-F051':['A-F046','A-F036'],'A-F029':['A-F050','A-F041'],'A-F003':['A-S04','A-S13'],
'A-S04':['A-F007','A-F008','A-F009','A-F019','A-F021','A-F024','A-F004'],
}
for r in rows:
 if r['wave']==2 and r['agent']!='A-S13':r['depends_on']=['A-S03','A-F019','A-F021','A-F024','A-F026']
for agent,dependencies in deps.items():by[agent]['depends_on']=list(dict.fromkeys(by[agent]['depends_on']+dependencies))
for agent in ('A-S14','A-S15','A-S16','A-S17','A-S18','A-F001'):
 by[agent]['depends_on']=[r['agent'] for r in rows if r['wave']<4]
by['A-F047']['shared_files']=['straw-app/tools/frontend-build/src/main.rs']
by['A-F031']['shared_files']=['straw-app/Cargo.toml']
by['A-F007']['shared_files']=['apps/api/**']
by['A-F009']['shared_files']=['apps/api/src/users.rs','apps/api/src/lib.rs']
by['A-F008']['shared_files']=['apps/api/src/projects.rs','apps/api/src/lib.rs']
by['A-S03']['shared_files']=['apps/web/package.json','apps/web/package-lock.json','apps/web/middleware.ts','apps/web/next.config.js','apps/web/postcss.config.js','apps/web/.eslintrc.js','apps/web/eslint.config.mjs','apps/web/tsconfig.json']
by['A-S13']['shared_files']=['apps/web/app/layout.tsx','apps/web/app/globals.css','apps/web/tailwind.config.js']
# Reject unknown/cyclic dependencies before dispatch.
visiting=set();visited=set()
def visit(agent):
 if agent in visiting:raise RuntimeError('dependency cycle: '+agent)
 if agent in visited:return
 visiting.add(agent)
 for dependency in by[agent]['depends_on']:visit(dependency)
 visiting.remove(agent);visited.add(agent)
for agent in by:visit(agent)
(review/'remediation-registry.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
(review/'settlement-ledger.jsonl').touch(exist_ok=True)
(review/'arbitration.md').write_text('''# Remediation arbitration and decisions

User decisions2026-10-09:
- Separate local Rust/Axum web API service with SQLite. No external service or deployment.
- Optimized release WASM for packaged desktop: Trunk --release.
- Whole-tree literal source-scan gate remains release-blocking. No vendor exception was approved. Source identifiers/license notices must not be disguised to produce a pass.

## Schedule corrections
- The supplied W0–W4 list defines five scheduling groups. It is retained as five groups despite the introductory four-wave count.
- A-S13 is scheduled at W2 before A-F004; its original W3 placement created a layout/provider dependency cycle. A-S03 follows contract owners in W1 so its acceptance can pass before W2.
- A-F035 engine/DAG and A-F036 node source are serialized; Rust schema/interface coordination is explicit.
- A-F047 holds the first lease on frontend-build/src/main.rs for license copying; A-F050 runs afterward and preserves this behavior while staging output.
- A-F031 owns straw-app/Cargo.toml. A-F029 owns remaining direct desktop package files.
- A-S03 owns web manifests/config/middleware; A-S13 owns layout/global tokens. Folder agents are consumers of those shared files.
- A-F007 creates apps/api auth/store/base service; A-F009 then A-F008 have serialized leases for their modules and router registration. This is the minimum extra source boundary required by the user's Rust service decision.
- G3's release hold is recorded now. Remediation and evidence collection may proceed; release promotion remains blocked. W4 may report pending gates but cannot certify release.

Every collision or blocked task receives an additional entry below with its owner and evidence.
''',encoding='utf-8')
print('Roster assignments:',len(rows),'folder:',sum(r['kind']=='folder' for r in rows),'cross:',sum(r['kind']=='cross-task' for r in rows),'comparator:1; acyclic dependencies verified')
