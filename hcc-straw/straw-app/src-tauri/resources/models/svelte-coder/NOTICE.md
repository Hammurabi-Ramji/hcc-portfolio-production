# SvelteCoder bundle

Model: [rockypod/svelte-coder-4b](https://huggingface.co/rockypod/svelte-coder-4b), publisher revision `7d1d35d80bcd1fdf1052d970e72bb58b9cb9db1f`.

Weights: `svelte-coder-v0.9.0-4b-q4_k_m.gguf`, 2,497,280,352 bytes. SHA-256 matches the publisher's LFS record: `7db979fc2fa403a4ccfc9046b1b5442f0e3ccdffc84cc123cbdd03c469df4966`.

The adjacent tokenizer came from the existing HCC local pack. Its SHA-256 is pinned in `manifest.json`; the worker verifies every vocabulary ID against the GGUF before constructing the model. No network tokenizer lookup occurs at runtime.

The publisher supplies MIT licensing for the fine-tune and Apache-2.0 licensing for the Qwen3 base. Both supplied license files accompany this pack. The pack is verified and loaded only on operator request. CPU activation dtype is F32; weights retain GGUF quantization. Context is capped at 8192 tokens, output at 1500 tokens, with bounded generation and host deadlines.

Large weights and the tokenizer are excluded from Git. Restore them using `scripts/stage-model-pack.ps1`; it accepts only the pinned hashes.
