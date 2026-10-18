//! The Stele: precedents in the vault's one signed chain.
//!
//! This crate is the typestate and the Scribe. Storage, signing and verification
//! belong to `straw-security`: a precedent is a ledger entry like any other,
//! signed by the single vault signer and covered by the same checkpoint anchor.
//!
//! * [`stele`]: `Precedent<Draft, Judged, Sealed>`. A sealed precedent exists only
//!   as the result of carving, or of replaying a verified ledger.
//! * [`scribe`]: the only hand that carves, and the verified replay.
#![forbid(unsafe_code)]

pub mod error;
pub mod scribe;
pub mod stele;

pub use error::{Result, SteleError};
pub use scribe::{Scribe, Verified};
pub use stele::{Draft, Judged, Judgment, Precedent, PrecedentCore, Sealed};
pub use straw_security::{PrecedentReceipt, PrecedentRecord};
