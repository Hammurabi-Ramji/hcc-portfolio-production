# A-F019 shared session contract (read-only coordination)

F019 owns only `apps/web/context/**`. Downstream owners must preserve these
agreements; F019 does not edit `lib/` (F021) or `middleware/` (F022).

## Session transport (middleware ↔ client)

| Layer | Contract |
|-------|----------|
| Cookie name | `straw_session` |
| Cookie flags | HttpOnly, SameSite=Strict, Path=/; Secure when origin is HTTPS |
| Client | `api` singleton `withCredentials: true`, `baseURL: '/api'` — never Bearer/`localStorage` |
| Provider | Cookie mutations via `AuthService` only; `/auth/me` hydration; no token state |
| Middleware | Presence of `straw_session` is a navigation hint only; API rejects forged/expired cookies |
| Logout | `POST /auth/logout` must clear the server session (`Set-Cookie` expiry); replayed cookie fails `/auth/me` and refresh |

## Envelope (F021 / F026)

- One `ApiResponse<T>` per HTTP response.
- Login/register success payload: `AuthResponse` = `{ user }` (no accessToken in cookie mode).
- `GET /auth/me` → `ApiResponse<User>`; void ops → `data: null`.
- Failures retain `error.status` when present (401 vs 403 logout semantics).

## Layout mount (A-S13 / A-F004)

Root layout must wrap children with `<AuthProvider>` from `@/context/AuthContext`.
Consumers call `useAuth()` only under that provider.
