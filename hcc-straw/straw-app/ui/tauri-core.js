// Adapter for tauri-specta's official API import in the native Rust build.
export function invoke(command, args) {
  if (!window.__TAURI__?.core?.invoke) return Promise.reject(new Error('Open STRAW Desk to use the local engine.'));
  return window.__TAURI__.core.invoke(command, args);
}
