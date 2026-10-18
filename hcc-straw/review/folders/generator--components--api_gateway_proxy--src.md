# API gateway source review

Scope: `C:\IEDB\STRAW SaaS Generator\components\api_gateway_proxy\src`, direct files only. The sole direct file is `lib.rs` (29 lines, 758 bytes). All lines were inspected. No applicable `AGENTS.md` was found in the repository root or folder ancestors. Manifests, generator configuration, neighboring service APIs, and required documentation were inspected for integration evidence only.

## Inventory and expected behavior

`ApiGateway` owns an in-memory `HashMap<String, String>`, registers exact path-to-service-name mappings, and returns a cloned service name or `None`. Its single test exercises one successful exact lookup. This is a small usable routing table, without asynchronous work or external dependencies; `../Cargo.toml:6` has an empty dependency section. The workspace includes the crate (`Cargo.toml:29`), and the controller selects it for logistics (`core/controller.py:231`).

The root README describes copied component bundles rather than an automatically assembled running application. However, `docs/EXPANDED_SAAS_FRAMEWORK.md:29` promises an API gateway for logistics, and `docs/FINAL_VERIFICATION_REPORT.md:16` specifically claims robust routing and service discovery. These stronger claims require endpoint resolution and a transport integration, or documentation explicitly identifying this component as a routing-table starter. Stack desktop/web guides describe separate application entry points and provide no gateway contract.

## Findings and concrete changes

1. **P1 — Requirement gap: no service discovery or proxy execution.** `lib.rs:1-16` stores and returns arbitrary strings only. There is no service registry access, endpoint lookup, HTTP request input, forwarding, upstream response, timeout, or error handling. A route registered to `billing_service` produces that literal name, not a request to a service. The neighboring orchestrator exposes `get_service` and an endpoint, but this crate neither depends on nor accepts it. Searches found no gateway caller in generator Rust/Python source beyond its own tests and the duplicate parent source. Passing its test cannot establish the documented gateway behavior. Patch `lib.rs` to separate route matching from service resolution, introduce a resolver interface and typed resolution errors, and supply a gateway adapter in the API host with explicit request/response forwarding. Add the chosen transport/runtime and resolver dependency in the component manifest. Alternatively, narrow completion claims to the implemented lookup table pending that work.

2. **P2 — Proposed contract improvement: registration cannot reject mistakes or disclose replacement.** `lib.rs:10-11` accepts empty paths/services and silently overwrites a previous mapping. That is proven behavior, but no documented duplicate/validation policy makes it an established bug. Define the policy and return `Result` or the displaced mapping; validate path and target identifiers before insertion. Keep exact matching explicit unless prefix, parameter, or method-specific routing is required.

3. **P2 — Verification gap.** `lib.rs:24-27` covers only successful registration. Add checks for missing paths, multiple independent routes, defined duplicate handling, invalid registration, and resolver failure. If proxy support is added, integration checks should verify method, query, body, allowed headers, upstream statuses, timeouts, and unavailable services against a local mock server.

## Acceptance and confidence

- [ ] Define the public route/discovery/proxy contract and align documentation.
- [ ] Implement resolver/host integration and typed registration behavior.
- [ ] Verify lookup edge cases and real local forwarding.
- [ ] Run `cargo test -p api_gateway_proxy` and logistics bundle acceptance checks.

High confidence in the observed lookup-only behavior and coverage limitations. No compile, test, install, network, or source mutation was performed; root review owns build/test execution and duplicate-copy comparison. No compile failure or runtime security exploit is asserted from this source.
