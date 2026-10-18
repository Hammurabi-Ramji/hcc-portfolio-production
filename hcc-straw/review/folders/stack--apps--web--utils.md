# apps/web/utils — folder review (index 104)

## Inventory and contract

Reviewed every direct file with numbered lines: `config.ts` (64), `helpers.ts` (159), `index.ts` (167), `pagination.ts` (71), and `validation.ts` (114). No applicable AGENTS.md was present at the Stack root or folder ancestors. These files provide environment/constants, formatting and browser helpers, pagination metadata/URLs, and generic form validation. `index.ts` repeats many helpers rather than exporting the sibling modules.

Read the root README, web README, relevant output web/desktop guides, and Generator docs README/EXPANDED_SAAS_FRAMEWORK/FINAL_VERIFICATION_REPORT sections. They describe a TypeScript/Next.js foundation with validation and SSR, alongside a separate desktop-first generator. Their production-ready/100% assertions do not establish utility correctness. `apps/web/tsconfig.json:25` includes these files in compilation. A targeted import/reference search found no application consumers of this folder; login/signup instead import `@/lib/utils` (`app/login/page.tsx:10`, `app/signup/page.tsx:10`). Findings below are proven exported-function defects, with currently latent application impact.

## Findings and patch targets

1. **P2 — Missing required fields bypass form validation.** `validation.ts:77` iterates submitted data keys, so `validateForm({}, {email: {required: true}})` reports valid at lines 87–89. Patch the loop to iterate `validationRules`, passing `data[field]` to `validateField`. Also replace the broad falsy check at line 22 with explicit missing/empty checks so required numeric zero and boolean false remain valid. `commonRules.required('custom message')` never returns that message for missing input because line 22 exits before its custom callback at lines 105–112; add an explicit required-message contract or resolve the factory's message in that branch.

2. **P2 — Pagination accepts invalid numeric values.** `pagination.ts:40–45` uses truthiness, allowing zero and NaN; it also accepts fractional pages/limits and Infinity for page. `calculateTotalPages(10, 0)` produces Infinity (31–32). Patch explicit undefined checks plus finite positive integer validation, and define calculation behavior for invalid totals/limits. Normalization at lines 23–24 defaults to 20 although `config.ts:16–19` declares 10; consume the shared configuration after choosing one contract.

3. **P2 — Clipboard helper can throw instead of fulfilling its boolean contract.** `helpers.ts:148–149` and `index.ts:105–106` dereference `navigator.clipboard` before the promise catch exists. An unsupported/insecure-context browser therefore throws synchronously; server use also lacks navigator. Patch with an async try/catch and availability check, returning false. `pagination.ts:62` similarly always accesses window, even for an absolute URL; accept an explicit origin or document/enforce browser-only use if server pagination is intended.

## Dependencies and acceptance

No additional packages are needed: TypeScript DOM/Node declarations and native Intl/URL/timer APIs supply the functionality. Proposed maintenance improvement: select canonical implementations across helpers/index/lib and re-export them; class joining in `utils/index.ts:5–6` does not share `lib/utils.ts:7–8` Tailwind conflict merging. No current import establishes a rendering regression from that difference. Keep randomString/generateId limited to non-security identifiers.

- [ ] Fix required-field iteration, false/zero semantics, and required custom-message handling; check missing, empty, false, zero, and ordinary valid fields.
- [ ] Validate pagination boundaries including 0, NaN, Infinity, fractions, omitted values, and configured defaults.
- [ ] Verify clipboard rejection/unavailability resolves false; establish server-safe URL behavior and canonical helper ownership.

Confidence: high for inspected control-flow defects, moderate for intended API policy. Review used source/document reads and targeted searches only; no source edits, installs, network, builds, tests, or runtime checks were performed.
