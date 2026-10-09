use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use rsvelte_core::{compile, CompileOptions, CssMode, GenerateMode};
use std::collections::HashSet;
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
mod site_cache;

// Only a validated fresh tree can be published. The guard owns one unique
// directory, never a caller-supplied cleanup path or an older build's output.
struct Staging {
    parent: PathBuf,
    owned: PathBuf,
    output: PathBuf,
    _lock: BuildLock,
    keep_previous: bool,
}
struct Validated(Staging);
struct BuildLock(PathBuf);

impl Drop for BuildLock {
    fn drop(&mut self) {
        if let Err(error) = fs::remove_file(&self.0) {
            eprintln!(
                "could not release frontend build lock {}: {error}",
                self.0.display()
            );
        }
    }
}

impl Staging {
    fn new(root: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let parent = root.join("public");
        fs::create_dir_all(&parent)?;
        if fs::symlink_metadata(&parent)?.file_type().is_symlink()
            || parent.canonicalize()? != parent
        {
            return Err("frontend output parent must be a real workspace directory".into());
        }
        let lock_path = parent.join(".ui-build.lock");
        fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock_path)
            .map_err(|e| {
                format!(
                    "cannot acquire frontend build lock {}: {e}",
                    lock_path.display()
                )
            })?;
        let lock = BuildLock(lock_path);
        let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        for attempt in 0..32 {
            let owned = parent.join(format!(
                ".ui-build-{}-{nonce}-{attempt}",
                std::process::id()
            ));
            match fs::create_dir(&owned) {
                Ok(()) => {
                    let stage = Self {
                        output: owned.join("new"),
                        parent,
                        owned,
                        _lock: lock,
                        keep_previous: false,
                    };
                    fs::create_dir(&stage.output)?;
                    return Ok(stage);
                }
                Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(e) => return Err(e.into()),
            }
        }
        Err("could not allocate a unique frontend staging directory".into())
    }

    fn validate(self, root: &Path) -> Result<Validated, Box<dyn std::error::Error>> {
        for html in ["index.html", "site/index-site.html"] {
            validate_modules(&root.join(html), &self.output)?;
        }
        Ok(Validated(self))
    }
}

impl Drop for Staging {
    fn drop(&mut self) {
        // Retain the prior complete tree if the filesystem also refused rollback.
        if self.keep_previous {
            return;
        }
        let contained = self.owned.parent() == Some(self.parent.as_path())
            && self
                .owned
                .file_name()
                .is_some_and(|n| n.to_string_lossy().starts_with(".ui-build-"))
            && fs::symlink_metadata(&self.owned).is_ok_and(|m| !m.file_type().is_symlink())
            && self.owned.canonicalize().is_ok_and(|p| p == self.owned);
        if contained {
            if let Err(error) = fs::remove_dir_all(&self.owned) {
                eprintln!(
                    "could not clean frontend staging {}: {error}",
                    self.owned.display()
                );
            }
        }
    }
}

impl Validated {
    fn publish(self) -> Result<(), Box<dyn std::error::Error>> {
        self.publish_with(|from, to| fs::rename(from, to))
    }

