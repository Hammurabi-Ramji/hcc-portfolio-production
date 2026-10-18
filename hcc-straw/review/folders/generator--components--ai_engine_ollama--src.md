# Folder review: components/ai_engine_ollama/src

## Inventory and expected behavior

Reviewed the only direct file, `lib.rs` (57 lines), in full with numbered lines. It defines serializable request/response types, a reusable async `AIEngine`, a localhost default, and one initialization test. The parent Cargo manifest declares serde, reqwest 0.12 with JSON support, and Tokio; the generator workspace includes this crate. No applicable AGENTS.md was found in the checked ancestors.

The generator root README describes reusable starter components; docs/README.md specifies local Ollama inference. docs/EXPANDED_SAAS_FRAMEWORK.md and docs/FINAL_VERIFICATION_REPORT.md make stronger production/comprehensive-testing claims that this file does not establish. Stack desktop engine and web platform guides describe separate application capabilities and do not prove that this component exposes them. The implemented scope is one nonstreaming `/api/generate` call returning text. Streaming, conversation history, model options, and model discovery are possible extensions, not proven requirements of this small component.

## Prioritized findings and patch targets

1. **P2 — Proven HTTP error handling defect:** `lib.rs:37-42` deserializes every response without checking status. A non-success status with a compatible `response` field is returned as `Ok`; a normal error object becomes a JSON decoding failure, obscuring the server's HTTP failure and useful diagnostic. Patch `prompt` to retain the response, check status before success decoding, and represent Ollama error bodies separately from transport/decoding failures. At minimum insert `error_for_status()` between `await?` and `.json()`. A component-specific error enum can retain HTTP status and a bounded error message without logging prompt content.

2. **P2 — Reliability gap:** `lib.rs:24` constructs an unconfigured client and `lib.rs:37-42` applies no explicit overall timeout. An accepted connection whose response stalls can keep the inference future pending without a component-defined bound. Patch constructor/client configuration with a configurable inference timeout and a connect timeout appropriate to local service startup; allow long model loading through configuration. Consider accepting an injected Client for host application policy and testing. This is a visible missing bound; no hang was experimentally reproduced.

3. **P2 — Validation gap:** `lib.rs:52-55` checks only the default URL and never calls `prompt`. It cannot substantiate documented production verification. Add deterministic loopback HTTP tests for the request path, model/prompt payload, `stream:false`, success JSON, HTTP errors, malformed JSON, disconnection, and a stalled response timeout. Keep live-Ollama tests optional so CI does not require a downloaded model.

4. **P3 — Proposed configuration hardening:** `lib.rs:22-30` accepts arbitrary strings and concatenates `/api/generate`; trailing slashes produce a double slash and malformed endpoints fail only when used. Parse and normalize a URL in a fallible constructor. Because the documentation emphasizes local inference, explicitly document whether remote endpoints are supported; loopback enforcement is a product decision rather than a proven defect.

## Dependencies, acceptance, and confidence

Coordinate constructor/error API changes with generator component documentation and downstream consumers. Repository search found bundle selection references and copied template implementations, but no production call to this crate's `prompt`; application integration remains unverified. Parent-folder duplicate source and copy synchronization belong to their assigned reviews.

- [ ] Check HTTP status and preserve useful server diagnostics.
- [ ] Configure request bounds and normalize endpoint construction.
- [ ] Add HTTP behavior tests and update verification claims.
- [ ] Have the root reviewer run crate/workspace checks and assess generated bundle consumers.

Confidence is high in source-level findings and moderate in runtime integration. No build, test, install, network request, or live Ollama check was run; those remain with the root review. Source files were not changed.
