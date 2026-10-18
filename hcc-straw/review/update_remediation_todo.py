from pathlib import Path
import json,re,collections
root=Path(r"C:\IEDB\STRAW Stack")
rows=json.loads((root/'review/remediation-registry.json').read_text(encoding='utf-8'))
p=root/'to-do.md';s=p.read_text(encoding='utf-8')
counts=collections.Counter(r['status'] or r['state'] for r in rows)
text='<!-- remediation-status:start -->\n\nCurrent assignments: '+', '.join(f"**{k}: {v}**" for k,v in sorted(counts.items()))+'. '+str(len(rows))+' total. Only DONE dependencies release subsequent assignments.\n\n[Execution registry](review/remediation-registry.json) · [Settlement ledger](review/settlement-ledger.jsonl) · [Arbitration and decisions](review/arbitration.md) · [Local service contract](review/web-backend-contract.md)\n\nUser choices: separate local Rust/Axum service with SQLite; optimized release WASM; whole-tree source scan blocks release. Runtime/package acceptance remains pending until its own evidence is recorded.\n\n<!-- remediation-status:end -->'
if '<!-- remediation-status:start -->' in s:s=re.sub(r'<!-- remediation-status:start -->.*?<!-- remediation-status:end -->',lambda _:text,s,flags=re.S)
else:s=re.sub(r'## Remediation execution\n.*?(?=## Audit baseline)',lambda _:'## Remediation execution\n\n'+text+'\n\n',s,flags=re.S)
for r in rows:
 if r['kind']!='folder' or r['state']!='SETTLED':continue
 number=r['agent'].split('-F')[1]
 start=s.find('### STACK-F'+number+' ')
 if start<0:continue
 end=s.find('\n### ',start+1);end=len(s) if end<0 else end
 section=s[start:end]
 section=re.sub(r'\nImplementation settlement:.*?(?=\n\n|$)','',section,flags=re.S)
 section=section.rstrip()+f"\n\nImplementation settlement: **{r['status']}** · [Current agent report](review/agent-output/{r['agent']}.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.\n\n"
 s=s[:start]+section+s[end:]
p.write_text(s,encoding='utf-8')
print(json.dumps(dict(counts)))
