# Local upstream assets

Svelte **5.57.1** browser runtime: `packages/svelte/src` from upstream commit `636eaaaa6f06`, excluding the compiler directory. Upstream: https://github.com/sveltejs/svelte/commit/636eaaaa6f06 . License: `svelte/LICENSE.md` (MIT). The prior JavaScript compiler is removed.

clsx **2.1.1**, browser module `dist/clsx.mjs`. Upstream: https://github.com/lukeed/clsx . License: `clsx/LICENSE` (MIT).

The native Rust compiler is `rsvelte_core` **0.12.6**, pinned in Cargo to revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b`. Upstream: https://github.com/baseballyama/rsvelte/tree/5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b . License: MIT, retained by Cargo with the dependency source. It uses OXC and targets the browser runtime version above.

After Cargo dependency provisioning the build hook uses local files without fetching assets. `public/ui` are generated outputs. Upstream third-party identifiers and license text are preserved. The build hook copies the complete local `svelte/LICENSE.md`, `clsx/LICENSE`, and this notice byte-for-byte to `public/ui/vendor/licenses/` as `svelte-LICENSE.md`, `clsx-LICENSE`, and `NOTICE.md`. Trunk includes that directory at `dist/public/ui/vendor/licenses/` for the packaged frontend. The literal substring audit remains unsatisfied by upstream runtime identifiers; changing the compiler does not remove the browser runtime.

