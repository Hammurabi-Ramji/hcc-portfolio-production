//! Shared project-tree walking and the explicit suppression syntax.
//!
//! Suppressions are auditable and counted in gate output:
//! * `crucible:allow(<gate>)` anywhere on a line skips that line.
//! * `crucible:allow-file(<gate>)` in the first 10 lines skips the whole file.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

use crate::CrucibleError;

/// Directories never scanned: build output, VCS data, dependencies, vendored code.
pub const SKIP_DIRS: &[&str] = &[
    ".git",
    "target",
    "node_modules",
    "dist",
    "site-dist",
    ".svelte-kit",
    "third-party",
    "vendor",
];

pub const LOCKFILES: &[&str] = &["Cargo.lock", "pnpm-lock.yaml", "package-lock.json", "yarn.lock"];

pub struct SourceFile {
    /// Path relative to the project root, `/`-separated.
    pub rel: String,
    pub content: String,
}

pub fn rel_string(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

/// Directory rules from the root `.gitignore` (`/public/ui/`, `build/`): build
/// output the project itself declares untracked. Only plain directory rules are
/// honored; globs, negations and file rules are ignored, never guessed at.
/// Returns (anchored relative paths, unanchored directory names).
fn gitignored_dirs(root: &Path) -> (Vec<String>, Vec<String>) {
    let text = fs::read_to_string(root.join(".gitignore")).unwrap_or_default();
    let (mut anchored, mut named) = (Vec::new(), Vec::new());
    for line in text.lines().map(str::trim) {
        let Some(dir) = line.strip_suffix('/') else { continue };
        if dir.is_empty() || dir.contains(['*', '?', '[', '!']) || line.starts_with('#') {
            continue;
        }
        match dir.strip_prefix('/') {
            Some(path) => anchored.push(path.to_owned()),
            None if !dir.contains('/') => named.push(dir.to_owned()),
            None => anchored.push(dir.to_owned()),
        }
    }
    (anchored, named)
}

/// Every file under `root`, skipping [`SKIP_DIRS`] and `.gitignore`d
/// directories, in deterministic order.
pub fn all_files(root: &Path) -> Result<Vec<PathBuf>, CrucibleError> {
    let (anchored, named) = gitignored_dirs(root);
    let walker = WalkDir::new(root)
        .follow_links(false)
        .sort_by_file_name()
        .into_iter()
        .filter_entry(|e| {
            if e.depth() == 0 || !e.file_type().is_dir() {
                return true;
            }
            let name = e.file_name().to_str().unwrap_or_default();
            if SKIP_DIRS.contains(&name) || named.iter().any(|n| n == name) {
                return false;
            }
            let rel = rel_string(root, e.path());
            !anchored.contains(&rel)
        });
    let mut files = Vec::new();
    for entry in walker {
        let entry = entry?;
        if entry.file_type().is_file() {
            files.push(entry.into_path());
        }
    }
    Ok(files)
}

/// UTF-8 text files accepted by `keep`. Binary (non-UTF-8) files are skipped.
pub fn source_files(
    root: &Path,
    keep: impl Fn(&Path) -> bool,
) -> Result<Vec<SourceFile>, CrucibleError> {
    let mut out = Vec::new();
    for path in all_files(root)? {
        if !keep(&path) {
            continue;
        }
        match fs::read_to_string(&path) {
            Ok(content) => out.push(SourceFile { rel: rel_string(root, &path), content }),
            Err(e) if e.kind() == io::ErrorKind::InvalidData => {}
            Err(source) => return Err(CrucibleError::Io { path, source }),
        }
    }
    Ok(out)
}

pub fn has_extension(path: &Path, exts: &[&str]) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| exts.iter().any(|x| x.eq_ignore_ascii_case(e)))
}

pub fn is_lockfile(path: &Path) -> bool {
    path.file_name().and_then(|n| n.to_str()).is_some_and(|n| LOCKFILES.contains(&n))
}

pub fn file_allows(content: &str, gate: &str) -> bool {
    let tag = format!("crucible:allow-file({gate})");
    content.lines().take(10).any(|l| l.contains(&tag))
}

pub fn line_allows(line: &str, gate: &str) -> bool {
    line.contains(&format!("crucible:allow({gate})"))
}
