//! The Scribe: the only hand that carves.
//!
//! It carves through [`Security`], so a precedent lands in the same signed
//! ledger as grants and vault events, under the same vault signer, covered by
//! the same checkpoint anchor. Carving needs an unlocked vault; replaying does
//! not. [`replay`](Scribe::replay) re-verifies the whole ledger (every link,
//! hash and signature, plus every precedent digest) before yielding anything.

use std::sync::Arc;

use straw_security::Security;

use crate::error::Result;
use crate::stele::{Judged, Precedent, Sealed};

/// A precedent recovered from a ledger that has just passed full verification.
#[derive(Debug)]
pub struct Verified {
    /// Position in the shared ledger.
    pub seq: u32,
    pub precedent: Precedent<Sealed>,
}

#[derive(Clone)]
pub struct Scribe {
    security: Arc<Security>,
}

impl Scribe {
    pub fn new(security: Arc<Security>) -> Self {
        Self { security }
    }

    /// Carve a judged precedent into the ledger. Consumes it; what comes back
    /// is the sealed precedent with its ledger receipt.
    pub fn carve(&self, precedent: Precedent<Judged>) -> Result<Precedent<Sealed>> {
        let receipt = self.security.carve_precedent(precedent.record())?;
        Ok(precedent.into_sealed(receipt))
    }

    /// Fold every verified precedent, in chain order, into `init`.
    pub fn replay<A, F>(&self, init: A, mut fold: F) -> Result<A>
    where
        F: FnMut(A, Verified) -> Result<A>,
    {
        let mut acc = init;
        for stored in self.security.precedents()? {
            let precedent = Precedent::from_ledger(stored)?;
            acc = fold(acc, Verified { seq: precedent.seq(), precedent })?;
        }
        Ok(acc)
    }

    pub fn count(&self) -> Result<usize> {
        Ok(self.security.precedents()?.len())
    }

