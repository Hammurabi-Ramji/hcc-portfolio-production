//! STRAW-002: Tamper-evident execution ledger.
//! Typestate: Ledger<Open> -> seal() -> Ledger<Sealed> -> verify_chain() -> Ledger<ChainVerified>
//! Pattern provenance: horde_iedb seal-and-verify, re-forged std-only. No upstream source imported.
//!
//! This core performs no persistence, networking, or operator authentication.
//! Verification proves consistency against the supplied head. An independent
//! trusted head is needed to detect a rewritten chain or suffix truncation.
//!
//! Only open ledgers accept records:
//! ```compile_fail
//! use straw_ledger::Ledger;
//! let mut sealed = Ledger::new().seal();
//! sealed.append(1, "outcome");
//! ```
//! Only sealed ledgers can be verified:
//! ```compile_fail
//! use straw_ledger::Ledger;
//! let _ = Ledger::new().verify_chain();
//! ```
//! Unverified heads cannot be exposed as verified receipts:
//! ```compile_fail
//! use straw_ledger::Ledger;
//! let _ = Ledger::new().seal().head_hash();
//! ```
//! Verified ledgers cannot be appended:
//! ```compile_fail
//! use straw_ledger::Ledger;
//! let mut verified = Ledger::new().seal().verify_chain().unwrap();
//! verified.append(1, "outcome");
//! ```
//! Sealing consumes the open ledger:
//! ```compile_fail
//! use straw_ledger::Ledger;
//! let mut open = Ledger::new();
//! let sealed = open.seal();
//! open.append(1, "outcome");
//! ```

#![forbid(unsafe_code)]

use core::marker::PhantomData;

// ---------------------------------------------------------------- SHA-256 (std-only)
pub struct Sha256 {
    state: [u32; 8],
    buf: [u8; 64],
    buflen: usize,
    len: u64,
}

impl Default for Sha256 {
    fn default() -> Self {
        Self::new()
    }
}

const K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

impl Sha256 {
    pub fn new() -> Self {
        Self {
            state: [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
                0x5be0cd19,
            ],
            buf: [0u8; 64],
            buflen: 0,
            len: 0,
        }
    }

    pub fn update(&mut self, mut data: &[u8]) {
        self.len = self.len.wrapping_add(data.len() as u64);
        if self.buflen > 0 {
            let need = 64 - self.buflen;
            let take = need.min(data.len());
            self.buf[self.buflen..self.buflen + take].copy_from_slice(&data[..take]);
            self.buflen += take;
            data = &data[take..];
            if self.buflen == 64 {
                let block = self.buf;
                self.compress(&block);
                self.buflen = 0;
            }
        }
        while data.len() >= 64 {
            let mut block = [0u8; 64];
            block.copy_from_slice(&data[..64]);
            self.compress(&block);
            data = &data[64..];
        }
        if !data.is_empty() {
            self.buf[..data.len()].copy_from_slice(data);
            self.buflen = data.len();
        }
    }

    pub fn finalize(mut self) -> [u8; 32] {
        let bitlen = self.len.wrapping_mul(8);
        self.update(&[0x80]);
        while self.buflen != 56 {
            self.update(&[0x00]);
        }
        // len-manual pad: update() above mutated self.len; bitlen already captured.
        let mut b = [0u8; 64];
        b[..56].copy_from_slice(&self.buf[..56]);
        b[56..].copy_from_slice(&bitlen.to_be_bytes());
        self.compress(&b);
        let mut out = [0u8; 32];
        for (i, w) in self.state.iter().enumerate() {
            out[i * 4..i * 4 + 4].copy_from_slice(&w.to_be_bytes());
        }
        out
    }

