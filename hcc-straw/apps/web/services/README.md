# apps/web/services

Typed clients for the same-origin `/api` surface. Every supported method returns the
canonical `ApiResponse<T>` envelope from `@/lib/api-client` unchanged. Ownership,
session validity, and persistence are enforced by the local Rust/SQLite API; these
classes do not store credentials or invent success.

## Supported operations

| Service | Methods | Paths |
| --- | --- | --- |
| `AuthService` | login, register, logout, getCurrentUser, refreshToken | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh-token` |
| `AuthService` | verifyEmail, requestPasswordReset, resetPassword | `GET /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password` (backend returns HTTP 501; no email transport) |
| `UserService` | getProfile, updateProfile | `GET/PUT /users/profile` |
| `UserService` | getUserById, listUsers, searchUsers | `GET /users/:id`, `GET /users` with `page`/`limit`/`search` (list/search are admin-only on the server) |
| `ProjectService` | getProjects, getProjectById, createProject, updateProject, deleteProject | `GET/POST /projects`, `GET/PUT/DELETE /projects/:id` |
| `ProjectService` | archiveProject, activateProject | `PATCH /projects/:id/archive`, `PATCH /projects/:id/activate` |

Pagination defaults to `page=1`, `limit=10`; finite inputs are floored, page ≥ 1, limit clamped 1–100, and `search` is trimmed. Resource IDs are `encodeURIComponent`-encoded. Cookie session credentials are never written to browser storage by these services.

## Unsupported storage (do not advertise as available)

There is **no** local file or avatar storage backend and **no** `/api/files/*` route family.

- `FileService` (`uploadFile`, `uploadFiles`, `getFile`, `deleteFile`, `getUserFiles`) returns a typed `UNSUPPORTED` / HTTP 501 envelope **before any transport**. Compatibility method names remain so callers compile; they must not be documented as working upload/download APIs.
- `UserService.uploadAvatar` likewise returns local `UNSUPPORTED` / 501 with no request and no profile mutation. The backend also exposes `POST /users/avatar` as authenticated 501; this client does not simulate an upload or invent a URL.
- Profile `avatarUrl` may hold an HTTP(S) text reference after `updateProfile`; that is not file transfer.

Do not claim production file storage, multipart upload success, batch upload partial success, or download URLs from these classes.
