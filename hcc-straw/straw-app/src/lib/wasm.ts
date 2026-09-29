import init, { fibonacci, greet } from "wasm-compute";

let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) return;
  await init();
  initialized = true;
}

export { fibonacci, greet as wasmGreet };