    /// Entry hash of the newest precedent, or `None` before the first.
    pub fn tip(&self) -> Result<Option<String>> {
        Ok(self.security.precedents()?.pop().map(|p| p.receipt.entry_hash))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::SteleError;
    use crate::stele::{Judgment, PrecedentCore};
    use chrono::{DateTime, Utc};
    use straw_security::Permission;
    use straw_storage::Store;
    use uuid::Uuid;
    use zeroize::Zeroizing;

    const PASS: &str = "a strong test passphrase";

    struct Fixture {
        dir: tempfile::TempDir,
        store: Store,
        security: Arc<Security>,
        scribe: Scribe,
    }

    fn fixture() -> Fixture {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(dir.path().join("secure.db"), "").unwrap();
        let security = Arc::new(Security::open(store.clone(), dir.path().join("head.json")).unwrap());
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        let scribe = Scribe::new(security.clone());
        Fixture { dir, store, security, scribe }
    }

    fn judged(id: u128, title: &str) -> Precedent<Judged> {
        let at = |s: &str| DateTime::parse_from_rfc3339(s).unwrap().with_timezone(&Utc);
        Precedent::draft(PrecedentCore {
            id: Uuid::from_u128(id),
            title: title.into(),
            body: format!("The text of {title}."),
            author: "R.K. Girdhari".into(),
            created_at: at("2026-10-13T00:00:00.123456789Z"),
            rules_version: 1,
        })
        .judge(Judgment { judge: "Hammurabi".into(), rationale: "Weighed. Found just.".into(), judged_at: at("2026-10-13T01:00:00Z") })
    }

    #[test]
    fn carve_and_replay_in_one_chain_with_grants() {
        let f = fixture();
        let first = f.scribe.carve(judged(1, "Law I")).unwrap();
        f.security.issue(vec![Permission::Assist], "0".repeat(64)).unwrap();
        let second = f.scribe.carve(judged(2, "Law II")).unwrap();
        // initialize=0, precedent=1, grant=2, precedent=3: grants and laws share numbering.
        assert_eq!((first.seq(), second.seq()), (1, 3));
        assert_eq!(f.scribe.count().unwrap(), 2);
        assert_eq!(f.scribe.tip().unwrap().as_deref(), Some(second.receipt().entry_hash.as_str()));

        let titles = f
            .scribe
            .replay(Vec::new(), |mut acc, v| {
                acc.push((v.seq, v.precedent.core().title.clone(), v.precedent.judgment().judge.clone()));
                Ok(acc)
            })
            .unwrap();
        assert_eq!(titles, vec![(1, "Law I".into(), "Hammurabi".into()), (3, "Law II".into(), "Hammurabi".into())]);
    }

    #[test]
    fn replay_reproduces_what_was_carved() {
        let f = fixture();
        let sealed = f.scribe.carve(judged(7, "Law VII")).unwrap();
        let replayed = f.scribe.replay(Vec::new(), |mut acc, v| { acc.push(v.precedent); Ok(acc) }).unwrap();
        assert_eq!(replayed, vec![sealed]);
    }

    #[test]
    fn carving_needs_the_unlocked_vault_but_reading_does_not() {
        let f = fixture();
        f.scribe.carve(judged(1, "Law I")).unwrap();
        f.security.lock().unwrap();
        assert_eq!(f.scribe.carve(judged(2, "Law II")).unwrap_err(), SteleError::VaultLocked);
        assert_eq!(f.scribe.count().unwrap(), 1);
        f.security.unlock(Zeroizing::new(PASS.into())).unwrap();
        f.scribe.carve(judged(2, "Law II")).unwrap();
    }

    #[test]
    fn a_precedent_is_carved_exactly_once() {
        let f = fixture();
        f.scribe.carve(judged(1, "Law I")).unwrap();
        assert!(f.scribe.carve(judged(1, "Law I again")).is_err());
        assert_eq!(f.scribe.count().unwrap(), 1);
    }

    #[test]
    fn the_laws_hold_in_sql_and_replay_catches_a_dropped_trigger() {
        let f = fixture();
        f.scribe.carve(judged(1, "Law I")).unwrap();
        let sql = |statement: &'static str| f.store.call(move |c| Box::pin(async move { sqlx::raw_sql(statement).execute(c).await.map(|_| ()) }));
        assert!(sql("UPDATE secure_precedent SET title='forgery'").is_err());
        assert!(sql("DELETE FROM secure_precedent").is_err());
        assert!(sql("UPDATE secure_ledger SET subject='x'").is_err());
        sql("DROP TRIGGER secure_precedent_no_update; UPDATE secure_precedent SET body='forgery';").unwrap();
        assert!(matches!(f.scribe.count().unwrap_err(), SteleError::Quarantined(_)));
        assert!(matches!(f.scribe.carve(judged(2, "Law II")).unwrap_err(), SteleError::Quarantined(_)));
    }

    #[test]
    fn rolling_the_database_back_is_caught_by_the_anchor() {
        let f = fixture();
        f.scribe.carve(judged(1, "Law I")).unwrap();
        let anchor = f.dir.path().join("head.json");
        let old = std::fs::read(&anchor).unwrap();
        f.scribe.carve(judged(2, "Law II")).unwrap();
        std::fs::write(&anchor, old).unwrap();
        assert!(matches!(f.scribe.count().unwrap_err(), SteleError::Quarantined(_)));
    }

    #[test]
    fn convenience_constructors_stamp_identity_and_time() {
        let f = fixture();
        let sealed = f
            .scribe
            .carve(Precedent::draft(PrecedentCore::new("Law", "text", "operator", 1)).judge(Judgment::now("operator", "because")))
            .unwrap();
        let other = Precedent::draft(PrecedentCore::new("Law", "text", "operator", 1));
        assert_ne!(sealed.core().id, other.core().id, "every precedent gets its own identity");
        assert!(sealed.judgment().judged_at >= sealed.core().created_at);
    }

    #[test]
    fn carved_precedents_endure_a_restart() {
        let f = fixture();
        f.scribe.carve(judged(1, "Law I")).unwrap();
        let dir = f.dir;
        drop((f.scribe, f.security, f.store));
        let store = Store::open(dir.path().join("secure.db"), "").unwrap();
        let reopened = Scribe::new(Arc::new(Security::open(store, dir.path().join("head.json")).unwrap()));
        assert_eq!(reopened.count().unwrap(), 1);
    }
}
