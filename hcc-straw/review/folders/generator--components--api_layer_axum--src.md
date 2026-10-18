# Folder review: components/api_layer_axum/src

Scope: `C:\IEDB\STRAW SaaS Generator\components\api_layer_axum\src` (direct files only). No applicable AGENTS.md was found at the checked root/ancestor locations. Source was not changed.

## Inventory and expected behavior

The sole direct file is `lib.rs` (37 lines): a public stateless `ApiServer`, a router with two GET endpoints, a `start(port)` method, and one router unit test. The adjacent Cargo manifest declares Axum 0.7, Tokio with full features, Tower 0.4/util, and Serde. The component is a generator workspace member and is selected by the controller's common base stack (`core/controller.py:135-150`). The generator copies its directory into generated bundles (`core/controller.py:90-96`); selection therefore propagates this implementation widely.

The root README accurately describes reusable starter bundles. However, `docs/README.md:49` describes a robust asynchronous backend API, `docs/EXPANDED_SAAS_FRAMEWORK.md:35` claims the API is fully implemented and tested, and the final verification report broadly claims production-grade completion. The source establishes a small router scaffold, not a functioning server. Desktop guidance favors localhost defaults; retaining loopback is appropriate. Web guidance explicitly lists connecting a real backend as outstanding, so web connectivity is a planned integration rather than a demonstrated contract here.

## Prioritized findings and patch targets

1. **P1 — Proven nonfunctional startup (`lib.rs:13-17`).** Calling and awaiting `ApiServer::start(port)` constructs and immediately drops the router, computes an address, prints that it is listening, and returns. It never binds a socket or invokes a serving loop. No request can reach these routes through this method, and occupied ports cannot produce a startup error. Replace this body with `tokio::net::TcpListener::bind(addr).await?` followed by `axum::serve(listener, app).await`; return a fallible result. Print readiness only after successful binding, using the listener's actual local address (especially for port zero). Add an injectable listener or server handle/shutdown future so host applications can control lifetime and stop cleanly.

2. **P2 — Requirement gap: backend composition is absent (`lib.rs:7-10`).** The router exposes only a version string and constant health response. It accepts no application state and connects no auth, database, user, or other bundled services. This is sufficient as a scaffold but does not support the documented full backend claim. Extend the router with explicit state and component routes under an agreed API prefix, or document the component's scaffold status until those contracts exist. Protected business routes need authorization before they are exposed; absence of auth on the current public health/version endpoints is not itself a demonstrated vulnerability.

3. **P2 — Startup failure is invisible to verification (`lib.rs:27-35`).** The only test invokes the router in process and checks status 200. It passes even when `start` never listens. Add a loopback HTTP integration check with a dynamically allocated port, a bind-conflict error check, and a bounded shutdown check. Expand route assertions to verify the health body and unsupported-route behavior.

## Dependencies, acceptance, and confidence

Startup repair uses existing Axum/Tokio dependencies. Component route composition depends on agreed host state, service ownership, auth policy, and frontend URL contracts; the directory-copy generator does not supply that composition automatically. Acceptance: an actual HTTP request receives `/health` = `OK`, a bind conflict returns an error without claiming readiness, shutdown releases the listener, and generated consumers can host the same router. Run focused crate tests and workspace validation centrally. No builds, tests, installs, network calls, or generated-copy comparison were run in this review. Confidence is high for the startup defect and test gap; backend requirements remain broad and require a concrete endpoint contract.

- [ ] Implement binding, serving, startup errors, and shutdown ownership.
- [ ] Verify startup through loopback HTTP and a conflicting port.
- [ ] Define router state and bundled-service API contracts.
- [ ] Reconcile implementation-status claims with the scaffold's actual capabilities.
