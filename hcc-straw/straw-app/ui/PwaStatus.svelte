<script>
  import { onMount } from 'svelte';
  let status = $state('Preparing offline shell…');
  let waiting = $state(null);
  let installPrompt = $state(null);
  let offline = $state(!navigator.onLine);
  onMount(() => {
    let live = true;
    let refresh = false;
    const removers = [];
    function listen(target, name, fn) { target.addEventListener(name, fn); removers.push(() => target.removeEventListener(name, fn)); }
    function track(registration) {
      if (registration.active) status = 'Offline shell ready';
      if (registration.waiting) waiting = registration.waiting;
      function observe(worker) {
        listen(worker, 'statechange', () => {
          if (!live) return;
          if (worker.state === 'activated') status = 'Offline shell ready';
          if (worker.state === 'installed' && navigator.serviceWorker.controller) waiting = registration.waiting || worker;
          if (worker.state === 'redundant' && !registration.active) status = 'Offline setup failed. Reload while connected to the local site.';
        });
      }
      if (registration.installing) observe(registration.installing);
      listen(registration, 'updatefound', () => { if (registration.installing) observe(registration.installing); });
    }
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(registration => { if (live) track(registration); }).catch(error => { if (live) status = `Offline setup failed: ${error.message}`; });
      listen(navigator.serviceWorker, 'controllerchange', () => { if (refresh) window.location.reload(); else status = 'Offline shell ready'; });
    } else status = 'Offline installation requires a secure origin or local loopback server.';
    listen(window, 'online', () => offline = false);
    listen(window, 'offline', () => offline = true);
    listen(window, 'beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
    listen(window, 'appinstalled', () => { installPrompt = null; });
    listen(window, 'straw:update', () => { if (waiting) { refresh = true; waiting.postMessage('activate-update'); } });
    return () => { live = false; removers.forEach(remove => remove()); };
  });
  async function install() {
    const prompt = installPrompt;
    if (!prompt) return;
    await prompt.prompt(); await prompt.userChoice; installPrompt = null;
  }
</script>
<div class="pwa-status" role="status">
  <span>{status}{offline ? ' · Offline' : ''}</span>
  {#if waiting}<button onclick={() => window.dispatchEvent(new Event('straw:update'))}>Apply downloaded update</button>{/if}
  {#if installPrompt}<button onclick={install}>Install STRAW Desk</button>{:else}<span class="muted">Install using your browser menu when available.</span>{/if}
</div>
<style>
  .pwa-status { display:flex; flex-wrap:wrap; align-items:center; gap:12px; padding:12px 24px; border-bottom:1px solid #37414e; font-size:13px; }
</style>
