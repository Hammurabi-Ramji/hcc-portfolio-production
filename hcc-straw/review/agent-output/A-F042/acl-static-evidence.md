# A-F042 ACL static evidence

Captured: 2026-10-18 (Wave-2 STACK-F042).
Owned file: `straw-app/src-tauri/capabilities/default.json`.

## Source capability

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

## Generated ACL (`gen/schemas/capabilities.json`)

```json
{"default":{"identifier":"default","description":"Capability for the main window","local":true,"windows":["main"],"permissions":["core:default"]}}
```

`local: true` — no remote-origin grant.

## Window label coupling

`tauri.conf.json` app.windows[0].label = `"main"` (explicit). Matches capability window grant.

## Negative grants verified

| Grant class | Present in owned capability? |
|-------------|------------------------------|
| `fs:*` | no |
| `shell:*` | no |
| `dialog:*` | no (dialog plugin is registered by F046 Rust-side `DialogExt` only; UI does not invoke `@tauri-apps/plugin-dialog`) |
| wildcard windows (`*` / patterns) | no |
| `remote.urls` | absent |
| second window label | no — only `main` |

`acl-manifests.json` lists the dialog plugin permission set (toolchain inventory). That does **not** grant dialog IPC to any window until a capability references it.

## Static check script result

See `logs/acl-static-checks.json` — **STATIC_PASS** (9/9).
