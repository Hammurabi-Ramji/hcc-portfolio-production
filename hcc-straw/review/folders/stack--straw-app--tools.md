# straw-app/tools — current container review

**Inventory/evidence:** A forced direct-file listing contains zero files and one child, `frontend-build`. No applicable ancestor `AGENTS.md` was found. Child implementation is separately reviewed.

**Current versus specified:** This is an intentional tools container. `straw-app/Cargo.toml:3` includes `tools/frontend-build` as a workspace member; `Trunk.toml:13,17–19` watches it and invokes the offline Cargo package during pre-build. `README.md:29,40` documents the native compiler and local build-hook role consistently with this wiring.

**Findings/patch:** No evidence-backed container defect; no patch warranted.

**Dependencies:** Child package/compiler, provisioned Cargo dependencies, and Trunk. Compiler correctness belongs to the child review.

**Acceptance/confidence:** High confidence in container integration from static inspection; no builds or tests run here.

- [ ] Root verification: confirm provisioned `trunk build` executes the hook successfully and produces frontend assets.
