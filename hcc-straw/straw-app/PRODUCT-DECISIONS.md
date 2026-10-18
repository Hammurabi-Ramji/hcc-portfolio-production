# STRAW Desk: product decisions and build contract

Hammurabi Coding Company · BSM-C v4.0 · October 13, 2026

This record resolves the pasted architecture against the code in `straw-app`. The intended deliverable is a usable local desktop workspace with shared schema-driven forms, real project validation, and one verifiable evidence chain. Implementation status must be supported by running code and checks. Pasted statements such as “production-ready,” “20 crates,” “650+ markers,” “11/11 tests,” and “the code compiles” are not verification evidence for this checkout.

## Decisions made

1. **Build Crucible before extending generation.** It remains a standalone Rust CLI in `crates/crucible`, and the desktop calls the same library. Its nine gates are Structure, Completeness, Security, Reproducibility, Portability, Compilation, Tests, Lint, and Philosophy. Earlier excerpts that call Gate 7 Dependencies, Gate 8 Compliance, or Gate 9 Performance are superseded. Gate 6 runs both the Rust build and the locked, offline Trunk frontend build when `Trunk.toml` exists. Gate 9 does not mint on its own; certification is a separate action after nine distinct PASS results.

2. **Keep Origami reusable.** `packages/origami-fe` owns the schema renderer, field components, lists, relations, and transport adapter. The desktop Records view is a host adapter, not a fork. Fleet applications can reuse that library. This checkout compiles it through the existing native Rust Svelte compiler and Trunk; it does not introduce a pnpm build alongside the approved package-manager-free build.

3. **Use Svelte 5 runes and the existing native Tauri/Specta bridge.** Do not add a second RPC framework merely to match a speculative document. The six Accordion commands are `schema_entities`, `schema_get`, `entity_list`, `entity_read`, `entity_save`, and `entity_delete`. The command envelope is generated into TypeScript/JavaScript; runtime entity payloads are arbitrary JSON checked by Rust.

4. **Use `.autarch.yaml` as the declared application schema.** Workspace Topics and Notes are the working model. The manifest also declares paths for Crucible Gate 1. Entity names, field types, required values, numeric limits, unique values, relations, server-managed dates, and nested JSON are checked by Accordion. Entity data is stored in a generic JSON table; adding a field does not create a SQL column.

5. **Ship reviewed schema changes through a rebuild.** The native binary embeds the YAML. Editing it requires bindings regeneration, frontend/native rebuild, and restart. No runtime Rust compiler, live database migration, or dynamic Tauri command registration is claimed. Schema evolution must preserve old records and define migration behavior before accepting breaking changes.

6. **Keep the one security ledger and one signer.** `straw-stele` is a typed interface over `straw-security`, not a second database, key registry, or digest chain. Vault events, grants, manual precedents, and Crucible certificates share the same signed sequence and independently signed checkpoint. Sequence positions therefore include non-precedent events; gaps between precedents are expected.

7. **Keep SHA-256 and Ed25519.** The merged design uses the existing workspace hash and vault signer. BLAKE3 from the pasted standalone example is not required by Stele. Vault secret encryption is XChaCha20-Poly1305 with an Argon2-derived key, not the AES-256-GCM or “Tauri secure enclave” described in the pasted text. Key custody is passphrase-protected native storage, not a hardware enclave.

8. **Let the desktop validate without a second passphrase prompt.** Unlock once in Vault and grants. Choosing Validate project requests a single-use approval bound to that folder. It executes real local build/test/lint tools and, after nine PASS results, carves with that open signer. CLI minting still requires the existing vault database, checkpoint, and passphrase. Do not run CLI minting against a vault concurrently used by the desktop; CLI and desktop do not coordinate concurrent writers.

9. **Preview manual precedents in full.** The Ledger view freezes title, rationale, and full body for review, then requests native approval bound to those exact values. Editing requires returning to the draft. The UI does not accept externally signed records, grant reuse, or an approval for different text. Author/judge `operator` denotes the workstation operator; the signer fingerprint is the actual cryptographic identity, not a verified personal identity.

10. **Certify evidence, not perfection.** Partial, duplicate, skipped, warned, or failed gate sets cannot earn certification. A run snapshots source/configuration inputs before and after the checks and refuses certification if they changed. Certificates record the schema digest, source fingerprint, full gate report, signer, and ledger receipt. Generated output, vendor trees, binary artifacts, external services, and semantic correctness are outside that source fingerprint. The snapshot is a bounded check, not filesystem isolation against an adversary changing files between observations.

