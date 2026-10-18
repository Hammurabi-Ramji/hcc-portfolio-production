//! The Precedent: a law, a judgment, a decision of the house.
//!
//! A precedent is born a [`Draft`], is weighed and becomes [`Judged`], and is
//! carved into the vault ledger to become [`Sealed`]. Every transition consumes
//! its predecessor, and a `Precedent<Sealed>` can only come from the
//! [`Scribe`](crate::Scribe): carving a judged precedent, or replaying the
//! verified ledger. The signature is the ledger entry's, made by the one vault
//! signer; there is no second key.

use chrono::{DateTime, SecondsFormat, Utc};
use straw_security::{PrecedentReceipt, PrecedentRecord, StoredPrecedent};
use uuid::Uuid;

use crate::error::{Result, SteleError};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PrecedentCore {
    pub id: Uuid,
    pub title: String,
    pub body: String,
    pub author: String,
    pub created_at: DateTime<Utc>,
    pub rules_version: u32,
}

impl PrecedentCore {
    /// A new precedent identity stamped with the current time.
    pub fn new(
        title: impl Into<String>,
        body: impl Into<String>,
        author: impl Into<String>,
        rules_version: u32,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            title: title.into(),
            body: body.into(),
            author: author.into(),
            created_at: Utc::now(),
            rules_version,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Judgment {
    pub judge: String,
    pub rationale: String,
    pub judged_at: DateTime<Utc>,
}

impl Judgment {
    /// A judgment rendered at the current time.
    pub fn now(judge: impl Into<String>, rationale: impl Into<String>) -> Self {
        Self {
            judge: judge.into(),
            rationale: rationale.into(),
            judged_at: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Draft;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Judged {
    judgment: Judgment,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sealed {
    judgment: Judgment,
    receipt: PrecedentReceipt,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Precedent<S> {
    core: PrecedentCore,
    state: S,
}

impl<S> Precedent<S> {
    pub fn core(&self) -> &PrecedentCore {
        &self.core
    }
}

impl Precedent<Draft> {
    pub fn draft(core: PrecedentCore) -> Self {
        Self { core, state: Draft }
    }

    /// Consumes the draft: a judged draft no longer exists to be edited.
    pub fn judge(self, judgment: Judgment) -> Precedent<Judged> {
        Precedent {
            core: self.core,
            state: Judged { judgment },
        }
    }
}

fn stamp(t: &DateTime<Utc>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Nanos, true)
}

impl Precedent<Judged> {
    pub fn judgment(&self) -> &Judgment {
        &self.state.judgment
    }

    /// The exact record the ledger will commit to; its digest is the signed subject.
    pub fn record(&self) -> PrecedentRecord {
        PrecedentRecord {
            id: self.core.id.to_string(),
            title: self.core.title.clone(),
            body: self.core.body.clone(),
            author: self.core.author.clone(),
            created_at: stamp(&self.core.created_at),
            judge: self.state.judgment.judge.clone(),
            rationale: self.state.judgment.rationale.clone(),
            judged_at: stamp(&self.state.judgment.judged_at),
            rules_version: self.core.rules_version,
        }
    }

    pub(crate) fn into_sealed(self, receipt: PrecedentReceipt) -> Precedent<Sealed> {
        Precedent {
            core: self.core,
            state: Sealed {
                judgment: self.state.judgment,
                receipt,
            },
        }
    }
}

impl Precedent<Sealed> {
    pub fn judgment(&self) -> &Judgment {
        &self.state.judgment
    }

    pub fn receipt(&self) -> &PrecedentReceipt {
        &self.state.receipt
    }

    /// Position in the shared ledger.
    pub fn seq(&self) -> u32 {
        self.state.receipt.seq
    }

    pub fn digest(&self) -> &str {
        &self.state.receipt.digest
    }

    /// Rebuild from a precedent the security layer has just verified.
    pub(crate) fn from_ledger(stored: StoredPrecedent) -> Result<Self> {
        let StoredPrecedent { record, receipt } = stored;
        let time = |s: &str| {
            DateTime::parse_from_rfc3339(s)
                .map(|t| t.with_timezone(&Utc))
                .map_err(|e| {
                    SteleError::LedgerState(format!("bad timestamp at seq {}: {e}", receipt.seq))
                })
        };
        let core = PrecedentCore {
            id: Uuid::parse_str(&record.id).map_err(|e| {
                SteleError::LedgerState(format!("bad uuid at seq {}: {e}", receipt.seq))
            })?,
            title: record.title,
            body: record.body,
            author: record.author,
            created_at: time(&record.created_at)?,
            rules_version: record.rules_version,
        };
        let judgment = Judgment {
            judge: record.judge,
            rationale: record.rationale,
            judged_at: time(&record.judged_at)?,
        };
        Ok(Self {
            core,
            state: Sealed { judgment, receipt },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ledger_reconstruction_rejects_malformed_identity_and_timestamps_at_the_record_sequence() {
        let precedent = Precedent::draft(core()).judge(judgment());
        assert_eq!(precedent.judgment().judge, "Hammurabi");
        let record = precedent.record();
        let receipt = PrecedentReceipt {
            seq: 99,
            digest: record.digest(),
            entry_hash: "0".repeat(64),
            public_key: "1".repeat(64),
        };
        for invalid in ["id", "created_at", "judged_at"] {
            let mut record = record.clone();
            match invalid {
                "id" => record.id = "not a UUID".into(),
                "created_at" => record.created_at = "not a timestamp".into(),
                _ => record.judged_at = "not a timestamp".into(),
            }
            let error = Precedent::from_ledger(StoredPrecedent {
                record,
                receipt: receipt.clone(),
            })
            .unwrap_err();
            assert!(matches!(error, SteleError::LedgerState(_)));
            assert!(error.to_string().contains("seq 99"));
        }
        let loaded = Precedent::from_ledger(StoredPrecedent {
            record: record.clone(),
            receipt,
        })
        .unwrap();
        assert_eq!(loaded.digest(), record.digest());
        assert_eq!(loaded.seq(), 99);
        assert_eq!(loaded.core().created_at, core().created_at);
    }

    fn core() -> PrecedentCore {
        PrecedentCore {
            id: Uuid::from_u128(0xC0DE),
            title: "On the carving of laws".into(),
            body: "What is carved is carved.".into(),
            author: "R.K. Girdhari".into(),
            created_at: DateTime::parse_from_rfc3339("2026-10-13T00:00:00.5Z")
                .unwrap()
                .with_timezone(&Utc),
            rules_version: 1,
        }
    }

    fn judgment() -> Judgment {
        Judgment {
            judge: "Hammurabi".into(),
            rationale: "Weighed. Found just.".into(),
            judged_at: DateTime::parse_from_rfc3339("2026-10-13T01:00:00Z")
                .unwrap()
                .with_timezone(&Utc),
        }
    }

    type Edit = Box<dyn Fn(&mut PrecedentCore, &mut Judgment)>;

    fn digest_with(edit: &dyn Fn(&mut PrecedentCore, &mut Judgment)) -> String {
        let (mut c, mut j) = (core(), judgment());
        edit(&mut c, &mut j);
        Precedent::draft(c).judge(j).record().digest()
    }

    #[test]
    fn the_record_is_deterministic_and_uses_nanosecond_timestamps() {
        let a = Precedent::draft(core()).judge(judgment()).record();
        assert_eq!(a.digest(), digest_with(&|_, _| {}));
        assert_eq!(a.created_at, "2026-10-13T00:00:00.500000000Z");
        assert_eq!(a.id, Uuid::from_u128(0xC0DE).to_string());
    }

    #[test]
    fn every_field_changes_the_digest() {
        let base = digest_with(&|_, _| {});
        let edits: Vec<Edit> = vec![
            Box::new(|c, _| c.title.push('x')),
            Box::new(|c, _| c.body.push('x')),
            Box::new(|c, _| c.author.push('x')),
            Box::new(|c, _| c.rules_version += 1),
            Box::new(|c, _| c.id = Uuid::from_u128(1)),
            Box::new(|c, _| c.created_at += chrono::Duration::nanoseconds(1)),
            Box::new(|_, j| j.judge.push('x')),
            Box::new(|_, j| j.rationale.push('x')),
            Box::new(|_, j| j.judged_at += chrono::Duration::nanoseconds(1)),
        ];
        for (i, edit) in edits.iter().enumerate() {
            assert_ne!(
                base,
                digest_with(edit.as_ref()),
                "field edit #{i} left the digest unchanged"
            );
        }
    }

    #[test]
    fn fields_cannot_bleed_into_each_other() {
        let a = digest_with(&|c, _| {
            c.title = "ab".into();
            c.body = "c".into();
        });
        let b = digest_with(&|c, _| {
            c.title = "a".into();
            c.body = "bc".into();
        });
        assert_ne!(a, b);
    }
}
