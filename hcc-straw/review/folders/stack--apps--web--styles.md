# apps/web/styles — folder review

Inventory: `Get-ChildItem -Force` confirms zero files or children. No applicable ancestor AGENTS.md exists. This intentional container is documented as “Future styles” (`apps/web/FILE_STRUCTURE.md:75-76`). No missing-file defect is established here.

Current versus specified: QUICK_START:137 assigns global styles to `app/globals.css`, containing Tailwind directives (:1-3). Tailwind scans app/components/pages (`tailwind.config.js:2-6`); PostCSS declares Tailwind/Autoprefixer (:2-4). However, `app/layout.tsx:1-28` never imports the stylesheet; a web-source search finds no import. The integration defect and `import './globals.css'` patch already belong to `stack--apps--web--app.md`. No styles-folder patch is warranted.

Dependencies/acceptance:
- [ ] Resolve the app report’s stylesheet wiring and verify generated Tailwind CSS visually.
- [ ] Retain this documented optional container unless styles are actually added.

High static confidence; builds, tests, installs, and network checks unrun. No source changes.
