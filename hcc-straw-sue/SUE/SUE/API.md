# SUE API Documentation

**Runtime version target:** `5.0.0`  
**Audit state:** current API surface is partially verified

## Extension message families

| Family | Messages |
| --- | --- |
| Storage | `STORE_GET`, `STORE_SET` |
| Auth/session | `AUTH_LOGIN`, `AUTH_LOGOUT`, `SESSION_GET`, `SESSION_REFRESH` |
| Projects | `PROJECT_LIST`, `PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_DELETE` |
| Notes | `NOTE_LIST`, `NOTE_CREATE`, `NOTE_UPDATE`, `NOTE_DELETE` |
| Tabs | `TAB_LIST`, `TAB_CLOSE`, `TAB_PIN`, `TAB_SEND_MESSAGE`, `TAB_CREATE_SESSION`, `TAB_GET_SESSION` |
| Page integration | `PAGE_GET_CONTEXT`, `PAGE_INJECT_SIDEBAR` |
| Agents/memory | `AGENT_*`, `MEMORY_*`, `SUEWARM_*` |

## Local API routes

Base URL: `http://127.0.0.1:8080/api/v1`

```text
GET    /status
GET    /audit

POST   /auth/register
POST   /auth/login
POST   /auth/refresh

GET    /projects
POST   /projects
PATCH  /projects/:id
DELETE /projects/:id

GET    /notes
POST   /notes
PATCH  /notes/:id
DELETE /notes/:id

GET    /memories
POST   /memories
PATCH  /memories/:id
DELETE /memories/:id
```

Test helper routes used by automation:

```text
GET  /test/enabled
GET  /test/page
POST /test/reset
POST /test/seed
```

## Response shape

```json
{ "success": true, "data": {} }
{ "success": false, "error": "message" }
```

Some handlers return named payloads such as `session`, `context`, or `task` instead of `data`; check `background.js` and `local-api-server.js` for the exact runtime shape.

## Current caveat

`TAB_SEND_MESSAGE` and the broader page/content-script path are **not fully healthy right now**. The observed E2E failure is:

```text
Could not establish connection. Receiving end does not exist.
```

That aligns with the current `content.js` source defect and should be treated as the top debugging target for page integration.
