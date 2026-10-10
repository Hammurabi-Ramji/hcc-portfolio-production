use straw_ledger::{ChainError, Ledger, OutcomeRecord, Sealed, GENESIS};

#[test]
fn record_encoding_matches_independent_digest_for_unicode_payload() {
    let mut ledger = Ledger::new();
    ledger.append(12, "second 🦀");
    let verified = ledger.seal().verify_chain().unwrap();
    // .NET SHA256 of seq (BE u64), zero genesis (32 bytes), timestamp
    // (BE u64), UTF-8 byte length (BE u64), and the exact UTF-8 payload.
    assert_eq!(
        straw_ledger::hex(&verified.head_hash()),
        "305779141270756a922e517c317ed7acaaed8a18c343b72106c9825a3643c5f5"
    );
}

fn fixture() -> (Vec<OutcomeRecord>, [u8; 32]) {
    let mut open = Ledger::new();
    open.append(12, "first");
    open.append(12, "second 🦀");
    open.append(19, "last");
    let verified = open.seal().verify_chain().unwrap();
    (verified.records().to_vec(), verified.head_hash())
}

fn check(records: Vec<OutcomeRecord>, head: [u8; 32]) -> Option<ChainError> {
    Ledger::<Sealed>::from_records(records, head)
        .verify_chain()
        .err()
}

#[test]
fn imported_records_must_pass_verification_before_receipts_are_available() {
    let (records, head) = fixture();
    let verified = Ledger::<Sealed>::from_records(records.clone(), head)
        .verify_chain()
        .unwrap();
    assert_eq!(verified.records(), records);
    assert_eq!(verified.head_hash(), head);
}

#[test]
fn sequence_changes_deletions_duplicates_and_reordering_are_rejected() {
    let (records, head) = fixture();
    let mut changed = records.clone();
    changed[1].seq = 8;
    assert_eq!(
        check(changed, head),
        Some(ChainError::SeqMismatch {
            expected: 1,
            found: 8
        })
    );
    let mut deleted = records.clone();
    deleted.remove(1);
    assert_eq!(
        check(deleted, head),
        Some(ChainError::SeqMismatch {
            expected: 1,
            found: 2
        })
    );
    let mut duplicated = records.clone();
    duplicated.insert(1, records[0].clone());
    assert_eq!(
        check(duplicated, head),
        Some(ChainError::SeqMismatch {
            expected: 1,
            found: 0
        })
    );
    let mut reordered = records;
    reordered.swap(0, 1);
    assert_eq!(
        check(reordered, head),
        Some(ChainError::SeqMismatch {
            expected: 0,
            found: 1
        })
    );
}

#[test]
fn payload_timestamp_record_hash_and_genesis_link_tampering_are_rejected() {
    let (records, head) = fixture();
    let mut payload = records.clone();
    payload[1].payload.push('!');
    assert_eq!(
        check(payload, head),
        Some(ChainError::HashMismatch { at: 1 })
    );
    let mut timestamp = records.clone();
    timestamp[1].timestamp += 1;
    assert_eq!(
        check(timestamp, head),
        Some(ChainError::HashMismatch { at: 1 })
    );
    let mut hash = records.clone();
    hash[1].hash[0] ^= 1;
    assert_eq!(check(hash, head), Some(ChainError::HashMismatch { at: 1 }));
    let mut link = records;
    link[0].prev_hash[0] ^= 1;
    assert_eq!(check(link, head), Some(ChainError::LinkBroken { at: 0 }));
}

#[test]
fn trusted_head_detects_suffix_truncation_and_whole_chain_replacement() {
    let (mut records, trusted_head) = fixture();
    records.pop();
    assert_eq!(
        check(records.clone(), trusted_head),
        Some(ChainError::HeadMismatch)
    );
    // A head taken from the truncated store cannot detect that truncation.
    let untrusted_head = records.last().unwrap().hash;
    assert_eq!(check(records, untrusted_head), None);
    let mut replacement = Ledger::new();
    replacement.append(12, "replacement");
    let replacement = replacement.seal().verify_chain().unwrap();
    assert_eq!(
        check(replacement.records().to_vec(), trusted_head),
        Some(ChainError::HeadMismatch)
    );
    assert_eq!(check(vec![], trusted_head), Some(ChainError::HeadMismatch));
    assert_eq!(check(vec![], GENESIS), None);
}

#[test]
fn byte_length_framing_and_fixed_width_fields_distinguish_outcomes() {
    let build = |timestamp, payload| {
        let mut ledger = Ledger::new();
        ledger.append(timestamp, payload);
        ledger.seal().verify_chain().unwrap().head_hash()
    };
    assert_ne!(build(1, "23"), build(12, "3"));
    assert_ne!(build(1, "a\0b"), build(1, "ab\0"));
    assert_ne!(build(1, "🦀"), build(1, ""));
    assert_eq!(build(1, "🦀"), build(1, "🦀"));
}