    fn publish_with(
        mut self,
        mut rename: impl FnMut(&Path, &Path) -> std::io::Result<()>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let stage = &mut self.0;
        let destination = stage.parent.join("ui");
        let previous = stage.owned.join("previous");
        let had_previous = match fs::symlink_metadata(&destination) {
            Ok(m)
                if m.is_dir()
                    && !m.file_type().is_symlink()
                    && destination.canonicalize()? == destination =>
            {
                true
            }
            Ok(_) => return Err("frontend output must be a real workspace directory".into()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => false,
            Err(e) => return Err(e.into()),
        };
        if had_previous {
            rename(&destination, &previous)?;
        }
        if let Err(error) = rename(&stage.output, &destination) {
            if had_previous {
                if let Err(rollback) = rename(&previous, &destination) {
                    stage.keep_previous = true;
                    return Err(format!("frontend publish failed: {error}; rollback failed: {rollback}; prior complete output retained at {}", previous.display()).into());
                }
            }
            return Err(format!("frontend publish failed; prior output preserved: {error}").into());
        }
        Ok(())
    }
}

fn copy_tree(source: &Path, destination: &Path) -> Result<(), Box<dyn std::error::Error>> {
    fs::create_dir_all(destination)?;
    for entry in sorted_entries(source)? {
        let path = entry.path();
        if entry.file_type()?.is_dir() {
            copy_tree(&path, &destination.join(entry.file_name()))?;
        } else if path.extension().is_some_and(|e| e == "js") {
            fs::copy(&path, destination.join(entry.file_name()))?;
        }
    }
    Ok(())
}
fn sorted_entries(path: &Path) -> std::io::Result<Vec<fs::DirEntry>> {
    let mut entries = fs::read_dir(path)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(|entry| entry.file_name());
    Ok(entries)
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()?;
    match std::env::args().nth(1).as_deref() {
        Some("site-cache") => {
            let staging = std::env::var_os("TRUNK_STAGING_DIR")
                .ok_or("site-cache must run as a Trunk post-build hook")?;
            let staging = Path::new(&staging).canonicalize()?;
            if !staging.starts_with(&root) {
                return Err("site staging directory is outside the workspace".into());
            }
            return site_cache::write_manifest(&staging);
        }
        Some("verify-site") => return site_cache::verify(&root.join("site-dist")),
        Some(_) => return Err("supported commands: site-cache, verify-site".into()),
        None => {}
    }
    std::thread::Builder::new()
        .name("component-compiler".into())
        .stack_size(32 * 1024 * 1024)
        .spawn(|| build().map_err(|e| e.to_string()))?
        .join()
        .map_err(|_| "component compiler thread failed")?
        .map_err(Into::into)
}
fn build() -> Result<(), Box<dyn std::error::Error>> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()?;
    let staging = Staging::new(&root)?;
    let output = &staging.output;
    for entry in sorted_entries(&root.join("ui"))? {
        let path = entry.path();
        if path.extension().is_none_or(|e| e != "svelte") {
            continue;
        }
        let source = fs::read_to_string(&path)?;
        let result = compile(
            &source,
            CompileOptions {
                filename: Some(path.file_name().unwrap().to_string_lossy().into_owned()),
                generate: GenerateMode::Client,
                runes: Some(true),
                css: CssMode::Injected,
                dev: false,
                disclose_version: false,
                enable_sourcemap: false,
                ..Default::default()
            },
        )
        .map_err(|e| format!("{}: {e:?}", path.display()))?;
        if !result.metadata.runes {
            return Err("component was not compiled in runes mode".into());
        }
        let code = result
            .js
            .code
            .replace(".svelte'", ".js'")
            .replace(".svelte\"", ".js\"");
        fs::write(
            output.join(path.file_stem().unwrap()).with_extension("js"),
            code,
        )?;
    }
    copy_tree(
        &root.join("third-party/svelte/src"),
        &output.join("vendor/svelte"),
    )?;
    fs::copy(
        root.join("third-party/clsx/clsx.mjs"),
        output.join("vendor/clsx.mjs"),
    )?;
    let licenses = output.join("vendor/licenses");
    fs::create_dir_all(&licenses)?;
    for (source, destination) in [
        ("third-party/svelte/LICENSE.md", "svelte-LICENSE.md"),
        ("third-party/clsx/LICENSE", "clsx-LICENSE"),
        ("third-party/NOTICE.md", "NOTICE.md"),
    ] {
        fs::copy(root.join(source), licenses.join(destination))?;
    }
    fs::write(
        output.join("vendor/env.js"),
        "export const BROWSER=true; export const DEV=false; export const NODE=false;\n",
    )?;
    for entry in sorted_entries(&root.join("ui"))? {
        let path = entry.path();
        if path.extension().is_some_and(|e| e == "js") {
            fs::copy(&path, output.join(path.file_name().unwrap()))?;
        }
    }
    staging.validate(&root)?.publish()?;
    println!("Svelte 5 runes components compiled by native Rust.");
    Ok(())
}

