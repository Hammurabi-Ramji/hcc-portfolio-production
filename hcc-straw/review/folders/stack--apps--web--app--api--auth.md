# Auth API folder review

Inventory: `apps/web/app/api/auth` contains zero entries, including hidden entries. No ancestor `AGENTS.md` applies.

**P1 — Missing authentication handlers.** `context/AuthContext.tsx:57,87,116,130` calls login, register, logout, and me. `services/auth.service.ts:96,117,135,156` additionally specifies refresh-token, verify-email, forgot-password, and reset-password. None exists here. `apps/web/README.md:85–92,188` promises these capabilities; `output/WEB_PLATFORM_SUMMARY.md:164` acknowledges the backend connection remains pending. An external backend remains possible: `lib/api-client.ts:32–34` defaults to port 3001.

Patch: document backend ownership; add named GET/POST App Router handlers in endpoint subdirectories or connect the external service. Dependencies: persistent users/sessions, password hashing, signing keys, expiring verification/reset tokens, email delivery, and one response envelope. Coordinate imports/decoding with services/context owners and cookie transport with middleware ownership (`middleware.ts:4,51`).

- [ ] Implement eight endpoint contracts with validation and appropriate statuses.
- [ ] Verify register/login → me → refresh → logout, reload persistence, expired/forged-token rejection, and single-use reset/verification.

Confidence: high for the folder gap; static inspection only, no runtime checks.
