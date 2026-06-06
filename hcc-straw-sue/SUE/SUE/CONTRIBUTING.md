# Contributing to SUE

Thank you for your interest in contributing. This document covers the process for reporting bugs, proposing features, and submitting pull requests.

## Development Setup

```bash
git clone https://github.com/hammurabicoding/sue.git
cd sue
pnpm install
pnpm run package
```

Load `dist/` as an unpacked extension in Chrome to verify your changes.

## Branch Conventions

| Branch | Purpose |
|--------|---------|
| `main` | Stable — deploys to production VPS |
| `feature/name` | New features |
| `fix/name` | Bug fixes |
| `docs/name` | Documentation only |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add deploy button to Venice sidebar
fix: prevent lockout after SSH hardening
docs: update VPS deployment guide
chore: update dependencies
```

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Run `pnpm run validate` — all checks must pass
3. Run `pnpm run test` — all tests must pass
4. Update README if you changed behavior or added a feature
5. Open a PR with a clear description of what and why

## Reporting Bugs

Open a GitHub Issue with:
- SUE version
- Browser and OS
- Steps to reproduce
- Expected vs actual behavior

## Security Vulnerabilities

**Do not open a public issue.** See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

## Code Style

- ESLint + Prettier enforce formatting — run `pnpm run format` before committing
- TypeScript strict mode is enabled
- Rust code must pass `cargo clippy -- -D warnings`

## License

By contributing you agree your changes will be licensed under the project's MIT license.