// Validate the actual browser import graph without executing a scripting engine.
// The compute module is generated by Trunk after this pre-build hook.
fn validate_modules(html: &Path, output: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let html = fs::read_to_string(html)?;
    let map = html
        .split("<script type=\"importmap\">")
        .nth(1)
        .and_then(|s| s.split("</script>").next())
        .ok_or("missing import map")?;
    let map: serde_json::Value = serde_json::from_str(map)?;
    let mut pending = vec![output.join("main.js").canonicalize()?];
    let mut visited = HashSet::new();
    while let Some(path) = pending.pop() {
        if !visited.insert(path.clone()) {
            continue;
        }
        let code = fs::read_to_string(&path)?;
        let arena = Allocator::default();
        let parsed = Parser::new(&arena, &code, SourceType::mjs()).parse();
        if !parsed.diagnostics.is_empty() {
            return Err(format!("{}: {:?}", path.display(), parsed.diagnostics).into());
        }
        for request in parsed.module_record.requested_modules.keys() {
            let request = request.as_str();
            if request == "wasm-frontend" {
                if map["imports"][request] != "/wasm-frontend.js" {
                    return Err(format!(
                        "compute import does not match Trunk output in {}",
                        path.display()
                    )
                    .into());
                }
                continue;
            }
            let target = if request.starts_with('.') {
                path.parent().unwrap().join(request)
            } else {
                let target = map["imports"][request]
                    .as_str()
                    .ok_or_else(|| format!("unmapped import {request} in {}", path.display()))?;
                output.join(target.strip_prefix("/public/ui/").ok_or_else(|| {
                    format!(
                        "import {request} in {} must resolve within /public/ui/",
                        path.display()
                    )
                })?)
            };
            let target = target.canonicalize().map_err(|e| {
                format!(
                    "missing import {request} in {}: {}: {e}",
                    path.display(),
                    target.display()
                )
            })?;
            if !target.starts_with(output) {
                return Err(format!(
                    "import {request} in {} escapes fresh frontend output",
                    path.display()
                )
                .into());
            }
            pending.push(target);
        }
    }
    println!(
        "Validated {} local browser modules and the Trunk compute import.",
        visited.len()
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Fixture(PathBuf, PathBuf);
    impl Fixture {
        fn new() -> Self {
            let nonce = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("test clock")
                .as_nanos();
            let parent = std::env::var_os("FRONTEND_BUILD_TEST_ROOT")
                .map(PathBuf::from)
                .unwrap_or_else(std::env::temp_dir);
            fs::create_dir_all(&parent).expect("test parent");
            let parent = parent.canonicalize().expect("test parent");
            let path = parent.join(format!(
                "frontend-staging-test-{}-{nonce}",
                std::process::id()
            ));
            fs::create_dir(&path).expect("unique fixture");
            fs::create_dir_all(path.join("public/ui")).expect("prior output");
            fs::write(path.join("public/ui/sentinel.js"), b"prior complete bytes")
                .expect("sentinel");
            fs::create_dir(path.join("site")).expect("site");
            for html in ["index.html", "site/index-site.html"] {
                fs::write(
                    path.join(html),
                    "<script type=\"importmap\">{\"imports\":{}}</script>",
                )
                .expect("map");
            }
            Self(path, parent)
        }
        fn validated(&self) -> Validated {
            let stage = Staging::new(&self.0).expect("staging");
            fs::write(stage.output.join("main.js"), "export const fresh = true;")
                .expect("fresh module");
            stage.validate(&self.0).expect("valid graph")
        }
        fn assert_prior(&self) {
            assert_eq!(
                fs::read(self.0.join("public/ui/sentinel.js")).expect("prior sentinel"),
                b"prior complete bytes"
            );
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            assert_eq!(self.0.parent(), Some(self.1.as_path()));
            fs::remove_dir_all(&self.0).expect("contained test cleanup");
        }
    }

    #[test]
    fn successful_swap_removes_stale_files_and_releases_lock() {
        let fixture = Fixture::new();
        fixture.validated().publish().expect("publish");
        assert!(!fixture.0.join("public/ui/sentinel.js").exists());
        assert!(fixture.0.join("public/ui/main.js").is_file());
        assert_eq!(
            fs::read_dir(fixture.0.join("public"))
                .expect("public")
                .count(),
            1
        );
        Staging::new(&fixture.0).expect("lock released");
    }

    #[test]
    fn rename_failures_preserve_previous_complete_output() {
        for failed_call in [1, 2] {
            let fixture = Fixture::new();
            let mut call = 0;
            let result = fixture.validated().publish_with(|from, to| {
                call += 1;
                if call == failed_call {
                    return Err(std::io::Error::other("injected rename failure"));
                }
                fs::rename(from, to)
            });
            assert!(result.is_err());
            fixture.assert_prior();
            assert_eq!(
                fs::read_dir(fixture.0.join("public"))
                    .expect("public")
                    .count(),
                1
            );
        }
    }

    #[test]
    fn refused_rollback_retains_previous_tree_with_recovery_path() {
        let fixture = Fixture::new();
        let validated = fixture.validated();
        let previous = validated.0.owned.join("previous");
        let mut call = 0;
        let error = validated
            .publish_with(|from, to| {
                call += 1;
                if call >= 2 {
                    return Err(std::io::Error::other("injected filesystem refusal"));
                }
                fs::rename(from, to)
            })
            .expect_err("failed publish and rollback");
        assert!(error.to_string().contains(&previous.display().to_string()));
        assert_eq!(
            fs::read(previous.join("sentinel.js")).expect("recovery bytes"),
            b"prior complete bytes"
        );
        assert!(!fixture.0.join("public/.ui-build.lock").exists());
    }

    #[test]
    fn lock_and_validation_failure_leave_prior_output_and_clean_staging() {
        let fixture = Fixture::new();
        let stage = Staging::new(&fixture.0).expect("staging");
        assert!(Staging::new(&fixture.0).is_err());
        fs::write(stage.output.join("main.js"), "import './missing.js';").expect("broken module");
        let error = stage.validate(&fixture.0).err().expect("missing import");
        assert!(error.to_string().contains("missing.js in "));
        assert!(error.to_string().contains("main.js"));
        fixture.assert_prior();
        assert_eq!(
            fs::read_dir(fixture.0.join("public"))
                .expect("public")
                .count(),
            1
        );
    }
}