    fn compress(&mut self, block: &[u8; 64]) {
        let mut w = [0u32; 64];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([
                block[i * 4],
                block[i * 4 + 1],
                block[i * 4 + 2],
                block[i * 4 + 3],
            ]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut h] = self.state;
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ (!e & g);
            let t1 = h
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            h = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        self.state[0] = self.state[0].wrapping_add(a);
        self.state[1] = self.state[1].wrapping_add(b);
        self.state[2] = self.state[2].wrapping_add(c);
        self.state[3] = self.state[3].wrapping_add(d);
        self.state[4] = self.state[4].wrapping_add(e);
        self.state[5] = self.state[5].wrapping_add(f);
        self.state[6] = self.state[6].wrapping_add(g);
        self.state[7] = self.state[7].wrapping_add(h);
    }
}

pub fn sha256(data: &[u8]) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(data);
    h.finalize()
}

// ---------------------------------------------------------------- Ledger typestate
/// One sealed outcome. `hash` commits to (seq, prev_hash, timestamp, payload).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct OutcomeRecord {
    pub seq: u64,
    pub prev_hash: [u8; 32],
    pub timestamp: u64,
    pub payload: String,
    pub hash: [u8; 32],
}

pub const GENESIS: [u8; 32] = [0u8; 32];

#[derive(Debug, PartialEq, Eq)]
pub enum ChainError {
    SeqMismatch { expected: u64, found: u64 },
    LinkBroken { at: u64 },
    HashMismatch { at: u64 },
    HeadMismatch,
}

impl std::fmt::Display for ChainError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::SeqMismatch { expected, found } => {
                write!(f, "sequence mismatch: expected {expected}, found {found}")
            }
            Self::LinkBroken { at } => write!(f, "broken chain link at sequence {at}"),
            Self::HashMismatch { at } => write!(f, "record hash mismatch at sequence {at}"),
            Self::HeadMismatch => f.write_str("chain head does not match expected head"),
        }
    }
}

impl std::error::Error for ChainError {}

pub struct Open;
pub struct Sealed;
pub struct ChainVerified;

/// Ledger generic over its lifecycle state. `records` is private;
/// only the typestate dictates which operations exist.
pub struct Ledger<S> {
    records: Vec<OutcomeRecord>,
    head: [u8; 32],
    _state: PhantomData<S>,
}

impl Ledger<Open> {
    pub fn new() -> Self {
        Self {
            records: Vec::new(),
            head: GENESIS,
            _state: PhantomData,
        }
    }

    /// Append one outcome payload. Hash is computed immediately —
    /// records are immutable the moment they enter the ledger.
    pub fn append(&mut self, timestamp: u64, payload: &str) {
        let seq = self.records.len() as u64;
        let prev_hash = self.head;
        let hash = record_hash(seq, prev_hash, timestamp, payload);
        self.head = hash;
        self.records.push(OutcomeRecord {
            seq,
            prev_hash,
            timestamp,
            payload: payload.to_string(),
            hash,
        });
    }

    /// Freeze the ledger. Consumes self — an Open ledger cannot survive alongside a Sealed one.
    pub fn seal(self) -> Ledger<Sealed> {
        Ledger {
            records: self.records,
            head: self.head,
            _state: PhantomData,
        }
    }
}

impl Default for Ledger<Open> {
    fn default() -> Self {
        Self::new()
    }
}

impl Ledger<Sealed> {
    /// Load untrusted records without granting the verified state.
    ///
    /// The adapter must preserve stored sequence values and ordering. Obtain
    /// `expected_head` from a trusted checkpoint for rollback/rewrite detection;
    /// taking it from the same writable store only checks internal consistency.
    /// No records are repaired, reordered, or authenticated here.
    pub fn from_records(records: Vec<OutcomeRecord>, expected_head: [u8; 32]) -> Self {
        Self {
            records,
            head: expected_head,
            _state: PhantomData,
        }
    }

