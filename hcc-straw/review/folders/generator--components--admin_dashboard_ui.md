# components/admin_dashboard_ui

Reviewed the sole direct file, `AdminDashboard.svelte` (61 lines); no nested folders, manifests, or ancestor AGENTS.md exist. The component is reusable starter UI: caller-supplied `users` and `metrics` render two summary cards and a user table, with scoped styling. Root README describes copied starter bundles; `docs/EXPANDED_SAAS_FRAMEWORK.md:34` permits customizable UI shells. 

**P2 — functional-management claim exceeds implementation.** `AdminDashboard.svelte:5–7` only logs actions; the Deactivate/Delete buttons at lines 43–44 neither change user state nor expose a callback/event. This is a gap against `docs/FINAL_VERIFICATION_REPORT.md:7–10`, which claims no placeholders and fully functional user management, rather than a display defect. There is no revenue/user data loading here.

Integration evidence: `core/controller.py:145` includes the component in template defaults, but lines 90–96 only copy its folder. Targeted searches found no dashboard import in generator `frontend_svelte`, desktop routes, or web source. Thus inclusion does not establish a mounted application screen.

Concrete patch: document starter status and supplied prop shapes; correct the verification claim. If operational administration is required, add an async action callback/event contract, pending/error UI, and host-side authorized persistent user operations. Mount it explicitly in the consuming frontend; depend on the host authentication/user service and Svelte toolchain.

- [ ] Align documentation and integration instructions.
- [ ] For functional mode, verify deactivate/delete persist, failures leave displayed state consistent, and unauthorized operations fail.

Confidence: high for static findings. No builds, browser checks, or backend tests run.

