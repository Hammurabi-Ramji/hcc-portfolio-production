# straw-app/site compared with site-dist

Reviewed 2026-10-09. `straw-app/site` was outside the original 61-assignment roster. `site-dist` is present and was compared with the site sources and with `straw-app/public`.

## Source inventory

| Path | Bytes | SHA-256 |
| --- | --- | --- |
| site/index-site.html | 1680 | 1f986085c2171c623d7d4af0b9c9ed1e20ffc7da9d10abc78ba9ebda6a6ee5d5 |
| site/manifest.webmanifest | 375 | 82e80a63f00eb2ffa34a05f41140904d534091d53389d166d011937d3f8d8f3e |
| site/sw.js | 1150 | 313546ef06fd39cf1e64b37d179660bdcfbdbb06920d5328b56daafb5d92a6af |
| site/icon.svg | 268 | 9472811227a51ae8a65f277f3e0c5f24a78a85a7d76edd708e4e1340aab28c35 |

`index-site.html` matches the hash recorded in `review/concurrent-site-transition.json`.

## Generated copies

`site-dist` contains 163 files, including `index.html`, `precache-manifest.js`, `wasm-frontend.js`, and `wasm-frontend_bg.wasm`.

Copied site assets match the source bytes: `icon.svg`, `manifest.webmanifest`, and `sw.js`.

`site-dist/public` and `straw-app/public` each contain 156 files. There are no extra files, no missing files, and no byte differences.

`site-dist/index.html` differs from `site/index-site.html` only where the build is expected to change it: `__STRAW_CSP__` is replaced by a script hash policy, Trunk copy/rust directives are cleared or tagged, and the import map remains before the module script.

This comparison does not include a fresh Trunk rebuild in this session and does not observe the PWA in a browser.
