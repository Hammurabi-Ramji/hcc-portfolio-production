# ZAP hosting scripts review

Inventory: `components/zap_hosting_management/scripts` has zero direct files, including hidden files; no applicable ancestor AGENTS.md exists. Current tooling consists of documentation snippets, not packaged scripts. `docs/ZAP_HOSTING_INTEGRATION_SUMMARY.md:169` promises included health-check scripts; `docs/ZAP_HOSTING_DEPLOYMENT_WORKFLOW_BUILDER.md:440,560` instead creates scripts manually. Generator registration (`core/config.json:48`) and copying (`core/controller.py:94-96`) cannot supply missing executables. This is a packaging/claim gap, not proof deployment fails. Global completion claims (`docs/FINAL_VERIFICATION_REPORT.md:7`) are unsupported here.

Proposed patch: extract parameterized backup/health scripts into this folder or explicitly document manual-only scope. Dependencies: Linux bash, systemd, tar, certbot, mail, configured database/service paths. Confidence: high for inventory; execution unverified. No source edits or tests performed.

- [ ] Reconcile included-script claims with delivered files.
- [ ] If scripts ship, require syntax checks, failure exit codes, a disposable backup/restore check, and generated-output presence verification.
