# AUTARCH Web Platform

This folder is the quarantined legacy Next.js tree. It is outside the sovereign STRAW/Eduba path and is not the STRAW or Eduba build. Eduba (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`) is the append-only SQLite archival ledger via sqlx, not a school. The sovereign desktop is Trunk, Tauri 2, and pure Rust, with Axum on `127.0.0.1`. From `straw-app/`, use `trunk build`, `cargo tauri build`, and `cargo test --workspace --offline --locked`. Node and npm steps below run only this legacy tree.

Next.js 15 in `apps/web` is paired with the local Rust/Axum service in `apps/api`. The browser uses same-origin `/api`. Next proxies to `127.0.0.1` on port 3001. SQLite is that legacy API's database, not the Eduba ledger. Express, PostgreSQL, Redis, and Docker are not part of this tree.

## 🚀 Quick Start

### Prerequisites for this legacy tree
- Node.js 18+ for this Next.js tree only
- Rust with the workspace's offline Cargo cache, for `apps/api`

### Installation

From this folder (`apps/web`):

```bash
npm install
copy .env.example .env.local
npm run dev
```

On a machine that already has `node_modules` matching the lockfile, `npm install --offline` is enough. The dev server listens on `http://localhost:3000`.

In another terminal, from `apps/api`:

```bash
cargo run --offline --locked
```

That process binds `127.0.0.1:3001`. Set `STRAW_API_PORT` and `STRAW_WEB_ORIGIN` on both processes when you change the defaults. See `apps/api/README.md`.

## Session and backend ownership

| Concern | Owner | Contract |
| --- | --- | --- |
| Session credential | `apps/api` (Rust/Axum + SQLite) | HttpOnly cookie `straw_session`; hashed opaque token; expiry and revocation checked on every authenticated request |
| Browser auth state | `apps/web/context` + `apps/web/services` | Cookie-only; no localStorage tokens; hydrate via `GET /api/auth/me` |
| Same-origin API | `apps/web/app/api/**` + `apps/web/lib/backend-proxy.ts` | Next Node handlers proxy to `127.0.0.1:$STRAW_API_PORT` |
| Navigation hint only | `apps/web/middleware.ts` | Redirects unauthenticated browsers away from `/dashboard`, `/settings`, `/profile`, `/projects`; does **not** authorize APIs |
| Public auth routes | `/login`, `/signup`, `/api/auth/*` | Login/register/logout/refresh/me authorize in Rust; recovery endpoints return HTTP 501 |

Exercise login, refresh, logout, expired/forged cookies, protected pages, and protected/public API requests against `apps/api` (`cargo test --offline --locked --test auth_http`). Full Next/browser observation remains with page/provider owners (F007/F013/F019).

## 🏗️ Project Structure

```
apps/web/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Home page
│   ├── globals.css      # Global styles
│   ├── login/
│   ├── signup/
│   ├── dashboard/
│   ├── docs/
│   └── features/
├── components/          # React components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Features.tsx
├── context/            # React contexts
│   └── AuthContext.tsx
├── lib/                # Utility libraries
│   ├── utils.ts        # Helper functions
│   └── api-client.ts   # API client
├── types/              # TypeScript types
│   └── index.ts
├── public/             # Static assets
└── styles/             # Additional styles
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS
- **ShadCN UI** - Beautiful components
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **TanStack Query** - Data fetching

### Local API
- **Rust / Axum** — `apps/api`, loopback only
- **SQLite** — local database file
- **HttpOnly cookie** — `straw_session`; no browser token storage

Email delivery, file upload, and avatar storage are explicit HTTP 501 responses. They are not configured transports.

## 📋 Features

**Authentication.** Registration and login are implemented in `apps/api` with an HttpOnly session cookie. Email verification and password reset return HTTP 501. Role checks exist for administrator routes; public registration cannot create an administrator.

**Data.** Users, sessions, and projects persist in the API's SQLite file. Audit logs, file uploads, and soft-delete storage are not a local feature. File and avatar methods return HTTP 501.

**Developer experience.** TypeScript, ESLint (`npm run lint`), and `npm run type-check` are package scripts. Prettier, Husky, and Docker are not configured here.

## 🚦 Scripts

```bash
npm run dev           # Next dev server on port 3000
npm run build         # Production build
npm start             # Start the production server
npm run lint          # ESLint
npm run type-check    # TypeScript check
```

The API is not an npm script. Run it from `apps/api` with `cargo run --offline --locked`. That process is the legacy API on `127.0.0.1:3001`. It is not `trunk build` or `cargo tauri build`.

## 🔧 Configuration

Copy `.env.example` to `.env.local` in this folder. The template sets:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRAW_API_PORT=3001
STRAW_WEB_ORIGIN=http://localhost:3000
NODE_ENV=development
```

`STRAW_API_PORT` and `STRAW_WEB_ORIGIN` are server-only. They must match the `apps/api` process. There is no PostgreSQL, Redis, JWT, or SMTP setting in the local service.

## 📚 Documentation

- [API Documentation](/docs) - Complete API reference
- [Getting Started](/docs#quick-start) - Quick start guide
- [Architecture](/docs#architecture) - System architecture
- [Authentication](/docs#authentication) - Auth implementation

## 🔒 Security

- Passwords hashed with salted Argon2id in `apps/api`
- Session cookie `straw_session` (HttpOnly, SameSite=Strict, Path=/)
- Unsafe requests require the configured local Origin
- Email verification and password reset return HTTP 501 until a local transport exists

## 📈 Performance

- Next.js 15 with App Router
- Server-side rendering where a route uses it
- No Redis cache and no CDN deployment in this tree

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved by Hammurabi Coding Company.

## 👥 Team

Built with ❤️ by Hammurabi Coding Company

## 📞 Support

- Documentation: [View Docs](/docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Email: support@autarch-web.com

---

These pages describe the legacy Next.js tree. Build the desktop and Eduba from `straw-app/`.
