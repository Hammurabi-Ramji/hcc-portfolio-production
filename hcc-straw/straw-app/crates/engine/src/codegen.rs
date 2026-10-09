use crate::contract::{CodeFile, ModelSettings};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    path::{Component, Path, PathBuf},
};

#[derive(Debug, thiserror::Error)]
#[error("invalid generated files: {0}")]
pub struct ParseError(pub String);
#[derive(Debug, thiserror::Error)]
#[error("unsafe file path: {0}")]
pub struct PathError(pub String);
#[derive(Debug)]
pub struct NamedBlock {
    pub path: String,
    pub content: String,
}

pub fn parse_code_blocks(md: &str) -> Result<Vec<NamedBlock>, ParseError> {
    let error = |s: &str| ParseError(s.into());
    let mut files = Vec::new();
    let mut active: Option<(Option<String>, Vec<String>)> = None;
    let mut paths = HashSet::new();
    for line in md.lines() {
        if line.trim_start().starts_with("```") {
            if let Some((path, content)) = active.take() {
                if line.trim() != "```" {
                    return Err(error("nested fence"));
                }
                let path = path.ok_or_else(|| error("block requires a path: header"))?;
                validate_relative(&path).map_err(|e| error(&e.to_string()))?;
                let normalized = path.replace('\\', "/").to_lowercase();
                if !paths.insert(normalized) {
                    return Err(error("duplicate path"));
                }
                files.push(NamedBlock {
                    path,
                    content: content.join("\n"),
                });
            } else {
                let header = line
                    .trim()
                    .strip_prefix("```")
                    .ok_or_else(|| error("invalid fence"))?
                    .trim();
                if header.contains('/') || header.contains('\\') || header.contains(':') {
                    return Err(error("invalid fence label"));
                }
                active = Some((None, vec![]));
            }
        } else if let Some((path, content)) = active.as_mut() {
            if path.is_none() {
                let value = line
                    .strip_prefix("path:")
                    .ok_or_else(|| error("first block line must be path: relative/file"))?
                    .trim();
                if value.is_empty() {
                    return Err(error("missing path"));
                }
                *path = Some(value.into());
            } else {
                content.push(line.into());
            }
        }
    }
    if active.is_some() {
        return Err(error("unclosed fence"));
    }
    if files.is_empty() {
        return Err(error("response contains no named files"));
    }
    Ok(files)
}

fn validate_relative(rel: &str) -> Result<(), PathError> {
    let fail = || PathError(rel.into());
    if rel.is_empty() || rel.contains(['\\', ':', '\0']) || rel.starts_with('/') || rel.len() > 240
    {
        return Err(fail());
    }
    for part in Path::new(rel).components() {
        match part {
            Component::Normal(name) => {
                let text = name.to_str().ok_or_else(fail)?;
                let stem = text.split('.').next().unwrap_or("").to_uppercase();
                if text.ends_with(['.', ' '])
                    || text
                        .chars()
                        .any(|c| c.is_control() || "<>\"|?*".contains(c))
                    || [
                        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6",
                        "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6",
                        "LPT7", "LPT8", "LPT9",
                    ]
                    .contains(&stem.as_str())
                {
                    return Err(fail());
                }
            }
            _ => return Err(fail()),
        }
    }
    if rel
        .split('/')
        .any(|s| s.is_empty() || s == "." || s == "..")
    {
        return Err(fail());
    }
    Ok(())
}

