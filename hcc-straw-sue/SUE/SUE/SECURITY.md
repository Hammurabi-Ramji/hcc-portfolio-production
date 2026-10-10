# SUE Security Documentation

## Security posture

SUE is designed as a local-first MV3 extension:

- no mandatory telemetry
- local API by default on `127.0.0.1`
- optional local Ollama integration
- extension-scoped storage and messaging

## Current CSP

The source of truth is `manifest.json`:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
}
```

Do not rely on older docs that described broader localhost or speculation-rule directives as the enforced CSP.

## Permissions currently declared

```json
"permissions": [
  "storage",
  "activeTab",
  "scripting",
  "tabs",
  "sidePanel",
  "notifications",
  "offscreen",
  "alarms",
  "cookies",
  "contextMenus",
  "nativeMessaging"
],
"optional_permissions": ["downloads", "bookmarks", "history"]
```

## Host permissions

```json
[
  "http://localhost:11434/*",
  "http://localhost:8080/*",
  "https://app.koofr.net/*",
  "https://*.koofr.net/*",
  "https://icedrive.net/*",
  "https://app.icedrive.net/*",
  "https://degoo.com/*",
  "https://app.degoo.com/*"
]
```

## Security-relevant audit note

- A successful package build does not prove the content script is healthy because `content.js` is copied, not validated, during packaging.
- The current audit found a source defect in `content.js`; until that is fixed, page-level runtime behavior should not be assumed secure or correct solely from build success.
