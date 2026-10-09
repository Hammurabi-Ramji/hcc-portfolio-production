<script>
  import { onMount } from 'svelte';
  import NodeConfigPanel from './NodeConfigPanel.svelte';
  let { record, persisted, invoke, notify, onsaved } = $props();
  let name = $state(record.name);
  let graph = $state(JSON.parse(JSON.stringify(record.definition)));
  let schemas = $state([]);
  let selected = $state(null);
  let dirty = $state(!persisted);
  let busy = $state(false);
  let history = $state([]);
  let result = $state(null);
  let source = $state(''); let sourcePort = $state('');
  let target = $state(''); let targetPort = $state('');
  let dragging = $state(null);
  const selectedNode = $derived(graph.nodes.find(n => n.id === selected));
  const selectedSchema = $derived(schemas.find(s => s.kind === selectedNode?.kind));
  const sourceSchema = $derived(schemas.find(s => s.kind === graph.nodes.find(n => n.id === source)?.kind));
  const targetSchema = $derived(schemas.find(s => s.kind === graph.nodes.find(n => n.id === target)?.kind));
  onMount(() => {
    let live = true;
    Promise.all([invoke('node_schemas'), invoke('execution_list', { id:record.id })]).then(([s,h]) => { if (live) { schemas=s; history=h; } }).catch(e => notify(String(e),true));
    return () => { live=false; };
  });
  function addNode(schema) {
    const config = Object.fromEntries(schema.configFields.map(f => [f.name,f.default ?? '']));
    const id = crypto.randomUUID();
    graph.nodes = [...graph.nodes,{id,kind:schema.kind,config,x:45+(graph.nodes.length%3)*240,y:45+Math.floor(graph.nodes.length/3)*150}];
    selected=id; dirty=true;
  }
  function configUpdate(field,value) {
    graph.nodes = graph.nodes.map(n => n.id === selected ? {...n,config:{...n.config,[field]:value}} : n); dirty=true;
  }
  function deleteNode() {
    graph.nodes=graph.nodes.filter(n => n.id !== selected);
    graph.edges=graph.edges.filter(e => e.source !== selected && e.target !== selected);
    selected=null; dirty=true;
  }
  function connect() {
    if (!source || !target || !sourcePort || !targetPort) return notify('Choose both nodes and ports.',true);
    graph.edges=[...graph.edges,{source,sourceHandle:sourcePort,target,targetHandle:targetPort}]; dirty=true;
  }
  async function save() {
    const row = await invoke('flow_save',{flow:{...record,name,definition:JSON.parse(JSON.stringify(graph))}});
    onsaved(row); dirty=false; return row;
  }
  async function saveClicked() { busy=true; try { await save(); notify('Flow saved.'); } catch(e) {notify(String(e),true);} finally {busy=false;} }
  async function run() {
    busy=true;
    try {
      const row=await save();
      result=await invoke('execute_workflow',{id:row.id,graph:row.definition});
      history=await invoke('execution_list',{id:row.id});
      if (result.status.kind === 'failed') notify(result.status.error,true);
      else notify(`Completed ${result.results.length} nodes.`);
    } catch(e) {notify(String(e),true);} finally {busy=false;}
  }
  function dragStart(event,id) { dragging=id; selected=id; event.currentTarget.setPointerCapture(event.pointerId); }
  function drag(event) {
    if (!dragging) return;
    graph.nodes=graph.nodes.map(n => n.id === dragging ? {...n,x:Math.max(0,n.x+event.movementX),y:Math.max(0,n.y+event.movementY)} : n); dirty=true;
  }
  function nodeFor(id) { return graph.nodes.find(n => n.id === id); }
</script>

