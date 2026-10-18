//! Process execution behind a trait so gate logic is testable without
//! spawning real builds. `SystemRunner` is the production implementation;
//! `ScriptedRunner` replays canned output for tests.

use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::Mutex;

#[derive(Debug, Clone, Default)]
pub struct Output {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
}

pub trait Runner {
    /// `Err` means the program could not be started at all (for example not installed).
    fn run(&self, cwd: &Path, program: &str, args: &[&str]) -> Result<Output, String>;
}

pub struct SystemRunner;

impl Runner for SystemRunner {
    fn run(&self, cwd: &Path, program: &str, args: &[&str]) -> Result<Output, String> {
        // GUI launchers do not necessarily inherit the Rust toolchain's PATH.
        let rust_bin = std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" })
            .map(std::path::PathBuf::from)
            .map(|home| home.join(".cargo/bin"));
        let rust_tool = matches!(program, "cargo" | "trunk");
        let installed = rust_bin.as_ref().map(|bin| bin.join(if cfg!(windows) { format!("{program}.exe") } else { program.to_owned() }));
        let executable = if rust_tool {
            installed.filter(|path| path.is_file()).unwrap_or_else(|| program.into())
        } else { program.into() };
        let mut command = Command::new(executable);
        command.args(args).current_dir(cwd).stdin(Stdio::null());
        // NO_COLOR commonly uses the presence-only value "1". Trunk parses
        // it as a boolean; normalize the child value so color preferences
        // cannot turn a valid frontend into a compilation failure.
        if program == "trunk" { command.env("NO_COLOR", "true"); }
        if rust_tool {
            if let Some(bin) = rust_bin.filter(|path| path.is_dir()) {
                let inherited = std::env::var_os("PATH").unwrap_or_default();
                let paths = std::iter::once(bin).chain(std::env::split_paths(&inherited));
                let path = std::env::join_paths(paths).map_err(|e| format!("invalid toolchain PATH: {e}"))?;
                command.env("PATH", path);
            }
        }
        // A validator measured by cargo-llvm-cov may itself validate another
        // project. The outer wrapper's private environment must not become the
        // inner project's compiler configuration or profile destination. Scope
        // removals to this child; never mutate the parallel test process.
        if std::env::var_os("CARGO_LLVM_COV").is_some() {
            for (name, _) in std::env::vars_os() {
                let text = name.to_string_lossy();
                if text.starts_with("CARGO_LLVM_COV") || text.starts_with("__CARGO_LLVM_COV") {
                    command.env_remove(name);
                }
            }
            let coverage_wrapper = std::env::var_os("RUSTC_WRAPPER")
                .map(std::path::PathBuf::from)
                .and_then(|p| p.file_name().map(|n| n.to_owned()))
                .is_some_and(|n| n == "cargo-llvm-cov" || n == "cargo-llvm-cov.exe");
            if coverage_wrapper { command.env_remove("RUSTC_WRAPPER"); }
            command.env_remove("LLVM_PROFILE_FILE");
        }
        let out = command
            .output()
            .map_err(|e| format!("cannot start '{program}': {e}"))?;
        Ok(Output {
            success: out.status.success(),
            stdout: String::from_utf8_lossy(&out.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&out.stderr).into_owned(),
        })
    }
}

/// Test support: answers commands by matching the front of "program args...".
#[derive(Default)]
pub struct ScriptedRunner {
    script: Vec<(String, Result<Output, String>)>,
    calls: Mutex<Vec<String>>,
}

impl ScriptedRunner {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn on(mut self, command_prefix: &str, response: Result<Output, String>) -> Self {
        self.script.push((command_prefix.to_owned(), response));
        self
    }

    pub fn ok(self, command_prefix: &str, stdout: &str) -> Self {
        self.on(command_prefix, Ok(Output { success: true, stdout: stdout.into(), stderr: String::new() }))
    }

    pub fn fail(self, command_prefix: &str, stderr: &str) -> Self {
        self.on(command_prefix, Ok(Output { success: false, stdout: String::new(), stderr: stderr.into() }))
    }

    pub fn calls(&self) -> Vec<String> {
        self.calls.lock().expect("calls lock").clone()
    }
}

impl Runner for ScriptedRunner {
    fn run(&self, _cwd: &Path, program: &str, args: &[&str]) -> Result<Output, String> {
        let line = std::iter::once(program).chain(args.iter().copied()).collect::<Vec<_>>().join(" ");
        self.calls.lock().expect("calls lock").push(line.clone());
        self.script
            .iter()
            .find(|(prefix, _)| line.starts_with(prefix.as_str()))
            .map(|(_, response)| response.clone())
            .unwrap_or_else(|| Err(format!("unscripted command: {line}")))
    }
}

/// Last few non-empty lines of output, for failure details.
pub fn tail(out: &Output, lines: usize) -> String {
    let text = if out.stderr.trim().is_empty() { &out.stdout } else { &out.stderr };
    let kept: Vec<&str> = text.lines().filter(|l| !l.trim().is_empty()).collect();
    let start = kept.len().saturating_sub(lines);
    kept[start..].join(" | ")
}