    /// Re-derive every hash from raw fields and check chain linkage.
    /// Consumes self — an unverifiable-in-place ledger; you either get
    /// ChainVerified or an error, never a half-checked state.
    pub fn verify_chain(self) -> Result<Ledger<ChainVerified>, ChainError> {
        let mut prev = GENESIS;
        for (i, r) in self.records.iter().enumerate() {
            let expected_seq = i as u64;
            if r.seq != expected_seq {
                return Err(ChainError::SeqMismatch {
                    expected: expected_seq,
                    found: r.seq,
                });
            }
            if r.prev_hash != prev {
                return Err(ChainError::LinkBroken { at: r.seq });
            }
            let derived = record_hash(r.seq, r.prev_hash, r.timestamp, &r.payload);
            if derived != r.hash {
                return Err(ChainError::HashMismatch { at: r.seq });
            }
            prev = r.hash;
        }
        if prev != self.head {
            return Err(ChainError::HeadMismatch);
        }
        Ok(Ledger {
            records: self.records,
            head: self.head,
            _state: PhantomData,
        })
    }
}

impl Ledger<ChainVerified> {
    /// Head hash — receipt-grade, display in cockpit.
    pub fn head_hash(&self) -> [u8; 32] {
        self.head
    }

    pub fn records(&self) -> &[OutcomeRecord] {
        &self.records
    }
}

/// Deterministic record hash: length-prefixed payload (no ambiguity), fixed-width fields.
fn record_hash(seq: u64, prev_hash: [u8; 32], timestamp: u64, payload: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(&seq.to_be_bytes());
    h.update(&prev_hash);
    h.update(&timestamp.to_be_bytes());
    h.update(&(payload.len() as u64).to_be_bytes());
    h.update(payload.as_bytes());
    h.finalize()
}

/// Lowercase hex — for receipts and Eduba archival.
pub fn hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for &b in bytes {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0x0f) as usize] as char);
    }
    s
}

// ---------------------------------------------------------------- Tests (Gate: zero panics)
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seal_then_verify_passes() {
        let mut l = Ledger::new();
        l.append(1, r#"{"run":"STRAW-001","status":"ok"}"#);
        l.append(2, r#"{"run":"STRAW-001","status":"ok","nodes":3}"#);
        let head = l.seal().verify_chain().expect("clean chain verifies");
        assert_eq!(head.records().len(), 2);
        assert_ne!(head.head_hash(), GENESIS);
    }

    #[test]
    fn empty_ledger_seals_and_verifies_at_genesis() {
        let head = Ledger::new()
            .seal()
            .verify_chain()
            .expect("empty chain verifies");
        assert_eq!(head.head_hash(), GENESIS);
    }

    #[test]
    fn tampered_payload_fails_verification() {
        let mut l = Ledger::new();
        l.append(1, "payload-a");
        l.append(2, "payload-b");
        let mut sealed = l.seal();
        sealed.records[0].payload = "payload-TAMPERED".to_string();
        assert_eq!(
            sealed.verify_chain().err(),
            Some(ChainError::HashMismatch { at: 0 })
        );
    }

    #[test]
    fn broken_link_fails_verification() {
        let mut l = Ledger::new();
        l.append(1, "a");
        l.append(2, "b");
        let mut sealed = l.seal();
        sealed.records[1].prev_hash = [0xff; 32];
        assert_eq!(
            sealed.verify_chain().err(),
            Some(ChainError::LinkBroken { at: 1 })
        );
    }

    #[test]
    fn head_mismatch_detected() {
        let mut l = Ledger::new();
        l.append(1, "a");
        let mut sealed = l.seal();
        sealed.head = [0x42; 32];
        assert_eq!(sealed.verify_chain().err(), Some(ChainError::HeadMismatch));
    }

    #[test]
    fn ordering_is_deterministic() {
        let build = || {
            let mut l = Ledger::new();
            l.append(7, "x");
            l.append(9, "y");
            l.seal().verify_chain().unwrap().head_hash()
        };
        assert_eq!(build(), build());
    }

    #[test]
    fn sha256_known_vector() {
        assert_eq!(
            hex(&sha256(b"abc")),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }
}
