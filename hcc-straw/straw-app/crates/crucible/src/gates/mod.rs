//! Gate registry. BSM-CODE: gate.all()

pub mod compilation;
pub mod completeness;
pub mod lint;
pub mod philosophy;
pub mod portability;
pub mod reproducibility;
pub mod security;
pub mod structure;
pub mod tests;

use std::path::Path;

use crate::exec::{Runner, SystemRunner};
use crate::{CrucibleError, GateName, GateResult};

/// Everything a gate may need beyond the project tree.
pub struct Context<'a> {
    /// How gates 6-8 start external tools.
    pub runner: &'a dyn Runner,
    /// Line-coverage target for gate 7, in percent.
    pub coverage_threshold: f64,
}

impl Context<'static> {
    /// Real processes, 85% coverage target.
    pub fn system() -> Self {
        Context { runner: &SystemRunner, coverage_threshold: 85.0 }
    }
}

fn check_root(root: &Path) -> Result<(), CrucibleError> {
    if root.is_dir() {
        Ok(())
    } else {
        Err(CrucibleError::NotADirectory(root.to_path_buf()))
    }
}

pub fn run_gate(gate: GateName, root: &Path, ctx: &Context) -> Result<GateResult, CrucibleError> {
    check_root(root)?;
    match gate {
        GateName::Structure => structure::run(root),
        GateName::Completeness => completeness::run(root),
        GateName::Security => security::run(root),
        GateName::Reproducibility => reproducibility::run(root),
        GateName::Portability => portability::run(root),
        GateName::Compilation => compilation::run(root, ctx),
        GateName::Tests => tests::run(root, ctx),
        GateName::Lint => lint::run(root, ctx),
        GateName::Philosophy => philosophy::run(root),
    }
}

/// Runs all nine gates in order.
pub fn run_all(root: &Path, ctx: &Context) -> Result<Vec<GateResult>, CrucibleError> {
    GateName::ALL.iter().map(|g| run_gate(*g, root, ctx)).collect()
}
