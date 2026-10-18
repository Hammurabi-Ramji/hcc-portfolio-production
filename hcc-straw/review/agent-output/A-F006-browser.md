# A-F006-browser — DONE

Remaining acceptance for STACK-F006: **Verify credentialed cross-origin calls to child endpoints in a real browser** (HTTP handler matrix already passed in A-F006).

Wave follow-up, 2026-10-18. **No `apps/web/app/api/**` source edits** — handlers/CORS from A-F006 already correct; this is evidence-only.

## Boundary

| Layer | What ran |
| --- | --- |
| Browser | Playwright → Google Chrome `156.0.8078.36` (headless) |
| Page origin | Ephemeral `http://localhost:<pagePort>` (`STRAW_WEB_ORIGIN`) |
| API origin | Ephemeral `http://localhost:<apiPort>` (compiled App Router handlers) |
| Backend | Real `apps/api/target/debug/straw-web-api.exe` + isolated SQLite |
| Not claimed | Next CLI/dev server, full web build, users/projects child ownership |

Cross-origin by **port** on `localhost` (same-site for `SameSite=Strict` cookies; CORS still enforced). Cookie jar is browser-owned (`credentials: 'include'`).

## Command and exit

```text
COMMAND: node review/agent-output/A-F006/browser-cors-verify.cjs
EXIT: 0
```

Artifacts:

- `review/agent-output/A-F006/browser-cors-verify.cjs` — harness
- `review/agent-output/A-F006/browser-cors-results.json` — machine-readable evidence
- `review/agent-output/A-F006/logs/browser-cors-current.log` — command/results log

Observed origins this passing run:

- `pageOrigin`: `http://localhost:53381`
- `apiOrigin`: `http://localhost:53382`
- `backendPort`: `53383`
- `evilOrigin`: `http://localhost:54566`

## Assertions (13/13 PASS)

Browser fixture (`fetch` + credentials) against child routes:

1. `register_201` — credentialed POST `/api/auth/register` → 201, `type=cors`
2. `register_cors_readable` — cross-origin body readable
3. `me_200_cookie` — GET `/api/auth/me` with session cookie → 200 + matching email
4. `me_cors_readable` — me response CORS-readable
5. `logout_200` — credentialed POST `/api/auth/logout` → 200
6. `logout_cors_readable` — logout CORS-readable
7. `me_401_after_logout` — me after logout → 401
8. `me_after_logout_cors` — 401 still CORS-readable under allowed origin
9. `bare_api_404_cors` — GET `/api` → 404 CORS-readable

Adapter / preflight (server log; ACAO not exposed via JS `headers.get()`):

10. `browser_preflight_register` — browser OPTIONS `/api/auth/register` → 204, exact `Allow-Origin`, `Allow-Credentials: true`, `Access-Control-Request-Method: POST`
11. `browser_preflight_logout` — same for `/api/auth/logout`
12. `adapter_register_origin_cors` — POST register Origin matched `STRAW_WEB_ORIGIN`; response ACAO/ACAC set; status 201

Negative:

13. `evil_origin_no_acao` — page on alternate localhost port; credentialed fetch to API → `TypeError: Failed to fetch` (no allow-origin for disallowed origin)

## Sample adapter request log (excerpt)

```json
{
  "method": "OPTIONS",
  "url": "/api/auth/register",
  "rawOrigin": "http://localhost:53381",
  "acrm": "POST",
  "status": 204,
  "acao": "http://localhost:53381",
  "acac": "true"
}
{
  "method": "POST",
  "url": "/api/auth/register",
  "rawOrigin": "http://localhost:53381",
  "status": 201,
  "acao": "http://localhost:53381",
  "acac": "true"
}
{
  "method": "GET",
  "url": "/api/auth/me",
  "status": 200,
  "acao": "http://localhost:53381",
  "acac": "true"
}
```

## Notes

- Harness must set `STRAW_WEB_ORIGIN` **before** spawning Rust: the Axum boundary also rejects unsafe methods whose `Origin` ≠ configured web origin (`FORBIDDEN_ORIGIN`).
- Scripted `fetch(OPTIONS)` cannot set forbidden `Access-Control-Request-*` headers; real preflights are those Chrome emits for non-simple credentialed POSTs.
- Browsers do not expose `Access-Control-Allow-Origin` via `response.headers.get()`; Playwright/adapter logs are the ACAO evidence channel.
- HTTP matrix (1,205 assertions) remains in A-F006; this file only closes the deferred **real-browser** child credentialed CORS check.

## Settlement

`A-F006-browser | apps/web/app/api remaining browser CORS | DONE | 0 source files | Chrome 156 + compiled handlers + Rust/SQLite | 13/13 PASS exit 0 | blocker:none | review/agent-output/A-F006-browser.md`
