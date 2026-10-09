use straw_ledger::{hex, sha256, Sha256};

// Expected digests were generated independently with .NET SHA256.
#[test]
fn independent_digest_vectors_cover_padding_and_streaming_boundaries() {
    let vectors = [
        (
            0,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ),
        (
            1,
            "4a64a107f0cb32536e5bce6c98c393db21cca7f4ea187ba8c4dca8b51d4ea80a",
        ),
        (
            55,
            "c096925d8ee622ec75c396b1712bcb599952e05c2cd1f3e33032514893edbc83",
        ),
        (
            56,
            "4e3bd718369bf855312b6fae0e874c697a5c910c0270ebab390f15872a7878a5",
        ),
        (
            63,
            "e5e8e5e7481532428a3d324d4163fe92fea5f52e85fbe33abfa5aa9235c5addf",
        ),
        (
            64,
            "f616afd08efb65e91c7fa856fff5e2b991980c5b3fbdffb81f1e4d9dbdb509d7",
        ),
        (
            65,
            "8ce44bf6e55d58f6f5fa326e9fa574cf8fd80adcaf299d4b2f93e9b7414a9821",
        ),
        (
            119,
            "c00e1cc2347e04aa6a068b6b5c23009fa561f4ef726da233b8b5f32794ae0332",
        ),
        (
            120,
            "d6fe8be9a4f9a257e2f833c02739fffb8dfe6ea0d5ff008a0782d3b00d246274",
        ),
        (
            127,
            "45cfe66b76289d753ceee6558f70d82af6b8c590265cacb2d4aa11f3b0396fb0",
        ),
        (
            128,
            "fdb50d75cc2ca56537d86f78e871f423691c3822ad1ac9653e84ab9781328f9f",
        ),
        (
            129,
            "7b69204869f4800e543ca75165bbe5b2d5dab3379c9b5f6caacfd36888958834",
        ),
        (
            1000,
            "157bac17a97efb50756d4af6b73d2c6e41fee6c4012fa21a6c638eb2febae3cb",
        ),
        (
            4096,
            "12f51875c1545afac5b3bd4b3fd5131a9ed9f50ff248b84b01986d0934716f68",
        ),
    ];
    for (length, expected) in vectors {
        let data: Vec<u8> = (0..length).map(|i| ((i * 31 + 17) % 256) as u8).collect();
        assert_eq!(hex(&sha256(&data)), expected, "length {length}");
        for chunk_size in [1, 7, 32, 63, 64, 65, 111] {
            let mut state = Sha256::new();
            state.update(&[]);
            for chunk in data.chunks(chunk_size) {
                state.update(chunk);
                state.update(&[]);
            }
            assert_eq!(
                hex(&state.finalize()),
                expected,
                "length {length}, chunk {chunk_size}"
            );
        }
    }
}

#[test]
fn million_a_known_vector() {
    assert_eq!(
        hex(&sha256(&vec![b'a'; 1_000_000])),
        "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0"
    );
}
