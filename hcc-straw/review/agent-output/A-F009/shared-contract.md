# A-F009 downstream contract

Users routes are live in the shared Rust/SQLite service and registered in lib.rs.
- GET/POST /api/users: admin only. POST strict email/password/username?/role?/firstName?/lastName?; roles user(default)/moderator/admin only, normalized email/username, Argon2id credentials, persisted profile and flags.201 UserDto envelope; conflicts409.
- GET /api/users?page=1&limit=10&search=: positive u32 decimal page/limit; limit capped100. Unknown/duplicate query keys400. Literal case-insensitive search email/username. Stable created_at/id ordering. Envelope data:{data:UserDto[],meta:{page,limit,total,pages}}.
- GET /api/users/:id:64 lowercase hex ID; owner or admin only. No speculative account PUT route.
- GET/PUT /api/users/profile: current authenticated user; fields firstName/lastName/bio/website/location/avatarUrl. Optional omitted/null fields preserve value; empty string clears. Bounds100/100/2000/2048/200/2048 bytes; no control characters; nonempty website/avatarUrl references must be HTTP(S) URLs with host and no credentials. No URL is fetched.
- POST /api/users/avatar:401 without valid credential;501 UNSUPPORTED for authenticated user, no storage transfer. Services currently return equivalent local501 without HTTP.
- Next handlers use fixed proxyBackend and preflightResponse with their actual methods; dynamic IDs are encodeURIComponent encoded before helper runtime validation, preventing decoded slashes from becoming path segments.

Shared auth helper approved by root: `ValidSession::revalidate(&rusqlite::Connection)->ApiResult<UserDto>` checks persisted hash/revocation/expiry/active and loads current identity/role without nested Store locking. Use initial auth validation, then immediate SQLite transaction, revalidate within it and apply fresh role/ownership before writes. Never rely on the earlier session.user role for a delayed mutation. All SQLite/password work remains spawn_blocking.

F008 may now consume users.rs router and auth helper while adding projects.rs and its serialized lib.rs registration. Existing tables/store.rs and manifests were unchanged. Backend8 test groups and126 compiled handler HTTP assertions pass; full Next/browser/page integration remains A-S04/A-F003.