11. **Keep the documented 85% default line-coverage target.** No coverage tool or unreadable coverage produces WARN, not fictional success. Project-wide coverage is not proof of 97% authentication coverage; per-module targets need separately measured reports before they can be enforced. Do not lower thresholds just to make the workspace green. Compiler/linter warnings remain visible under the existing gate policy.

12. **Pin the versions already resolved by Cargo.lock.** Dependency declarations use exact resolved versions, and build/test commands use locked, offline resolution. This improves repeatability without asserting bit-identical builds. Toolchain, target, compiler flags, environment, native libraries, model files, and provenance still affect reproducibility. The current locked frontend dependencies require Rust 1.96 or later; verification uses 1.98.1.

13. **Distinguish ordinary storage from encrypted vault storage.** Topics/Notes use local `accordion.db`; application workflows/documents and the security chain use `straw.db`. Only vault items are encrypted through the vault interface. A single signed security chain does not encrypt all SQLite tables. Do not describe all application data as an encrypted IEDB until a database-wide encryption and migration design has been implemented and checked.

14. **Target a single local operator.** The schema renderer is not an authorization boundary. Restricted role policies require an authenticated identity and server-side checks; they must not be silently accepted as enforced. No peer authentication, JWT replacement, mDNS pairing, or household role system is claimed by these six commands.