pub fn safe_join(output_dir: &Path, rel: &str) -> Result<PathBuf, PathError> {
    validate_relative(rel)?;
    let root = output_dir
        .canonicalize()
        .map_err(|e| PathError(e.to_string()))?;
    if !root.is_dir() {
        return Err(PathError("output root is not a directory".into()));
    }
    let candidate = root.join(rel);
    let mut current = root.clone();
    for part in Path::new(rel).components() {
        current.push(part);
        if let Ok(meta) = fs::symlink_metadata(&current) {
            #[cfg(windows)]
            {
                use std::os::windows::fs::MetadataExt;
                if meta.file_attributes() & 0x400 != 0 {
                    return Err(PathError("reparse point is forbidden".into()));
                }
            }
            if meta.file_type().is_symlink()
                || !current
                    .canonicalize()
                    .map_err(|e| PathError(e.to_string()))?
                    .starts_with(&root)
            {
                return Err(PathError("path escapes output root".into()));
            }
        }
    }
    Ok(candidate)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CreationRequest {
    pub prompt: String,
    pub output_dir: String,
    pub settings: ModelSettings,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreationResult {
    pub files: Vec<CodeFile>,
    pub output_dir: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RefinementRequest {
    pub file: CodeFile,
    pub instruction: String,
    pub settings: ModelSettings,
}

/// Move a complete staged file into an absent destination atomically.
/// Windows rename normally replaces existing files, so explicitly omit the
/// REPLACE_EXISTING flag. Both implementations fail if a competitor arrived.
#[cfg(windows)]
fn install_absent(source: &Path, destination: &Path) -> std::io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn MoveFileExW(existing: *const u16, new: *const u16, flags: u32) -> i32;
    }
    let source: Vec<u16> = source.as_os_str().encode_wide().chain(Some(0)).collect();
    let destination: Vec<u16> = destination
        .as_os_str()
        .encode_wide()
        .chain(Some(0))
        .collect();
    // SAFETY: vectors are owned, NUL-terminated UTF-16 and valid for the call.
    // Paths are validated before this private helper; flags=0 forbids replacement.
    if unsafe { MoveFileExW(source.as_ptr(), destination.as_ptr(), 0) } == 0 {
        Err(std::io::Error::last_os_error())
    } else {
        Ok(())
    }
}
#[cfg(not(windows))]
fn install_absent(source: &Path, destination: &Path) -> std::io::Result<()> {
    fs::hard_link(source, destination)?;
    let _ = fs::remove_file(source);
    Ok(())
}

/// A prepared batch owns staging and rollback. Destinations are installed with
/// install_absent: its create-if-absent semantics never replace a concurrent file.
struct PreparedBatch {
    staging: PathBuf,
    created_dirs: Vec<PathBuf>,
    installed: Vec<(PathBuf, Option<PathBuf>, bool, Vec<u8>)>,
    retain_staging: bool,
    committed: bool,
}
impl PreparedBatch {
    fn rollback(&mut self) -> Result<(), String> {
        let mut errors = Vec::new();
        for (path, backup, installed, expected) in self.installed.drain(..).rev() {
            if installed {
                // Rollback owns only the bytes it installed. Preserve another
                // writer's edits/deletions and the original backup for recovery.
                // Noncooperating writers can still race this check and unlink;
                // filesystem batches are not globally atomic transactions.
                if !matches!(fs::read(&path), Ok(current) if current == expected) {
                    errors.push(format!(
                        "refused rollback of externally changed destination {}; original backup {}",
                        path.display(),
                        backup
                            .as_ref()
                            .map(|p| p.display().to_string())
                            .unwrap_or_else(|| "unavailable (new file)".into())
                    ));
                    continue;
                }
                if let Err(e) = fs::remove_file(&path) {
                    if e.kind() != std::io::ErrorKind::NotFound {
                        errors.push(e.to_string());
                    }
                }
            }
            if let Some(backup) = backup {
                // No-clobber restoration also preserves a competing writer's file.
                match install_absent(&backup, &path) {
                    Ok(()) => {
                        let _ = fs::remove_file(&backup);
                    }
                    Err(e) => errors.push(format!(
                        "restore {} from {}: {e}",
                        path.display(),
                        backup.display()
                    )),
                }
            }
        }
        if !errors.is_empty() {
            // Keep backups as recovery evidence if rollback itself cannot complete.
            self.retain_staging = true;
            return Err(format!(
                "rollback incomplete (backups at {}): {}",
                self.staging.display(),
                errors.join("; ")
            ));
        }
        Ok(())
    }
}
impl Drop for PreparedBatch {
    fn drop(&mut self) {
        if !self.committed {
            let _ = self.rollback();
        }
        if self.retain_staging {
            return;
        }
        // A failed rollback deliberately retains its backup directory.
        let _ = fs::remove_dir_all(&self.staging);
        for path in self.created_dirs.iter().rev() {
            let _ = fs::remove_dir(path);
        }
    }
}

pub fn save_files(
    root: &Path,
    files: &[CodeFile],
    overwrite: bool,
) -> Result<Vec<CodeFile>, String> {
    save_files_inner(root, files, overwrite, |_, _| Ok(()))
}

// Hook lets regression tests force a real late commit failure after staging.
fn save_files_inner(
    root: &Path,
    files: &[CodeFile],
    overwrite: bool,
    mut before_commit: impl FnMut(usize, &Path) -> Result<(), String>,
) -> Result<Vec<CodeFile>, String> {
    use std::io::Write;
    if files.is_empty() {
        return Err("no files to save".into());
    }
    let mut unique = HashSet::new();
    let mut identities = HashSet::new();
    for file in files {
        validate_relative(&file.path).map_err(|e| e.to_string())?;
        if file.id.trim().is_empty()
            || !identities.insert(&file.id)
            || !unique.insert(file.path.to_lowercase())
        {
            return Err("invalid or duplicate file identity/path".into());
        }
    }
    // Component boundaries matter: a and a/b conflict; a and ab do not.
    for path in &unique {
        for (offset, _) in path.match_indices('/') {
            if unique.contains(&path[..offset]) {
                return Err("file/directory path conflict".into());
            }
        }
    }
    fs::create_dir_all(root).map_err(|e| e.to_string())?;
    let paths: Vec<_> = files
        .iter()
        .map(|f| safe_join(root, &f.path).map_err(|e| e.to_string()))
        .collect::<Result<_, _>>()?;
    for path in &paths {
        if path.is_dir() {
            return Err(format!("destination is a directory: {}", path.display()));
        }
        if !overwrite && path.exists() {
            return Err(format!("file already exists: {}", path.display()));
        }
        let mut ancestor = path.parent();
        while let Some(parent) = ancestor {
            if parent.exists() && !parent.is_dir() {
                return Err("destination parent is a file".into());
            }
            ancestor = parent.parent();
        }
    }
    let staging = root.join(format!(".straw-{}", uuid::Uuid::new_v4()));
    fs::create_dir(&staging).map_err(|e| e.to_string())?;
    let mut batch = PreparedBatch {
        staging,
        created_dirs: vec![],
        installed: vec![],
        retain_staging: false,
        committed: false,
    };
    let operation = (|| -> Result<(), String> {
        for (index, file) in files.iter().enumerate() {
            let temp = batch.staging.join(format!("{index}.tmp"));
            let mut stream = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(temp)
                .map_err(|e| e.to_string())?;
            stream
                .write_all(file.content.as_bytes())
                .map_err(|e| e.to_string())?;
            stream.sync_all().map_err(|e| e.to_string())?;
        }
        for (index, (file, path)) in files.iter().zip(&paths).enumerate() {
            before_commit(index, path)?;
            safe_join(root, &file.path).map_err(|e| e.to_string())?;
            let mut missing = Vec::new();
            let mut ancestor = path.parent();
            while let Some(parent) = ancestor {
                if parent.exists() {
                    break;
                }
                missing.push(parent.to_path_buf());
                ancestor = parent.parent();
            }
            for dir in missing.into_iter().rev() {
                fs::create_dir(&dir).map_err(|e| e.to_string())?;
                batch.created_dirs.push(dir);
            }
            safe_join(root, &file.path).map_err(|e| e.to_string())?;
            let backup = if overwrite && path.exists() {
                if !path.is_file() {
                    return Err("destination is not a file".into());
                }
                let backup = batch.staging.join(format!("{index}.backup"));
                fs::rename(path, &backup).map_err(|e| e.to_string())?;
                Some(backup)
            } else {
                None
            };
            // Register before install so a failed install still restores its backup.
            batch.installed.push((
                path.clone(),
                backup,
                false,
                file.content.as_bytes().to_vec(),
            ));
            install_absent(&batch.staging.join(format!("{index}.tmp")), path)
                .map_err(|e| e.to_string())?;
            if let Some((_, _, installed, _)) = batch.installed.last_mut() {
                *installed = true;
            }
        }
        Ok(())
    })();
    if let Err(error) = operation {
        return match batch.rollback() {
            Ok(()) => Err(error),
            Err(rollback) => Err(format!("{error}; {rollback}")),
        };
    }
    batch.committed = true;
    batch.installed.clear();
    // The commit succeeded; remove staged links and backups, retaining destinations.
    let _ = fs::remove_dir_all(&batch.staging); // Drop retries cleanup; commit already succeeded.
    Ok(files
        .iter()
        .cloned()
        .map(|mut f| {
            f.is_dirty = false;
            f
        })
        .collect())
}

#[cfg(test)]
pub(crate) fn save_files_with_failure(
    root: &Path,
    files: &[CodeFile],
    overwrite: bool,
    fail_at: usize,
) -> Result<Vec<CodeFile>, String> {
    save_files_inner(root, files, overwrite, |index, _| {
        if index == fail_at {
            Err("forced commit failure".into())
        } else {
            Ok(())
        }
    })
}

#[cfg(test)]
pub(crate) fn save_files_with_competitor(
    root: &Path,
    files: &[CodeFile],
) -> Result<Vec<CodeFile>, String> {
    save_files_inner(root, files, false, |index, path| {
        if index == 1 {
            fs::write(path, b"competitor").map_err(|e| e.to_string())?;
        }
        Ok(())
    })
}

#[cfg(test)]
pub(crate) fn save_files_with_changed_prior(
    root: &Path,
    files: &[CodeFile],
) -> Result<Vec<CodeFile>, String> {
    save_files_inner(root, files, true, |index, _| {
        if index == 1 {
            let first = files.first().ok_or("missing fixture file")?;
            fs::write(root.join(&first.path), b"external writer changed this")
                .map_err(|e| e.to_string())?;
            Err("forced later commit failure".into())
        } else {
            Ok(())
        }
    })
}

pub fn generate(request: CreationRequest) -> Result<CreationResult, String> {
    let response = crate::network::generate(&request.settings, &request.prompt,
        "Return complete named files in fenced blocks. The first line INSIDE every block must be path: relative/file.ext. Close every block. Never repeat paths.")?;
    let blocks = parse_code_blocks(&response).map_err(|e| e.to_string())?;
    let files: Vec<_> = blocks
        .into_iter()
        .map(|f| CodeFile {
            id: uuid::Uuid::new_v4().to_string(),
            path: f.path,
            content: f.content,
            is_dirty: true,
        })
        .collect();
    let saved = save_files(Path::new(&request.output_dir), &files, false)?;
    Ok(CreationResult {
        files: saved,
        output_dir: request.output_dir,
    })
}

pub fn refine(request: RefinementRequest) -> Result<CodeFile, String> {
    validate_relative(&request.file.path).map_err(|e| e.to_string())?;
    if request.file.id.is_empty() {
        return Err("missing file identity".into());
    }
    let prompt = format!(
        "File: {}\nCurrent content:\n{}\nInstruction:\n{}",
        request.file.path, request.file.content, request.instruction
    );
    let content = crate::network::generate(
        &request.settings,
        &prompt,
        "Return only the full refined file content, without fences or commentary.",
    )?;
    Ok(CodeFile {
        content,
        is_dirty: true,
        ..request.file
    })
}
