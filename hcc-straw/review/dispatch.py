from pathlib import Path
import json,sys,datetime,re
R=Path(r"C:\IEDB\STRAW Stack\review")
p=R/'remediation-registry.json';rows=json.loads(p.read_text());by={x['agent']:x for x in rows}
def transition(row,state,note):
 event={'agent':row['agent'],'from':row['state'],'to':state,'note':note,'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 with (R/'dispatch-events.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(event)+'\n')
 row['state']=state

def refuse(reason):
 with (R/'dispatch-events.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps({'agent':sys.argv[2] if len(sys.argv)>2 else None,'action':sys.argv[1],'refused':reason,'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()})+'\n')
 raise SystemExit('REFUSED '+reason)

action=sys.argv[1]
if action=='ready':
 print(json.dumps([{'agent':x['agent'],'wave':x['wave'],'relative':x['relative']} for x in rows if x['state']=='PLANNED' and all(by[d]['status']=='DONE' for d in x['depends_on'])],indent=2));sys.exit()
agent=sys.argv[2];row=by[agent]
if action=='spawn':
 blocked=[d for d in row['depends_on'] if by[d]['status']!='DONE']
 if blocked:refuse('unmet DONE dependencies: '+str(blocked))
 if row['state']!='PLANNED':refuse('state '+row['state'])
 transition(row,'SPAWNED','Dependencies checked; dispatch reserved');row['runtime_agent']=sys.argv[3] if len(sys.argv)>3 else agent
elif action=='execute':
 if row['state']!='SPAWNED':refuse('state '+row['state'])
 transition(row,'EXECUTING','Agent execution confirmed by dispatcher')
elif action=='settle':
 if row['state'] not in ('EXECUTING','REPORTED','ARBITRATED','SETTLED'):refuse('state '+row['state'])
 result_path=R/'agent-output'/agent/'result.json';result=json.loads(result_path.read_text(encoding='utf-8-sig'));report=R/'agent-output'/(agent+'.md')
 if row['state']=='SETTLED':transition(row,'REPORTED','Corrected evidence metadata returned; previous settlement retained')
 if row['state']=='EXECUTING':transition(row,'REPORTED','Result and report returned')
 status=result['status'];assert status in ('DONE','PARTIAL','BLOCKED')
 evidence=result.get('evidence_refs',[]);commands=result.get('commands',[])
 acceptance=[c for c in commands if c.get('acceptance',True)]
 issues=[]
 if not report.exists():issues.append('Missing report')
 if not evidence:issues.append('Empty evidence')
 issues += ['Missing evidence '+e for e in evidence if not Path(e).exists()]
 if not acceptance:issues.append('No acceptance command')
 for c in commands:
  if not Path(c['log']).exists():issues.append('Missing command log '+c['log'])
  expected_rejection=(c.get('expected')=='nonzero' and c.get('validated_by') and any(v.get('acceptance',True) and v['exit_code']==0 and v['log']==c['validated_by'] for v in commands) and Path(c['validated_by']).exists())
  if c.get('acceptance',True) and c['exit_code']!=0 and not expected_rejection:issues.append('Failed acceptance '+c['log'])
  if c['exit_code']!=0 and not c.get('acceptance',True) and not ((c.get('superseded_by') and Path(c['superseded_by']).exists()) or (c.get('deferred_to') and c.get('diagnostic'))):issues.append('Undisposed diagnostic '+c['log'])
 for ripple in ('primary','secondary','tertiary'):
  if not result.get(ripple):issues.append('Missing Triple-Ripple '+ripple)
 covered=set()
 for directory in ('patches','diffs'):
  folder=R/'agent-output'/agent/directory
  if folder.exists():
   for patch in folder.rglob('*'):
    if patch.is_file() and patch.suffix in ('.patch','.diff'):
     text=patch.read_text(encoding='utf-8-sig')
     for header in re.findall(r'^(?:---|\+\+\+) ([^\t\r\n]+)',text,re.M):
      if header.startswith(('a/','b/')):covered.add(header[2:].replace('\\','/'))
 for file in result.get('files_touched',[]):
  normalized=file.replace('\\','/')
  prefix=str(R.parent).replace('\\','/')+'/'
  if normalized.lower().startswith(prefix.lower()):normalized=normalized[len(prefix):]
  if normalized not in covered:issues.append('Missing per-file unified diff '+file)
 if result.get('agent')!=agent:issues.append('Result identity mismatch')
 if status=='BLOCKED' and not result.get('blocker'):issues.append('Missing blocker owner/description')
 if status=='DONE' and issues:status='PARTIAL'
 row['validation_issues']=issues
 if row['state']=='REPORTED':transition(row,'ARBITRATED','Dispatcher reviewed scope, evidence and acceptance')
 transition(row,'SETTLED','Evidence status recorded')
 row.update(status=status,result=str(result_path),report=str(report))
 event=dict(agent=agent,folder=row['folder'],wave=row['wave'],status=status,gates_passed=result.get('gates_passed',[]),evidence_refs=evidence,timestamp_utc=datetime.datetime.now(datetime.timezone.utc).isoformat())
 with (R/'settlement-ledger.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(event)+'\n')
 print(json.dumps({'agent':agent,'status':status,'files':result.get('files_touched',[]),'blocker':result.get('blocker'),'validation_issues':issues}))
else:raise SystemExit('Unknown action')
tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(rows,indent=2),encoding='utf-8');tmp.replace(p)
