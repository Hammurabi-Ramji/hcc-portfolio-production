# Review: caching_layer_redis/src

Scope: `C:\IEDB\STRAW SaaS Generator\components\caching_layer_redis\src` direct files only. Inventory: one 50-line `lib.rs`, containing a string-valued `HashMap` cache, monotonic TTL deadlines, and one unit test. No applicable ancestor `AGENTS.md` was found. The parent crate has no external dependencies and is a generator workspace member; the controller copies the entire component into selected bundles (`core/controller.py:90–96`).

The root README describes reusable starter bundles. `docs/EXPANDED_SAAS_FRAMEWORK.md:11` specifies Redis caching, while `docs/FINAL_VERIFICATION_REPORT.md:22` explicitly describes a Redis-style memory cache. The implementation supports the latter's basic set/get behavior, but neither the production-ready claim nor Redis service integration follows from this small implementation. Relevant desktop and web output documentation was inspected; the web technology table also names Redis, without establishing a caller for this crate.

## Findings and patch targets

- **P2, proven retention defect — `lib.rs:18–31`:** Expired entries remain in `store` indefinitely. `get` returns `None` but takes `&self` and cannot evict; `set` only replaces an identical key. A long-running application inserting distinct short-lived keys retains every value after its TTL, defeating cache memory reclamation. Add expiration pruning during writes and reads, plus an explicit cleanup method or capacity policy. Preserve live entries; choose and document whether eviction changes `get` to `&mut self` or uses synchronized interior state.
- **P2, proven panic path — `lib.rs:21`:** Unchecked `Instant + Duration` accepts arbitrary `u64` TTLs and can panic when the deadline exceeds the platform's representable range. Use `checked_add`, returning a typed error for unsupported TTLs or explicitly enforcing a documented upper bound before insertion.
- **Requirement gap — `lib.rs:9–15`:** `RedisCache` owns a private process-local map; instances do not share data and process exit loses it. There is no Redis client, connection configuration, or Redis error handling. Either name/document this as the intended local memory backend and narrow completion claims, or provide a Redis backend through an explicit cache abstraction. This is a contract decision, not proof that Redis is mandatory for every desktop bundle.

## Acceptance and dependencies

- [ ] Verify expired distinct keys are physically removed while live keys remain.
- [ ] Verify overwrite refreshes the TTL, missing keys return `None`, and zero TTL expires immediately.
- [ ] Verify the largest accepted TTL succeeds and unsupported TTLs return an error without panicking or partially writing.
- [ ] Decide the backend contract and align component naming/documentation; if Redis is required, test sharing across two clients and connection failure behavior.

The existing test (`lib.rs:39–48`) covers one successful read and zero-TTL miss, but does not observe retention or extreme TTLs. Confidence is high for the source findings. This review ran no builds, tests, installs, or network calls; platform-specific deadline limits and real Redis behavior remain unverified. A memory-only repair needs only the standard library; a Redis implementation would additionally need a client dependency, runtime choice, and service configuration.
