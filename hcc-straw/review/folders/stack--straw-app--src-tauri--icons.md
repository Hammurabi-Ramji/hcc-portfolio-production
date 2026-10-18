# Folder review: straw-app/src-tauri/icons

Scope: registry index 111; all 16 direct binary assets reviewed through format headers, dimensions, container entries, and local decoding. No applicable ancestor AGENTS.md was found. No source changes were made.

## Inventory and current requirements

All 14 PNGs have valid PNG signatures, 8-bit RGBA headers, and decode as 32-bit ARGB:

| Direct file | Dimensions |
| --- | --- |
| 32x32.png | 32 × 32 |
| 128x128.png | 128 × 128 |
| 128x128@2x.png | 256 × 256 |
| icon.png | 512 × 512 |
| Square30x30Logo.png | 30 × 30 |
| Square44x44Logo.png | 44 × 44 |
| Square71x71Logo.png | 71 × 71 |
| Square89x89Logo.png | 89 × 89 |
| Square107x107Logo.png | 107 × 107 |
| Square142x142Logo.png | 142 × 142 |
| Square150x150Logo.png | 150 × 150 |
| Square284x284Logo.png | 284 × 284 |
| Square310x310Logo.png | 310 × 310 |
| StoreLogo.png | 50 × 50 |

`icon.ico` is an 86,642-byte type-1 ICO with four 32-bit entries: 16, 32, 128, and 256 pixels square. Entry ranges fit the file; Windows decoding succeeds. `icon.icns` has a matching 98,451-byte container length and one `ic09` chunk containing a successfully decoded 512 × 512 RGBA image.

The current requirement is usable desktop bundle imagery for STRAW Desk. `../tauri.conf.json:27–35` enables bundling for all targets and explicitly references the three sized PNGs, ICNS, and ICO; every referenced file exists. The remaining PNGs are auxiliary assets, not explicit bundle-list entries. `../Cargo.toml:13–17` uses Tauri 2 build/runtime dependencies; `../build.rs:2` invokes Tauri build integration. The current application README documents `cargo tauri build`. Historical `output/TESTING_GUIDE.md:66` claims branding completion but specifies no artwork or additional icon sizes. Relevant generator documentation supplies no icon-specific requirement.

## Findings and patch targets

No proven missing-reference, format, or dimension defect was found. No patch is warranted from this evidence. A single-resolution ICNS is recorded as existing coverage, without asserting a packaging failure or inventing a requirement to expand it. No visual brand judgment was necessary for this metadata-focused scope.

## Dependencies and acceptance

Packaging depends on the adjacent Tauri configuration, bundler, and target platform tooling. Acceptance requires a successful release bundle and confirmation that the installed application displays the intended icon at common taskbar/launcher scales. Confidence is high for file presence and decoded dimensions; packaging behavior and visual identity remain unverified. No network, installation, broad tests, or registry changes were performed.

- [ ] At release validation, build the intended desktop bundles and inspect installed launcher/taskbar imagery.
