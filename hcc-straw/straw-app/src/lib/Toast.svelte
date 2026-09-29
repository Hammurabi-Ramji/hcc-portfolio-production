<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  type Toast = {
    id: string;
    message: string;
    type: "error" | "success" | "info";
  };

  let toasts = $state<Toast[]>([]);

  function addToast(message: string, type: "error" | "success" | "info" = "info") {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 5000);
  }

  function removeToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
  }

  function handleToastEvent(e: Event) {
    const ce = e as CustomEvent<{ message: string; type: "error" | "success" | "info" }>;
    addToast(ce.detail.message, ce.detail.type);
  }

  onMount(() => {
    window.addEventListener("addToast", handleToastEvent);
  });

  onDestroy(() => {
    window.removeEventListener("addToast", handleToastEvent);
  });
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}" role="status" aria-live="polite">
      <span class="toast-message">{toast.message}</span>
      <button class="toast-close" onclick={() => removeToast(toast.id)} aria-label="Dismiss">&times;</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toast {
    background: #1e1e2e;
    border-left: 4px solid;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 250px;
    max-width: 400px;
    box-shadow: 0 4px 16px #00000040;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success { border-color: #a6e3a1; }
  .toast-success .toast-message { color: #a6e3a1; }

  .toast-error { border-color: #f38ba8; }
  .toast-error .toast-message { color: #f38ba8; }

  .toast-info { border-color: #89b4fa; }
  .toast-info .toast-message { color: #89b4fa; }

  .toast-message {
    flex: 1;
    font-size: 13px;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.6;
    padding: 0;
    line-height: 1;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
