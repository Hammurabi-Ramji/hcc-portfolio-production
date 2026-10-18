<script>
  import { onMount, untrack } from 'svelte';
  import OrigamiCanvas from './origami-fe/OrigamiCanvas.js';
  import { createBridge } from './origami-fe/bridge.js';
  let { invoke } = $props();
  const bridge = untrack(() => createBridge(invoke));
  const readPath = () => window.location.hash.replace(/^#\/?records\/?/, '');
  let path = $state(readPath());
  onMount(() => {
    const update = () => { if (window.location.hash.startsWith('#/records')) path = readPath(); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  });
  function navigate(next) { window.location.hash = `/records/${next}`; }
</script>

<section class="panel">
  <h2>Records</h2>
  <p class="muted">Create topics, then add notes linked to them. These ordinary records are stored on this computer. Use the Vault for secrets.</p>
  <OrigamiCanvas {bridge} {path} onnavigate={navigate} />
</section>
