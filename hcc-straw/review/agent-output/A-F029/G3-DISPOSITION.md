# G3 literal source-scan — disposition (A-F029)

Date: 2026-10-18  
Owner: A-F029 (`straw-app` root)  
Gate: whole-tree literal source scan  
Status: **FAIL — release hold OPEN**

## Arbitration (binding)

From `review/arbitration.md` (2026-10-09 human decision):

- Whole-tree literal source-scan gate remains **release-blocking**.
- No vendor exception was approved.
- Source identifiers / license notices must **not** be disguised to produce a pass.
- Remediation and evidence collection may proceed; **release promotion remains blocked**.
- W4 may report pending gates but cannot certify release.

From `review/remediation-request.md`: S16 owns the final disposition ruling. No gated slice may advance past W3 until S16 records that ruling. A-F029 tracks evidence and keeps the hold explicit; it does not clear the gate.

## Documented failure (unchanged)

`straw-app/STRAW-001-VERIFICATION.md` (2026-10-09):

| Gate | Result | Evidence |
|---|---|---|
| G3 — literal source scan | FAIL | Complete app source-tree scan, excluding generated outputs, matches **95** upstream Svelte files; first-party files have zero matches. Upstream identifiers are retained. Compiler replacement does not resolve this literal requirement. |

Mechanism: the desktop path vendors the upstream Svelte 5.57.1 browser runtime under `third-party/svelte` (and emits copies into generated `public/ui/vendor/`). A literal whole-tree scan that includes those sources matches upstream identifiers by design.

## What does **not** clear G3

- Native `rsvelte_core` compiler replacement (already done; still FAIL).
- Fresh staging / stale-output fixes (A-F050 DONE).
- Packaging notices / license copies (F047/F049/F050).
- Observed UI / installer success (A-S15).
- Disguising, renaming, or stripping upstream identifiers/licenses to force a vacuous pass (**forbidden**).

## Disposition options (for S16 / human only)

1. **Keep hold** — current state; release blocked until policy changes.
2. **Policy change** — human-approved exception or narrowed scan scope (e.g. first-party-only) recorded in arbitration; not invented by folder agents.
3. **Compliant redesign** — remove or replace vendored upstream sources that trip the literal gate, without disguising identifiers.

Until one of (2) or (3) is human-cleared in arbitration, **release hold stays open**.

## Cross-links

- Failure table: `straw-app/STRAW-001-VERIFICATION.md`
- Package notice: `straw-app/README.md` (Verification status)
- Provenance: `straw-app/third-party/NOTICE.md`
- Parent evidence: `review/agent-output/A-F029.md`
