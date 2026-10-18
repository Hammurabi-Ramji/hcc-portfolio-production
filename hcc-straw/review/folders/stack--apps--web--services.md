# Review 102 — apps/web/services

## Inventory and specified behavior

Read all direct files, with numbered lines: `auth.service.ts` (170), `file.service.ts` (165), `project.service.ts` (173), and `user.service.ts` (158). They expose static classes and aliases for authentication, file uploads/metadata, project CRUD/status changes, and user/profile operations. No applicable ancestor `AGENTS.md` was found. Reviewed adjacent clients/types, API route inventory, auth context, project/settings callers, package/TypeScript/Next configuration, root README, and relevant generator/Stack guide sections.

`apps/web/SETUP_GUIDE.md:34–46,217–244` promises these services and 20+ API routes; `apps/web/README.md:3,185–193` claims production readiness. Generator `docs/README.md:44–54` and `docs/EXPANDED_SAAS_FRAMEWORK.md:9–10,35` specify authentication/API/profile/storage capabilities. These establish intent, not proof. Stack `output/WEB_PLATFORM_SUMMARY.md:164–166` explicitly leaves real API/email/upload functionality outstanding; the desktop verification report does not verify these web contracts.

## Prioritized findings

1. **P1, proven build blocker:** Every service imports named `api` from missing `./api` at line 1. Only `lib/api-client.ts:185` supplies that named singleton; `lib/api.ts:57` is a different default export. Project/settings pages import these services (`app/projects/page.tsx:8`, `app/settings/page.tsx:8`), so the defect reaches real pages.

2. **P1, incompatible response contract:** Services manufacture `{success:true,data:response}` and suppress type checking with assertions (`auth:15–19`, `file:35–44`, `project:34–40`, `user:139–145`). The intended client declares `Promise<ApiResponse<T>>` (`lib/api-client.ts:98,112`), which would produce nested envelopes. Currently its interceptor unwraps the Axios response at line 58 and its methods unwrap again at lines 101/115: this accidentally cancels service wrapping for successful singular payloads, while contradicting its declared type. Repairing either layer alone is insufficient. Void operations also discard returned logical failures (`auth:57–58`, `file:123–124`, `project:123–124,141–142,159–160`), reporting success for a resolved `{success:false}`.

3. **P1, concrete local route gaps:** Recursive `app/api` inventory contains only root, projects collection, and users collection route files; auth directory is empty. Missing service contracts are:
   - Auth: POST login/register/logout/refresh-token/forgot-password/reset-password; GET me/verify-email (`auth:15,36,57,75,96,117,135,156`).
   - Files: POST upload; GET collection/item; DELETE item (`file:35,102,123,145–147`).
   - Users: GET/PUT profile, POST avatar, GET item/search (`user:20,41,65,91,114`).
   - Projects: GET/PUT/DELETE item and PATCH archive/activate (`project:57,102,123,141,159`).
   These are absent from the shipped Next app; this review cannot establish contracts of an independently deployed backend at configured port 3001.

4. **P1, list shape mismatch independent of unwrapping:** Services promise `PaginatedResponse<T>` (`project:32`, `user:137`), whose items field is `data` (`types/index.ts:100–107`). Existing routes return `{projects,meta}` and `{users,meta}` (`app/api/projects/route.ts:62–72`, `users/route.ts:55–65`). Project caller expects `result.data.data` (`app/projects/page.tsx:36–37`). Search additionally uses absent `/users/search` and `offset` (`user:111–115`), whereas existing collection search uses `page` (`users/route.ts:32–34`).

## Diff/patch targets and dependencies

Change all four imports to the canonical typed client; make that client return one envelope and return its response directly from services, preserving structured errors and void failures. Normalize both collection routes to `{success:true,data:{data:[...],meta}}`, or provide explicit typed adapters. Implement the enumerated handlers or remove unsupported promises from UI/docs. Select same-origin versus external API ownership explicitly; both clients default to port 3001. Coordinate authentication/session and persistence ownership with route/context reviewers. JSON timestamp fields require string DTOs or deliberate hydration; current project/file interfaces declare `Date` without conversion (`project:9–10`, `file:12`). Multi-upload partial-success reporting is a proposed improvement: `file:72–79` hides already uploaded IDs when another upload fails.

## Acceptance and confidence

- [ ] Type-check service imports without assertion-based envelope coercion.
- [ ] Exercise singular/list/void success, HTTP errors, network errors, and resolved logical failures through the same client/service path.
- [ ] Verify every advertised route, profile persistence, authenticated ownership, pagination/search, and archive/activate effects.
- [ ] Verify multipart file/avatar payloads and partial batch failure behavior.

High confidence in static import, local route inventory, and shape findings. No source edits, installs, network, builds, or tests run; runtime backend behavior and multipart boundary handling remain unverified. Report only was written.
