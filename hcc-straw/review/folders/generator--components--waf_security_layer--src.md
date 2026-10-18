# WAF source review

Inventory: one 40-line `lib.rs` with a three-assertion test; dependency-free workspace library. No ancestor AGENTS.md found. The implementation is an in-memory string denylist plus a substring heuristic, whereas `docs/FINAL_VERIFICATION_REPORT.md:7,29,41` claims production-grade SQL-injection protection.

**Proven behavior/gaps:** `lib.rs:19-21` rejects legitimate `/dropdown` and `/selection`, yet accepts `/users?id=1;%44ROP%20TABLE%20users`; it never decodes the request or inspects bodies. No exploitable SQL sink is established. `lib.rs:10-16` stores arbitrary strings, so equivalent IPv6 spellings do not match and repeated additions grow the list. `lib.rs:33-38` tests only exact IP matching and one obvious payload. Integration is also missing in the inspected Axum router (`components/api_layer_axum/src/lib.rs:7-10`): component selection (`core/controller.py:159`) does not prove enforcement.

**Patch proposal:** replace the denylist with `HashSet<IpAddr>` and fallible input parsing; document the heuristic's actual limits and use parameterized database queries for injection prevention. Add Axum middleware using peer addresses and an explicit trusted-proxy policy, with bounded request parsing if content rules are retained. Denylist needs only std; middleware needs API dependency/wiring.

Confidence: high for source behavior; no builds, tests, network, or deployment checks performed.

- [ ] Canonicalize/deduplicate IPs and test equivalent IPv6 forms.
- [ ] Test benign names, encoded payloads, and body handling against documented policy.
- [ ] Verify middleware rejects blocked peers before handlers; revise unsupported security claims.

