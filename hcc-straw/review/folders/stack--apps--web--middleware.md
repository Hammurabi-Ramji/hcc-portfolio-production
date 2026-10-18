# apps/web/middleware — folder review

**Inventory/evidence:** `Get-ChildItem -Force` confirms zero direct files or children. The implementation lives at `apps/web/middleware.ts`, outside this directory; `tsconfig.json:25` includes that root TypeScript file. No applicable ancestor AGENTS.md was found.

**Current versus specified:** `output/WEB_PLATFORM_SUMMARY.md:66–67,211` claims JWT sessions, protected routes and validation. The empty container has no independent required behavior. Root middleware instead checks cookie presence, leaves validation TODO (`middleware.ts:4,24,29`), excludes API paths (`:51`), and lacks the `NextRequest` import (`:1–3`). These integration defects and concrete patch targets are already owned by `review/folders/stack--apps--web.md`; no duplicate implementation belongs here.

**Dependencies/acceptance:** Resolve that root report’s session/import fixes; verify authenticated, expired and forged-cookie requests plus public auth/API routing. High confidence in inventory; no tests run here (saved `review/web-type-check.log:26` confirms the import error).

- [ ] Complete root middleware acceptance checks; retain or remove this unused directory as housekeeping.
