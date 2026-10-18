# Consumer import notes (STACK-F026)

Owned by `apps/web/types`. Other folders apply these imports; this folder does not edit them.

| Owner | Folder | Runtime | Types |
| --- | --- | --- | --- |
| F021 | `apps/web/lib` | `export { api }` from `api-client.ts` | `import type { ApiResponse, … } from '../types'` |
| F024 | `apps/web/services` | `import { api } from '@/lib/api-client'` | `import type { … } from '@/types'` |
| F019 | `apps/web/context` | use `AuthService` / services | `import type { … } from '@/types'` |

**Forbidden:** `import { api } from '@/types'` — this barrel never exports `api`.

**Envelope:** services return the client’s single `ApiResponse<T>` unchanged. Lists are `ApiResponse<PaginatedResponse<T>>` (JSON `data.data` + `data.meta`), not `{ users }` / `{ projects }` keys and not a second envelope wrap.

**Timestamps:** wire DTOs use `IsoTimestamp` (string). Optional `*Domain` types use `Date` only after explicit UI-boundary hydration.
