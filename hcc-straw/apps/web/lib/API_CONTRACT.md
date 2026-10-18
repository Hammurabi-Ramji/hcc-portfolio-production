# apps/web/lib — API origin, envelope, and consumer contract

This file is the lib-owned publication for STACK-F021 remaining acceptance.
It does **not** claim that end-to-end web authentication is proven; it documents
origin, envelope, and the endpoints this tree is wired to reach.

## API origin (browser)

| Layer | Origin / base | Auth |
| --- | --- | --- |
| Browser `ApiClient` | same-origin `baseURL: '/api'` | `withCredentials: true` (HttpOnly cookie) |
| Next route handlers | `proxyBackend(request, '/api/…')` | forwards `cookie` + `origin` only |
| Rust/Axum service | `http://127.0.0.1:${STRAW_API_PORT}` (default **3001**) | validates session cookie |

Environment for the server-only proxy (`backend-proxy.ts`):

- `STRAW_API_PORT` — integer 1–65535, default `3001`
- `STRAW_WEB_ORIGIN` — exact local HTTP(S) origin, default `http://localhost:3000`
  (localhost or 127.0.0.1 only; no credentials, path, query, or fragment)

There is **no** public browser env override of the API host. Mutating requests
without a matching Origin receive structured `403 FORBIDDEN_ORIGIN` before
transport. Do not claim “web authentication works” until these loopback
endpoints are live and cookie round-trips are observed by their owners.

## Envelope contract (one unwrap)

Authoritative wire types live in `apps/web/types` (`ApiResponse<T>`).

`ApiClient` success interceptor returns the Axios transport unchanged. Each
method requests `ApiResponse<T>` and returns `response.data` **exactly once**.

| Kind | Shape retained by `api.*` |
| --- | --- |
| Singular success | `{ success: true, data: T }` |
| Auth success | `{ success: true, data: { user } }` |
| List success | `{ success: true, data: { data: T[], meta } }` |
| Void success | `{ success: true, data: null }` |
| Structured HTTP failure | rejected / returned as `{ success: false, error: { code, message, … } }` |
| Non-envelope HTTP / network | `{ success: false, error: { code: 'HTTP_ERROR' \| 'NETWORK_ERROR', … } }` |

Compatibility entry: `apps/web/lib/api.ts` re-exports the same singleton.
Legacy `utils` token helpers are deprecated and are **not** read by `ApiClient`.

## Implemented / proxied endpoints

Browser paths are relative to `/api` (services omit the `/api` prefix).
Next `app/api/**/route.ts` owners call `proxyBackend` with the full `/api/…`
constants below.

### Auth (`/api/auth/*`)

| Method | Browser path | Proxy path | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | `/api/auth/login` | `LoginRequest` → `AuthResponse` |
| POST | `/auth/register` | `/api/auth/register` | `RegisterRequest` → `AuthResponse` |
| POST | `/auth/logout` | `/api/auth/logout` | void |
| GET | `/auth/me` | `/api/auth/me` | `User` |
| POST | `/auth/refresh-token` | `/api/auth/refresh-token` | `AuthResponse` |
| GET | `/auth/verify-email` | `/api/auth/verify-email` | may be truthful `501` |
| POST | `/auth/forgot-password` | `/api/auth/forgot-password` | may be truthful `501` |
| POST | `/auth/reset-password` | `/api/auth/reset-password` | may be truthful `501` |

### Users (`/api/users*`)

| Method | Browser path | Proxy path |
| --- | --- | --- |
| GET | `/users/profile` | `/api/users/profile` |
| PUT | `/users/profile` | `/api/users/profile` |
| GET | `/users/:id` | `/api/users/:id` |
| GET | `/users` | `/api/users` (page/limit/search) |
| — | avatar upload | **unsupported** locally (`501` from services; no lib upload claim) |

### Projects (`/api/projects*`)

| Method | Browser path | Proxy path |
| --- | --- | --- |
| GET/POST | `/projects` | `/api/projects` |
| GET/PUT/DELETE | `/projects/:id` | `/api/projects/:id` |
| PATCH | `/projects/:id/archive` | `/api/projects/:id/archive` |
| PATCH | `/projects/:id/activate` | `/api/projects/:id/activate` |

Root `GET/OPTIONS /api` is also proxy-capable via `BackendPath` `/api`.

## Required consumer import changes (outside `lib/`)

Lib cannot edit these folders. Owners must apply (or retain) the following.

### F026 — `apps/web/types`

- Own the shared `ApiResponse` / `PaginationParams` / DTO definitions.
- Export **types only**; never a runtime `api` singleton from `@/types`.
- Keep cookie `AuthResponse = { user }` (no public access-token success shape).

### F024 — `apps/web/services`

- Runtime import: `import { api } from '@/lib/api-client'` (not `./api`, not `@/types`).
- Return the client’s `ApiResponse<T>` **unchanged** (no second envelope wrap).
- Call paths without a second `/api` prefix (`api.post('/auth/login', …)`).
- Prefer type-only imports from `@/types`.

### F019 — `apps/web/context`

- Do **not** `import { api } from '@/types'`.
- Consume `AuthService` from `@/services/auth.service` (which uses `@/lib/api-client`).
- Treat `response.success` / `response.data` / `response.error` as the one envelope.
- Session via cookies + `/auth/me`; do not write Bearer tokens to `localStorage`.

### Observed current tree (2026-10-18)

Services and AuthContext already follow the imports above. Full-tree web
type-check/build remains an integration gate when the quarantined `apps/web`
tree is type-clean end-to-end; lib-scoped compile is the own-folder gate.
