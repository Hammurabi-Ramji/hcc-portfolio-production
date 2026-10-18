# Folder review 083 — ZAP hosting documentation

Scope: `C:\IEDB\STRAW SaaS Generator\components\zap_hosting_management\docs`, direct files only. All four Markdown files were read with numbered lines: deployment workflow builder (780 lines), Docker deployment (689), integration summary (455), and quick reference (377). No applicable ancestor AGENTS.md was found. The adjacent component root and scripts folder contain no direct files; this component currently delivers documentation, not deployment tooling.

## Intended behavior and evidence

These guides promise a reproducible hosted workflow application, HTTPS, service management, monitoring, persistent SQLite, and recoverable daily backups. Generator `docs/README.md:3` describes a Svelte/Tauri/Rust/Axum/WASM desktop-first stack; `docs/EXPANDED_SAAS_FRAMEWORK.md:35` calls infrastructure shells ready to customize. In contrast, `docs/FINAL_VERIFICATION_REPORT.md:7,41` asserts production completion. Stack `output/WEB_PLATFORM_SUMMARY.md:163-169` still lists real backend integration and production Docker configuration as future work. The component is selected by `core/config.json:48`; its documentation does not substantiate these completion claims.

## Prioritized findings and concrete patch targets

1. **P1 — Backup retention deletes application data.** `ZAP_HOSTING_DOCKER_DEPLOYMENT.md:505` deletes every old `*.db` under the live `data` directory. Compose mounts that directory at `/data` (83), and the configured active database is `/data/workflows.db` (78). An idle database older than seven days is eligible for deletion. Replace this line with retention limited to the dedicated backups directory and an explicit generated backup-name pattern; never apply age-based cleanup to application data.

2. **P1 — Documented startup artifact has no demonstrated repository producer.** Deployment guide 278, quick reference 48, and Docker guide 169,182 require `dist/background.js`. Deployment guide 25-28 identifies React/Tauri while 245-253 builds a Rust binary that the service never starts. The actual Stack web manifest (`apps/web/package.json:7-8`) builds and starts Next.js; its desktop Cargo manifest names `straw-stack` (2). No application or executable scripts exist in this hosting component. Rewrite all three runbooks around a named supported application path, real build artifacts/start command, consumed environment variables, port, and endpoint contract; separate desktop packaging from web hosting. Update integration summary 329-346,421-446 to real repository links and qualify readiness until validated.

3. **P2 — Restore example cannot consume its own backup format.** Docker guide 477/497 creates a binary SQLite `.backup`; 525 pipes that file into SQLite's SQL input. Replace with a stopped-service file restore or SQLite `.restore`, verify integrity, ownership, and expected records before restarting. Traditional guide 454-460 archives a live database without a consistent SQLite snapshot and then compresses an already gzipped archive again. Use SQLite backup first, one archive step, fail-fast error handling, and matching restore instructions. Quick reference 192-195 writes `/backups` without creating it, contrary to its documented `/var/backups/workflow-builder` layout (224); align paths.

4. **P2 — Fresh HTTPS bootstrap is ordered incorrectly.** Traditional guide 331-332 references nonexistent certificates, tests/reloads Nginx at 387-390, then requests certificates at 407. Docker guide similarly starts TLS Nginx at 335 before certificate creation at 358. Define an HTTP-only issuance stage, then enable TLS; ensure standalone issuance can own port 80 and document renewal/reload hooks.

5. **P2 — Operational checks are incomplete or misleading.** Docker runtime 159-179 installs neither curl nor sqlite3 despite health/backup commands requiring both (89,413,497). Add these tools or use available alternatives. Traditional guide 375-378 always returns health success even when the backend fails; proxy a real readiness endpoint. Its keep-alive cron at 65 overwrites existing cron entries and merely fetches a public login page: remove this substitute for authenticated account activity. Provider plan/retention claims remain externally unverified.

## Dependencies, acceptance, and confidence

Depends on web/backend owners establishing the supported deployable artifact and persistence contract. High confidence in the cited internal contradictions; no deployment, installation, network validation, or broad tests were executed.

- [ ] Reconcile all four documents with actual supported application/build paths and remove unsupported readiness claims.
- [ ] Validate runbooks in an isolated fresh Linux environment, including first certificate issuance and failed-backend health checks.
- [ ] Prove backup/restore preserves seeded records and retention never deletes live or unrelated databases.
- [ ] Verify runtime tools, executable monitoring scripts, renewal, and non-root service permissions.
