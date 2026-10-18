# Review: microservices_orchestrator/src

Scope: index 19; all direct files inspected: `lib.rs` (42 lines). No applicable ancestor AGENTS.md found. Context inspected: component/workspace Cargo manifests, controller/config references, root/docs README, and relevant expanded-framework/verification sections.

## Existing behavior and requirements

The component is a dependency-free, in-memory service registry. `new` creates an empty map; registration inserts/replaces a named endpoint; lookup returns an immutable reference. The only test checks endpoint storage (`lib.rs:35–40`). The workspace includes this crate (`Cargo.toml:27`); controller inclusion/copying (`core/controller.py:94–95,232`) assembles source but does not start services. Searching Rust/Python callers found only this module, its parent duplicate `orchestrator.rs`, and their tests.

## Findings and patch targets

**P1 — Proven misleading health state, with a documented capability gap.** `components/microservices_orchestrator/src/lib.rs:18–23` marks every registration `"healthy"` without contacting the endpoint. An unreachable or malformed endpoint therefore appears healthy immediately and remains so indefinitely: the entire public implementation (`lib.rs:13–29`) has no probe or status-update operation. `docs/FINAL_VERIFICATION_REPORT.md:19` explicitly claims health-monitoring logic; lines 3/7/41 claim complete production readiness. Those claims exceed the implementation.

Patch `ServiceInfo` (`lib.rs:3–7`) to represent unknown/healthy/unhealthy states and last-check information, initialize unknown in `register_service`, and add a health-check/update path with bounded timeout and observable failure. Define the probe contract before adding dependencies: endpoint protocol, health route, response semantics, check interval, and who drives checks. Until implemented, revise the verification claim to describe an in-memory registry. Before: registration implies verified health. After: only a successful check produces healthy; errors/timeouts produce unhealthy.

Broader lifecycle orchestration (launch/restart/dependency ordering) is a **proposal requiring scope definition**, not a proven violation of a concrete lifecycle specification: `docs/EXPANDED_SAAS_FRAMEWORK.md:10` names orchestration without defining that behavior.

## Acceptance and remaining tasks

- [ ] Define the health-check contract and runtime ownership.
- [ ] Implement unknown initial state and bounded health updates; reconcile the parent duplicate source when changing the compiled module.
- [ ] Verify successful, refused, timed-out, and recovery probes using local test services; assert registration alone never establishes health.
- [ ] Correct capability documentation and add integration usage if monitoring is retained as a requirement.

Confidence: high from complete static inspection. No tests or network calls run here; root reports 35 generator unit tests passed, which does not demonstrate health monitoring.