15. **Keep desktop IPC authoritative; keep the browser surface bounded.** The optional Axum listener remains read-only and loopback-only. It does not expose entity writes, vault unsealing, or ledger carving. Tauri IPC has serialized messages and security boundaries; the claim that it always uses shared memory is unsupported. See [Tauri IPC documentation](https://v2.tauri.app/concept/inter-process-communication/).

16. **Use the bundled CPU Candle worker first.** Existing local inference remains supervised and separate from the desktop process. Hardware profile collection, verified CPU/GPU backend selection, and benchmarks are a possible later Polymorphic milestone. No autonomous recompilation, Neural Engine support, thermal guarantee, or 3x/10x/100x speedup is asserted. Candle is a Rust ML framework with hardware backend support, not an NPU code generator. See [Candle](https://github.com/huggingface/candle).

17. **Do not execute LLM-produced raw machine code.** A future optimization system should generate constrained source or an intermediate representation, use established compilers, verify against a reference implementation, and benchmark supported hardware. WASI governs WebAssembly host capabilities; it cannot wrap arbitrary native NPU instructions into a mathematically infallible sandbox. eBPF verifies its own restricted programs; it does not guarantee interception of any bad native instruction 400 ms before a crash. See [Wasmtime security](https://docs.wasmtime.dev/security.html) and the [Linux eBPF verifier](https://docs.kernel.org/bpf/verifier.html).

18. **Treat Good Tokens as future internal accounting.** They do not create electricity, hardware, or money, and failure to validate must not remove the ability to repair code. Mint/debit accounting remains a future capability. x402 is a payment protocol; an internal SQLite credit counter is not automatically x402-compliant. Network payment settlement belongs in an explicitly enabled connected profile, not the default offline mode. See [x402](https://x402.org/).

19. **Defer mesh replication until conflict behavior is defined.** Automerge replicates its own documents/changes; it does not synchronize arbitrary SQLite tables automatically. Convergence does not erase conflicting user intent. Never prune histories on a fixed 30-day timer without a synchronization/causal-history policy that protects offline peers. See [Automerge conflicts](https://automerge.org/docs/reference/documents/conflicts/).

20. **Use scoped privacy claims.** The Origami package keeps its application state/cache in memory and avoids browser persistence APIs. This does not control OS swap, crash dumps, WebView caches, other application features, or backups. Svelte runes are compiler syntax for reactivity, not erasure controls. The browser PWA intentionally caches an offline shell. Timing jitter and DNS-over-HTTPS do not prove anonymity or air-gapping. See [Svelte runes](https://svelte.dev/docs/svelte/what-are-runes).

21. **Keep the fleet and speculative engines as separate milestones.** Inspect-A-File, NoCapSnap, Thanks Mom, HCC CCS, the thirty-agent Vanguard, voice intent, Dimensional Codex, and the hardware research engine are portfolio/specification names, rather than features bundled into this desktop build. This deliverable establishes reusable primitives for those products. Future milestone estimates need scope, platform, model, performance baseline, and acceptance fixtures; the pasted two-week/eight-week/24-month figures are not measured commitments.

## How to use the implemented flow

1. Open STRAW Desk. Records works against the actual local Accordion database.
2. Create a Topic, then a Note. Edit its text, priority, dates, and topic relation. Ordinary records are local, not encrypted secrets.
3. Initialize or unlock the Vault before protected operations.
4. In Validate project, choose a trusted local project folder, approve the native request, and read the real nine-check report. Required Rust tools must be installed. Build/test commands execute the selected project's code.
5. A clean nine-check result records a certificate with the same signer. Warnings/failures record no certificate; the report explains why. Open Ledger to see verified precedents.
6. To record your own decision, use Ledger → enter the draft → Review precedent → Approve and carve. Treat it as permanent in the application.
7. Lock the Vault when finished. Reads of precedents remain possible only while chain/checkpoint verification succeeds.

Do not validate a running executable from the same output directory on Windows: copying the CLI to another directory prevents executable-replacement failures. Desktop validation of a separate project does not face that workspace self-build limitation.

## Terminology

These definitions explain names in the supplied specifications; a definition does not certify implementation.

- **Posse Comitatus:** HCC's name for the unified sovereign workspace architecture. The “force of the county” wording is its chosen etymology, not a technical property or legal claim.
- **BSM-C:** Bespoke-Snowflake-Mechanic-Coding: a design methodology emphasizing fit to requirements, reusable structure with purposeful variation, and measured tolerances. Its formal language semantics and full marker inventory are not established by this file.
- **BSM-CODE / namespace / marker:** A named operation such as `gate.structure()` grouped by a prefix. A marker becomes executable only when code maps it to an implementation; comments alone do not enforce behavior.
- **Configuration-as-Physics:** A metaphor for enforced configuration and checks. It requires a controlled build/deployment path; local configuration can still be changed or bypassed by an administrator.
- **GEB / strange loop / isomorphism / fractal:** Gödel, Escher, Bach is the philosophical reference. A strange loop is self-reference across abstraction levels; an isomorphism is a structure-preserving correspondence; a fractal repeats patterns across scales. The HCC mapping is an analogy unless a formal correspondence is defined.
- **STRAW:** Svelte, Tauri, Rust, Axum, WebAssembly. SQLite/IEDB are the associated storage layer, not an extra letter in the acronym.
- **Svelte runes:** Compiler-recognized reactive syntax. `$state` declares reactive state, `$derived` computes dependent state, `$effect` schedules reactive side effects, `$props` receives component inputs, and `$bindable` supports two-way component bindings. Compiled Svelte still uses JavaScript runtime support.
- **Tauri / IPC / Specta / taurpc / rspc:** Tauri hosts a webview and native Rust commands. IPC means inter-process communication. Specta exports Rust type descriptions to frontend bindings. taurpc and rspc are separate RPC libraries mentioned in the source documents; this checkout uses its existing Tauri/Specta commands.
- **Axum / Tokio / Tower:** Rust HTTP routing, asynchronous execution, and composable service interfaces respectively. They are not the same thing as native IPC.
- **WASM / WASI / SIMD / Trunk / wasm-pack / wasm-bindgen:** WebAssembly is a portable instruction format. WASI defines host interfaces for Wasm programs. SIMD processes multiple lanes per instruction. Trunk builds this frontend and compute module; wasm-pack is an alternative packaging tool; wasm-bindgen generates JavaScript/Wasm bindings. “TRUNK-WASM” is HCC shorthand, not a separate instruction set.
- **IEDB / Eduba / Krypt.DB:** IEDB expands to Indubitably Eduba Database in the supplied vocabulary. Eduba denotes archival record storage here; Krypt.DB denotes the proposed encryption substrate. SQLite and SQLx alone do not make a database encrypted or immutable.
- **SQLite / SQLx / WAL / atomic transaction:** SQLite is an embedded database. SQLx is the Rust query library. WAL is a write-ahead log. An atomic transaction commits all participating database changes together or rolls them back. A separate filesystem checkpoint is outside the SQL transaction and can fail after commit.
- **Autarch / AUTARCH IDE / Konjure / RamGenie / Tailoring-Thread / A.I. Highway / Flux / Lense:** HCC names for the schema-driven development environment, orchestration, intent intake, personalization, translation pipeline, deployment, and observation systems. Capitalized names denote proposed system roles, not proof of autonomous implementation.
- **Origami.FE / Accordion.BE / Fold Stack / Blank Canvas / FoldRenderer / Zero-Route / Sovereign Action:** The shared schema-driven frontend, its Rust entity service, their pairing, the universal rendering host, recursive renderer, reduced per-entity routing, and schema query respectively. Known field types map to maintained components; an arbitrary new type does not generate a new widget by itself.
- **CRUD / schema / AST / hydration:** Create/read/update/delete; a structural data contract; abstract syntax tree; attaching interactive frontend behavior to existing markup. The desktop renders client-side; not every schema loading delay is hydration.
- **Vanguard / The Thirty / serf / custodian:** HCC's named agent roles. MASON covers structure; CRUCIBLE completeness; WEAVER integration; KEEPER archival patterns; LENS visual interpretation. VEX covers security, AEGIS encryption, PROWL tests, ARBITER policy, FORGE generation, ATLAS deployment, ECHO voice, MUSE audience, and FLUX reproducibility/deployment. These role assignments are specifications, not thirty independently running agents in this app.
- **Crucible / Nine Gates / sovereign certificate:** The actual validation library/CLI, its nine checks, and a signed record of a clean complete run. “Sovereign Certified” is an internal verdict, not legal certification or proof of zero vulnerabilities.
- **Stele / precedent / Scribe / typestate:** Stele is the evidence interface; a precedent is a permanent application record; Scribe is its carving/replay API; typestate uses distinct Rust types to restrict operations by lifecycle. The merged design creates a seal when the existing signer appends the judged record.
- **SHA-256 / BLAKE3 / Ed25519 / digest / seal / canonical preimage / domain separation:** Cryptographic hash algorithms, a signature algorithm, the resulting hash, signed evidence, the exact encoded bytes being hashed, and a distinct version/domain prefix that prevents reuse in another context. Fixed ordering and length prefixes avoid ambiguous concatenation. Cryptographic safety is probabilistic and assumption-dependent, not “detectable forever.”
- **Checkpoint / quarantine / replay / append-only:** An independently signed remembered chain head; refusal to proceed after verification failure; re-verifying historical records; accepting additions while rejecting application updates/deletes. An attacker who controls both storage and the trusted checkpoint can erase a suffix without that local evidence proving it existed.
- **Argon2 / XChaCha20-Poly1305 / AES-GCM / TEE / secure enclave:** Password-key derivation, authenticated encryption algorithms, a trusted execution environment, and a hardware-isolated execution/key environment. Only the first two named algorithms are the current vault implementation; Tauri does not automatically provide an enclave.
- **Polymorphic Engine / silicon profile / target feature / AVX-512 / NEON / Metal / NPU:** Proposed hardware-aware optimization; a capability description; an enabled compiler instruction extension; x86 vector extensions; ARM vector extensions; Apple's GPU API; a neural processing accelerator. CPU architecture detection does not grant access to every GPU/NPU backend. `raw-cpuid` targets x86/x86_64, not universal Apple ARM detection.
- **LLVM / Cranelift / JIT / IR / transpilation / fat binary / thermal throttling:** Compiler infrastructure; a code generator; just-in-time compilation; intermediate representation; translation between languages; an artifact with multiple architecture variants; reducing operating performance when heat limits are reached. JIT compilers do emit hardware-specific instructions. Cross-compilation means building for another target, not inherently compiling generic slow code.
- **Candle / local LLM / inference / tokenizer / GGUF / sidecar:** Rust ML framework; a locally run large language model; model execution; token encoding; a model-weight file format; a separate supervised worker process. Faster inference does not prove autonomous self-improvement.
- **eBPF sentinel / Baton Healer / WASI Preview 2 / capability:** A proposed monitor based on restricted kernel programs; HCC's recovery-worker name; a WASI interface generation; explicit authority to use a resource. Monitoring and sandboxing are different mechanisms; neither provides infallible native-code repair.
- **Code A Seed / CAS:** HCC's renamed pattern/creation methodology and related ecosystem label. The historical `soul.*` to `seed.*` rename is terminology, not an automatic repository migration. No acronym expansion beyond the supplied source is assumed.
- **Dimensional Codex / IRRRR / Triple Ripple / URAMG / UNDER_WHAT / THROUGH_WHAT:** Proposed intent framework; Intent, Ripple, Resonance, Recursion, Reality; primary/secondary/tertiary impact analysis; an incompletely defined taxonomy; named contextual dimensions. All eleven axes, the URAMG expansion, and the “300% capacity” measurement require a specification before implementation; they are not invented here.
- **Stuck-State / Degraded-Mode Disclosure:** An explicit report of blocked progress or reduced capability. Useful implementation requires state transitions, a recoverable action, and visible failure evidence; a name alone supplies none.
- **CoTaaS / chain-of-thought service:** A historical label in the source for staged requirements reasoning. Product evidence should expose concise decisions, assumptions, and execution plans, not promise access to a model's private internal reasoning.
- **CRDT / Automerge / mDNS / P2P / mesh:** Conflict-free replicated data structures; a document replication implementation; local multicast discovery; peer-to-peer communication; connections among peers. Convergence needs exchanged updates and compatible policies, and it does not authenticate peers.
- **Hammurabi-Handoff / JIT A2A / JWT / RBAC:** Proposed ephemeral application handoff; just-in-time application-to-application authentication; JSON Web Token format; role-based access control. Token format alone determines neither safety nor vulnerability. Lifetime, issuer, audience, scope, proof of possession, revocation, and replay behavior matter.
- **Proof of Merit Oracle / Good Tokens / x402 / mint / burn:** Proposed evidence-based credit issuer; internal compute credits; a real payment protocol; increasing/decreasing an accounting balance. They do not close a physical thermodynamic loop.
- **GHM / Good-Hari Medallion / Four-Sided Disclosure:** HCC provenance/disclosure labels. The four fields and policy are not defined sufficiently in the pasted material to claim implementation or legal compliance.
- **HCC / HHH / HCC CCS / R9 / R7 / L0–L4:** Hammurabi Coding Company; Harnessed Horde control-plane name; Concept to Creation Station; nine-pillar taxonomy; its hardware-engine pillar; the five intent/schema/marker/stack/validation stages. R9 is also used ambiguously for the ninth pillar in the sources; specify context.
- **Inspect-A-File / NoCapSnap / tma.mom / Thanks Mom / Find Me / ADHDAI / Curie Harness / Ronin Uno:** Portfolio/product names referenced in the sources. They are not bundled into this desktop build, and undocumented name expansions or capabilities are not assumed.
- **Caddy / Jitsi / Venice AI / Ollama / edge-tts / FFmpeg / EBU R128 / EXIF / ESC/POS:** Hosting server; conferencing software; an AI service; local model runner; a speech-service client; media tooling; loudness standard; media metadata; printer command language. Remote AI/TTS/conferencing services cannot be assumed offline merely because a local Rust wrapper calls them.
- **DoH / entropy injection / zero telemetry / air gap / zero recurring cost:** Encrypted DNS; deliberate randomization; absence of specified outbound usage reporting; no external network connection; absence of required subscriptions. These claims require separate threat, dependency, and deployment evidence. They are not synonyms.
- **CI/CD / lockfile / Clippy / Biome / coverage / CVE / golden fixture:** Automated build/delivery pipelines; recorded dependency resolution; Rust linting; frontend linting; executed-code measurement; a vulnerability identifier; a reviewed test input and expected result. Regex scans and coverage are useful checks with known limits, not complete audits.
- **Tier 0 / v9.99 / ascension / innovation score:** Internal ambition/version/scoring labels in the pasted specifications. No accepted engineering standard or empirically derived probability accompanies them.

## Delivery evidence

Keep the actual test/build outcomes with this record. An unsuccessful gate must remain unsuccessful until its underlying cause is fixed. Historical release holds, upstream vendor scan findings, absent mesh/auth features, and the absence of a hardware benchmark are not erased by a clean application compile.

Initial verification snapshot on October 13, 2026, using Rust 1.98.1 (superseded by the command-boundary slice below):

| Check | Observed result |
|---|---|
| Complete workspace gate run | Eight PASS results; Tests WARN; `pass_with_warnings` |
| Structure | 23/23 declared paths present; the original Gate 1 failure is closed |
| Reproducibility | 16 manifests, exact versions, lockfile present |
| Compilation | Rust and Trunk both exited successfully |
| Workspace tests and coverage | 178 passed, no failures; 78.1% line coverage against 85% |
| Workspace lint | No errors or warnings in the gate; the stricter all-target/all-feature check also passed before the final child-process compatibility adjustments |
| Crucible regression suite | 51 tests passed, including refusal of partial/duplicate/warned reports and failure of a frontend despite a successful Rust build |
| Real signing integration | A temporary project passed all nine checks; its certificate used the existing signer, remained readable, and reuse of its consumed approval was rejected; verified under coverage too |
| Frontend and desktop | The native Svelte compiler built the shared renderer and desktop views; a packaged-protocol debug build and native window launch succeeded |
| Native interaction | Window/navigation observed; clicking through the new views remains unverified because the Windows helper reported unavailable input geometry |
| Git | Rewritten `crates/stele` and `Cargo.lock` re-staged; no commit or push performed |

The initial machine-readable gate results are in [workspace-report.json](target/review-cli/workspace-report.json); its measured source coverage is in [coverage.json](target/review-cli/coverage.json). These are generated review artifacts, not signed certificates.

The initial coverage identified native command adapters at 31.4%, inference at 37.6%, the archival server at 44.9%, and frontend build tooling at 65.1%. Accordion was at 89.5%, Security at 89.9%, and Stele at 97.2%. These were module line-coverage figures, not authentication-specific scores. That snapshot did not meet the unchanged 85% workspace target.

Two environmental defects were corrected rather than suppressed: nested project checks no longer inherit the outer coverage runner's private compiler settings, and Trunk receives a compatible boolean color setting when the terminal uses `NO_COLOR=1`. Neither fix weakens a gate. Ordinary application records remain unencrypted, and the previously documented G3 vendor-source release hold remains in place.

### Command-boundary slice — October 13, 2026

Ten new native tests invoke the actual generated Tauri command handlers with managed local stores and the existing signer. They cover schema-driven records and relations, vault lifecycle and single-use unsealing, stale document revisions and vectors, workflow history, verified precedents, approved exports, unavailable model resources, ledger quarantine, and assisted generation/refinement. Native approval dialogs remain an operator interaction; test grants simulate prior approval while exercising real digest binding and consumption. The local HTTP service is a bounded protocol fixture, not an LLM or a performance benchmark. Test writes use temporary directories beneath the workspace's ignored `target` directory.

The shared Windows build now embeds the Common Controls manifest for native unit tests as well as the application. Crucible includes XML configuration in its SHA-256 source evidence, with a regression proving edits/deletion are detected while generated XML remains excluded. The required-file manifest declares the Windows manifest and new test inputs. The SQLx archive queries use static statements and bound values rather than bypassing SQL safety; two regression tests preserve all five Eduba tables, SQL-shaped text and WAL records, and reject invalid types/extra columns. Blocking archive commands own cloned store handles.

| Check | Final observed result |
|---|---|
| Complete workspace gate run | All nine PASS; `sovereign_certified`; stable reviewed inputs |
| Structure | 30/30 declared paths present |
| Compilation | Rust workspace and Trunk frontend both exited 0 |
| Tests and coverage | 204 tests passed in the coverage run; 85.6% line coverage against the unchanged 85% target |
| Native command/library tests | All 25 passed, including ten new command-boundary tests |
| Evidence regression | Both source-evidence tests passed, including Windows XML changes |
| SQL safety regression | Both archive-query tests passed |
| Lint | Full workspace gate: zero errors/warnings; stricter native/storage all-target checks also passed |
| Chain and signer | Existing SHA-256 chain and signer retained; no BLAKE3 dependency introduced by this slice |

The final gate report is [next-slice-final-report.json](target/review-cli/next-slice-final-report.json), with measured coverage in [next-slice-coverage.json](target/review-cli/next-slice-coverage.json). Earlier attempts remain in [next-slice-report.json](target/review-cli/next-slice-report.json) and [next-slice-stable-report.json](target/review-cli/next-slice-stable-report.json): Windows rejected rebuilding a running validator on the first attempt, and concurrent work changed reviewed source during both attempts. Running a separate copy after the shared checkout stopped changing resolved those failures without weakening a gate.

Measured module coverage is now native 76.5%, inference 59.8%, Accordion 90.9%, Security 90.0%, Stele 97.2%, storage 96.3%, archival server 44.9%, and frontend build tooling 65.1%. Workspace growth and concurrent archive work are included in these measurements. Module percentages are not authentication-specific coverage or proof of correctness.

The CLI's `sovereign_certified` result means its nine checks passed for the reviewed source snapshot. This run supplied no vault signing options and wrote no certificate to the operator's vault. Signing remains available through the existing unlocked-vault approval flow. These generated artifacts are not a production release clearance or a final-binary attestation. Manual desktop interaction, the documented G3 vendor-source release hold, and ordinary records' lack of database-wide encryption remain unchanged. This documentation update follows the final code-verification snapshot.
