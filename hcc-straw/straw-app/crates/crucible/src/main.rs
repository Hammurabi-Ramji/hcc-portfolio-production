//! Crucible CLI. Exit codes: 0 pass/warn, 1 fail (or incomplete), 2 internal error.

use std::path::PathBuf;
use std::process::ExitCode;

use clap::{Parser, Subcommand, ValueEnum};
use crucible::gates::{self, Context};
use crucible::{composite_status, report, CompositeStatus, GateName, GateResult};

#[derive(Parser)]
#[command(name = "crucible", version, about = "The Nine Gates validation system")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Clone, Copy, ValueEnum)]
enum Format {
    Table,
    Json,
}

/// Where the shared vault ledger lives and how to unlock its signer.
#[cfg(feature = "stele")]
#[derive(clap::Args)]
struct Vault {
    /// Vault database (the application's straw.db)
    #[arg(long = "vault-db")]
    db: PathBuf,
    /// Checkpoint anchor file (the application's straw-checkpoint.json)
    #[arg(long)]
    anchor: PathBuf,
}

#[derive(Subcommand)]
enum Command {
    /// Run all nine gates against a project directory
    Validate {
        path: PathBuf,
        #[arg(long, value_enum, default_value = "table")]
        format: Format,
        /// Exit 0 when no gate failed even though some gates did not run
        #[arg(long)]
        allow_incomplete: bool,
        /// Line-coverage target for gate 7, in percent
        #[arg(long, default_value_t = 85.0)]
        coverage_threshold: f64,
        /// Carve the verdict into the vault ledger when the run is SOVEREIGN CERTIFIED
        #[cfg(feature = "stele")]
        #[arg(long = "vault-db", requires = "anchor")]
        vault_db: Option<PathBuf>,
        #[cfg(feature = "stele")]
        #[arg(long, requires = "vault_db")]
        anchor: Option<PathBuf>,
        /// File holding the vault passphrase (else the CRUCIBLE_VAULT_PASSPHRASE variable)
        #[cfg(feature = "stele")]
        #[arg(long, requires = "vault_db")]
        passphrase_file: Option<PathBuf>,
    },
    /// Run a single gate (name or 1-9)
    Gate {
        gate: GateName,
        path: PathBuf,
        #[arg(long, value_enum, default_value = "table")]
        format: Format,
        #[arg(long, default_value_t = 85.0)]
        coverage_threshold: f64,
    },
    /// Verify the vault ledger and count the precedents in it (no passphrase needed)
    #[cfg(feature = "stele")]
    SteleVerify {
        #[command(flatten)]
        vault: Vault,
    },
}

fn emit(results: &[GateResult], format: Format) {
    match format {
        Format::Table => print!("{}", report::render_table(results)),
        Format::Json => println!("{}", report::render_json(results)),
    }
}

fn exit_code(results: &[GateResult], allow_incomplete: bool) -> ExitCode {
    ExitCode::from(match composite_status(results) {
        CompositeStatus::Blocked => 1,
        CompositeStatus::Incomplete if !allow_incomplete => 1,
        _ => 0,
    })
}

fn run(cli: Cli) -> Result<ExitCode, Box<dyn std::error::Error>> {
    match cli.command {
        Command::Validate {
            path,
            format,
            allow_incomplete,
            coverage_threshold,
            #[cfg(feature = "stele")]
            vault_db,
            #[cfg(feature = "stele")]
            anchor,
            #[cfg(feature = "stele")]
            passphrase_file,
        } => {
            let ctx = Context {
                coverage_threshold,
                ..Context::system()
            };
            let before = crucible::evidence::snapshot(&path)?;
            let mut results = gates::run_all(&path, &ctx)?;
            if before != crucible::evidence::snapshot(&path)? {
                results[0].status = crucible::GateStatus::Fail;
                results[0].details =
                    "Source changed during validation; run again against stable inputs".into();
            }
            emit(&results, format);
            #[cfg(feature = "stele")]
            if let (Some(db), Some(anchor)) = (vault_db, anchor) {
                if composite_status(&results) == CompositeStatus::SovereignCertified {
                    let passphrase = crucible::mint::read_passphrase(passphrase_file.as_deref())?;
                    let minted = crucible::mint::mint(&db, &anchor, passphrase, &path, &results)?;
                    eprintln!(
                        "STELE: carved precedent at ledger seq {} sha256={} signer={}",
                        minted.seq, minted.digest, minted.public_key
                    );
                } else {
                    eprintln!(
                        "STELE: no precedent carved ({})",
                        composite_status(&results)
                    );
                }
            }
            Ok(exit_code(&results, allow_incomplete))
        }
        Command::Gate {
            gate,
            path,
            format,
            coverage_threshold,
        } => {
            let ctx = Context {
                coverage_threshold,
                ..Context::system()
            };
            let results = vec![gates::run_gate(gate, &path, &ctx)?];
            emit(&results, format);
            // A single gate is a complete answer for that gate.
            Ok(exit_code(&results, true))
        }
        #[cfg(feature = "stele")]
        Command::SteleVerify { vault } => {
            let (count, tip) = crucible::mint::verify_stele(&vault.db, &vault.anchor)?;
            println!(
                "ledger verified: {count} precedent(s), newest entry {}",
                tip.unwrap_or_else(|| "(none)".into())
            );
            Ok(ExitCode::SUCCESS)
        }
    }
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("crucible: {e}");
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod cli_tests {
    use super::*;
    #[test]
    fn process_exit_codes_preserve_failure_and_incomplete_policy() {
        use crucible::GateStatus;
        let full = |status| {
            GateName::ALL
                .into_iter()
                .map(|gate| GateResult {
                    gate,
                    status,
                    details: "reviewed".into(),
                    violations: vec![],
                })
                .collect::<Vec<_>>()
        };
        assert_eq!(exit_code(&full(GateStatus::Pass), false), ExitCode::SUCCESS);
        assert_eq!(exit_code(&full(GateStatus::Warn), false), ExitCode::SUCCESS);
        assert_eq!(exit_code(&full(GateStatus::Fail), true), ExitCode::from(1));
        assert_eq!(exit_code(&[], false), ExitCode::from(1));
        assert_eq!(exit_code(&[], true), ExitCode::SUCCESS);
    }
    #[test]
    fn validation_does_not_require_signing_or_a_passphrase() {
        assert!(Cli::try_parse_from(["crucible", "validate", "."]).is_ok());
    }
    #[cfg(feature = "stele")]
    #[test]
    fn signing_requires_a_database_and_its_checkpoint_together() {
        assert!(
            Cli::try_parse_from(["crucible", "validate", ".", "--vault-db", "vault.db"]).is_err()
        );
        assert!(
            Cli::try_parse_from(["crucible", "validate", ".", "--anchor", "head.json"]).is_err()
        );
        assert!(Cli::try_parse_from([
            "crucible",
            "validate",
            ".",
            "--vault-db",
            "vault.db",
            "--anchor",
            "head.json"
        ])
        .is_ok());
        assert!(Cli::try_parse_from([
            "crucible",
            "stele-verify",
            "--vault-db",
            "vault.db",
            "--anchor",
            "head.json"
        ])
        .is_ok());
    }
}
