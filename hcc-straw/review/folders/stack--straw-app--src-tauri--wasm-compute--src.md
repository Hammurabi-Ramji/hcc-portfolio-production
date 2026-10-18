# Folder 39 — WASM compute source

Reviewed the sole direct file, `lib.rs` (19 lines), Cargo manifest, generated JavaScript/types, frontend wrapper, and documentation. No ancestor AGENTS.md was present. The crate exports greeting and Fibonacci demonstrations; `output/IMPLEMENTATION_STATUS.md:105–107,154–155` defers node integration. Frontend/test caller searches found only `src/lib/wasm.ts` exports; a compute node is an optional extension. Generator completion claims do not establish this crate's runtime quality.

**P2 — exported numeric/performance contract is unsafe.** `lib.rs:14–18` accepts every `u32` and recursively computes Fibonacci in exponential time with linear stack depth. Even representable high values require billions of calls; large inputs can exhaust the stack. Results fit `u32` only through n=47; n=48 overflows (panic with overflow checks, wrapping without them). Generated `pkg/wasm_compute.js:7–9` forwards JavaScript numbers without validation, allowing fractional/nonfinite inputs to be coerced and negative values to reach unsigned Rust as very large values. No active UI invocation was found, limiting current exposure but leaving the public package unsafe to reuse synchronously.

Patch `lib.rs:14–18` to bounded iterative computation with checked arithmetic and a documented error for n>47; avoid computing an unnecessary overflowing next term when returning F47. Add finite-integer/range validation at the JavaScript boundary (`src/lib/wasm.ts`) or expose a validated `f64`/`Result` Rust interface. Regenerate pkg bindings and binary together with the existing wasm-bindgen toolchain; no additional dependency is necessary. `greet` correctly formats empty/Unicode names; its cost is linear in name length. The unused alert declaration at lines 3–6 is cleanup only.

Confidence: high for source findings; no runtime tests performed. Root `review/desktop-cargo-check.log` reports an ancestor-workspace blocker, not successful compilation.

- [ ] Verify F0/F1/F46/F47 and prompt errors for 48, negative, fractional, NaN/infinite inputs.
- [ ] Verify Unicode greetings and regenerated bindings in a browser after initialization.
- [ ] Measure bounded completion time and resolve the workspace blocker before claiming build verification.
