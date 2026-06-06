# SUE — Sovereign Unified Extension

> A Manifest V3 browser extension delivering a sovereign AI workspace — local-first, privacy-respecting, and always at your fingertips.

[![Version](https://img.shields.io/badge/version-5.0.0-blue.svg)](https://github.com/hammurabicoding/sue/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Firefox](https://img.shields.io/badge/Firefox-Compatible-orange.svg)](https://addons.mozilla.org)
[![Rust](https://img.shields.io/badge/Rust%2FWASM-powered-red.svg)](https://www.rust-lang.org)

---

## What Is SUE?

SUE (Sovereign Unified Extension) is a browser extension that puts a full AI workspace into a side panel on any page you visit. It connects to local AI models (Ollama), cloud AI APIs (Venice, HuggingFace), and your own self-hosted backend — with no telemetry, no vendor lock-in, and no subscription required.

**Core principle**: your data lives where you choose. SUE defaults to local-first.

---

## Features

| Feature | Description |
|---------|-------------|
| **AI Side Panel** | Persistent sidebar available on every tab — chat, research, and tools without switching tabs |
| **Multi-AI Support** | Venice AI, Ollama (local), HuggingFace, and extensible to any API |
| **Swarm Agents** | Multi-agent orchestration: Backend, Frontend, QA, Security, Styling, Data agents |
| **Notes & Projects** | Local-first notes and project management built into the sidebar |
| **Memory System** | Captures page context and builds a persistent memory store |
| **WASM Core** | Rust/WebAssembly runtime (`sue-view`) for high-performance processing |
| **Native Host** | Native messaging bridge for system-level integrations |
| **Offline Support** | Full offline mode with service worker caching |
| **Deploy to Ziggurat** | One-click deploy to self-hosted VPS (Zap Hosting) from any page |
| **Cross-Browser** | Chrome, Firefox, Safari (Chromium, Gecko, WebKit) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension (MV3)                   │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ background  │  │  content.js  │  │    sue.html        │   │
│  │ service     │  │  (injected   │  │  (side panel UI)   │   │
│  │ worker      │  │  every page) │  │                    │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘   │
│         │                │                   │               │
│         └────────────────┴───────────────────┘               │
│                     Message Bus                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              sue-view (Rust → WASM)                 │     │
│  │         High-performance rendering core             │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────┐   ┌─────────────────────────────────┐   │
│  │  src/swarm/     │   │  native-host/                   │   │
│  │  Multi-agent    │   │  Native messaging bridge        │   │
│  │  orchestration  │   │  (system integrations)          │   │
│  └─────────────────┘   └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────────┐
│  Local AI       │       │  Self-Hosted Backend │
│  Ollama :11434  │       │  hcc.hammurabicoding │
│  (optional)     │       │  .com (Ziggurat VPS) │
└─────────────────┘       └─────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Rust + wasm-pack (`cargo install wasm-pack`)

### Development Build

```bash
git clone https://github.com/hammurabicoding/sue.git
cd sue

pnpm install
pnpm run package        # builds WASM + bundles extension → dist/
```

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Load in Firefox

```bash
pnpm run dev:ext        # launches Firefox with extension loaded
```

---

## Development Commands

```bash
pnpm run dev            # watch mode — rebuilds on change
pnpm run package        # full build: WASM + webpack bundle
pnpm run validate       # lint + format check + typecheck
pnpm run test           # unit tests + Playwright e2e tests
pnpm run test:ui        # Playwright with interactive UI
pnpm run build:browsers # build for Chrome, Firefox, Safari
pnpm run clean          # wipe dist/ and WASM artifacts
```

### Build Status

| Check | Command | Status |
|-------|---------|--------|
| WASM build | `pnpm build:wasm` | ✅ |
| TypeScript | `pnpm typecheck` | ✅ |
| ESLint | `pnpm lint` | ✅ |
| Unit tests | `pnpm test:unit` | ✅ 4/4 |
| E2E tests | `pnpm test:e2e` | ✅ 18/18 |
| WASM clippy | `pnpm check:wasm` | ✅ |

---

## Project Structure

```
sue/
├── src/
│   └── swarm/                  # Multi-agent AI orchestration
│       ├── agents/             # Specialized agents (Backend, QA, Security…)
│       ├── orchestrator/       # Director, Router, ConflictResolver
│       ├── codebase/           # CodeIndex, DiffEngine, VersionManager
│       └── execution/          # CodeRunner
├── sue-view/                   # Rust/WASM rendering core (Leptos)
├── sue-core/                   # Rust core library
├── native-host/                # Native messaging host (Node.js)
├── installer/                  # Windows installer builder
├── types/                      # TypeScript type definitions
├── tests/                      # Unit + Playwright e2e tests
├── icons/                      # Extension icons (16/48/128px)
├── docs/                       # Additional documentation
├── background.js               # Service worker (MV3)
├── content.js                  # Content script (injected on all pages)
├── sue.html                    # Side panel HTML entry
├── manifest.json               # Extension manifest
├── manifest.chrome.json        # Chrome-specific manifest
├── manifest.firefox.json       # Firefox-specific manifest
├── manifest.safari.json        # Safari-specific manifest
├── webpack.config.js           # Bundle config
├── setup-zap-vps.sh            # Automated VPS deploy script
└── zap-hosting-config.json     # Zap Hosting infrastructure config
```

---

## Self-Hosted Deployment (Ziggurat VPS)

SUE is designed to pair with a self-hosted backend. The included `setup-zap-vps.sh` script automates full server setup on a Zap Hosting VPS (Ubuntu 22.04).

### What it installs

- Node.js 20, pnpm
- MySQL + Redis
- Nginx (reverse proxy)
- SSL via Let's Encrypt (Certbot)
- UFW firewall (ports 22/80/443)
- Fail2ban intrusion prevention
- Systemd service with auto-restart
- Daily automated backups
- Log rotation

### Deploy

```bash
# 1. SSH into your VPS
ssh root@5.249.163.79

# 2. Run setup (one command installs everything)
bash <(curl -s https://raw.githubusercontent.com/hammurabicoding/sue/main/setup-zap-vps.sh)

# 3. Get SSL certificate
sudo certbot --nginx -d hcc.hammurabicoding.com

# 4. Enable and start service
sudo systemctl enable hcc-api
sudo systemctl start hcc-api
```

### VPS Infrastructure

| Component | Detail |
|-----------|--------|
| Provider | Zap Hosting (lifetime VPS) |
| Location | Ashburn, USA (East) |
| OS | Ubuntu 22.04 LTS |
| RAM | 8 GB |
| CPU | 4 Cores |
| Storage | 100 GB NVMe |
| Domain | hcc.hammurabicoding.com |

---

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

See [`.env.example`](.env.example) for all available options.

---

## AI Integrations

| Provider | Type | Config |
|----------|------|--------|
| Venice AI | Cloud (private) | `VENICE_API_KEY` in `.env` |
| Ollama | Local | Auto-detected at `localhost:11434` |
| HuggingFace | Cloud | `HF_TOKEN` in `.env` |
| Local API | Self-hosted | `localhost:8080` (runs via `pnpm api`) |

---

## Browser Support

| Browser | Manifest | Status |
|---------|----------|--------|
| Chrome 120+ | MV3 | ✅ Full support |
| Edge 120+ | MV3 | ✅ Full support |
| Firefox 121+ | MV3 (Gecko) | ✅ Full support |
| Safari 17+ | MV3 (WebKit) | ✅ Full support |

---

## Security

- **No telemetry** — zero data collection by default
- **Local-first** — all notes, memory, and projects stored in browser storage
- **Key-based SSH** — VPS access via SSH keys only, password auth disabled
- **Security headers** — X-Frame-Options, X-Content-Type-Options, XSS protection via Nginx
- **Fail2ban** — automated brute-force protection on VPS
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. PRs welcome.

---

## License

MIT © [R.K. Girdhari / Hammurabi Coding Company](https://hammurabicoding.com)

Built with the [AI-Highway for Coding (AHFC)](https://github.com/hammurabi-dev/ai-highway-for-coding) framework.
