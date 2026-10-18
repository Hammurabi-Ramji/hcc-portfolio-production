# Review 131: Tauri generated-output container

Inventory/evidence: `straw-app/src-tauri/gen` contains zero direct files and one child, `schemas`, covered by review 110. No applicable ancestor AGENTS.md exists. The source capability references `../gen/schemas/desktop-schema.json` (`capabilities/default.json:2`); `build.rs:2` invokes `tauri_build::build()`, with Tauri 2 declared in `Cargo.toml:13,16`.

Current versus specified: this generated-output container supports the documented desktop stack; no requirement calls for direct files here. No proven defect or patch is warranted. Permission/schema changes belong in source capabilities and toolchain inputs, followed by generation; dependencies are Tauri build tooling and those inputs.

- [ ] During the next normal desktop build, confirm referenced child schemas regenerate consistently; use the child report for detailed acceptance checks.

Confidence: high for container inventory. No builds, installs, network, source changes, or runtime checks performed.