<div class="editor">
  <header class="row spread">
    <label>Flow name <input bind:value={name} oninput={() => dirty=true}></label>
    <span class="muted">{dirty ? 'Unsaved changes' : 'Saved'} · {record.id}</span>
    <div class="row"><button disabled={busy} onclick={saveClicked}>Save</button><button disabled={busy} onclick={run}>{busy?'Working…':'Run flow'}</button></div>
  </header>
  <section class="palette" aria-label="Node palette">
    {#each schemas as schema (schema.kind)}<button disabled={busy} onclick={() => addNode(schema)}>{schema.label}</button>{/each}
  </section>
  <div class="workspace">
    <div class="canvas-scroll">
      <div class="canvas" aria-label="Workflow canvas">
        <svg width="1400" height="1000" aria-label="Connections">
          {#each graph.edges as edge}
            {@const a=nodeFor(edge.source)}{@const b=nodeFor(edge.target)}
            {#if a && b}<line x1={a.x+190} y1={a.y+45} x2={b.x} y2={b.y+45} stroke="currentColor" stroke-width="2" />{/if}
          {/each}
        </svg>
        {#each graph.nodes as node (node.id)}
          {@const schema=schemas.find(s => s.kind === node.kind)}
          <div class="flow-node" class:selected={node.id === selected} style:left={`${node.x}px`} style:top={`${node.y}px`}>
            <button class="node-title" onpointerdown={e => dragStart(e,node.id)} onpointermove={drag} onpointerup={() => dragging=null} onpointercancel={() => dragging=null} onclick={() => selected=node.id}>{schema?.label ?? node.kind}</button>
            <p class="muted small">{schema?.inputs.join(', ') || 'input'} → {schema?.outputs.join(', ')}</p>
          </div>
        {/each}
      </div>
    </div>
    {#if selectedNode && selectedSchema}<NodeConfigPanel schema={selectedSchema} node={selectedNode} onupdate={configUpdate} ondelete={deleteNode}/>{/if}
  </div>
  <section class="connections">
    <h3>Connect nodes</h3>
    <div class="row">
      <label>From<select bind:value={source} onchange={() => sourcePort=''}><option value="">Choose node</option>{#each graph.nodes as n}<option value={n.id}>{n.kind} · {n.id.slice(0,6)}</option>{/each}</select></label>
      <label>Output<select bind:value={sourcePort}><option value="">Choose port</option>{#each sourceSchema?.outputs ?? [] as p}<option>{p}</option>{/each}</select></label>
      <label>To<select bind:value={target} onchange={() => targetPort=''}><option value="">Choose node</option>{#each graph.nodes as n}<option value={n.id}>{n.kind} · {n.id.slice(0,6)}</option>{/each}</select></label>
      <label>Input<select bind:value={targetPort}><option value="">Choose port</option>{#each targetSchema?.inputs ?? [] as p}<option>{p}</option>{/each}</select></label>
      <button onclick={connect}>Connect</button>
    </div>
    {#each graph.edges as e,i}<div class="row muted"><span>{e.sourceHandle} → {e.targetHandle}</span><button aria-label="Remove connection" onclick={() => {graph.edges=graph.edges.filter((_,index) => index !== i);dirty=true;}}>Remove</button></div>{/each}
  </section>
  {#if result}<section class="results"><h3>Execution · {result.status.kind}</h3><pre>{JSON.stringify(result.results,null,2)}</pre></section>{/if}
  {#if history.length}<section class="results"><h3>Execution history</h3>{#each history as h (h.id)}<p class="muted">{h.status.kind} · {h.startedAt} → {h.finishedAt ?? 'running'}{h.status.error ? ` · ${h.status.error}` : ''}</p>{/each}</section>{/if}
</div>
<style>
  .editor { display:flex; flex-direction:column; flex:1; min-height:500px; } header { padding:18px 24px; border-bottom:1px solid #37414e; }
  .palette { padding:12px 24px; display:flex; flex-wrap:wrap; gap:6px; } .palette button { font-size:12px; }
  .workspace { display:flex; flex:1; min-height:360px; border-block:1px solid #37414e; } .canvas-scroll { flex:1; overflow:auto; }
  .canvas { width:1400px; height:1000px; position:relative; background:#10151b; } svg { position:absolute; color:#6c9eb8; pointer-events:none; }
  .flow-node { position:absolute; width:190px; border:1px solid #44505d; border-radius:5px; background:#202b36; } .flow-node.selected { border-color:#99c9e3; }
  .node-title { width:100%; text-align:left; touch-action:none; cursor:move; } .flow-node p { padding:10px; }
  .connections,.results { padding:16px 24px; display:flex; flex-direction:column; gap:12px; } pre { font-size:12px; max-height:220px; overflow:auto; }
</style>

