AUTARCH Web Platform - Architecture Overview
=============================================

`apps/web` is the quarantined legacy Next.js tree, outside the sovereign STRAW/Eduba path. It is not the STRAW or Eduba build. Eduba (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`) is the append-only SQLite archival ledger via sqlx, not a school. The sovereign desktop is Trunk, Tauri 2, and pure Rust, with Axum on `127.0.0.1`. From `straw-app/`, use `trunk build`, `cargo tauri build`, and `cargo test --workspace --offline --locked`. Do not use Node, npm, Python, Playwright, Vite, or Webpack to build Eduba or the desktop.

Current boundary, 2026-10-09: the browser talks to Next.js on port 3000. Next proxies `/api` to the Rust/Axum process in `apps/api`, which binds `127.0.0.1:3001` and stores data in SQLite. Session state is the `straw_session` cookie. Express, PostgreSQL, Redis, filesystem upload storage, Docker Compose, and Nginx are not implemented. The diagram below is the earlier sketch, not the running legacy deployment and not the sovereign build. See `apps/README.md` and `apps/api/README.md`.

┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (User)                            │
│                    http://localhost:3000                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 APP ROUTER                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PAGES (app/)                                               │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │  Home    │  │  Login   │  │  Signup  │  │Dashboard │   │ │
│  │  │          │  │          │  │          │  │  (Protected)││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  │  ┌──────────┐  ┌──────────┐                                 │ │
│  │  │  Docs    │  │Features  │                                 │ │
│  │  └──────────┘  └──────────┘                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  COMPONENTS                                                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │  │  Navbar  │  │  Footer  │  │ Features │                 │ │
│  │  └──────────┘  └──────────┘  └──────────┘                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CONTEXT (AuthContext)                                      │ │
│  │  • User State                                               │ │
│  │  • Token Management                                         │ │
│  │  • Auth Methods (login, logout, register)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  UTILITIES                                                  │ │
│  │  ┌──────────┐  ┌──────────┐                                │ │
│  │  │   Utils  │  │API Client │                                │ │
│  │  │          │  │(Axios)   │                                │ │
│  │  └──────────┘  └──────────┘                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND API (Node.js/Express)                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ROUTES                                                     │ │
│  │  /api/auth/login    /api/auth/register  /api/auth/logout   │ │
│  │  /api/users         /api/profile        /api/audit         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MIDDLEWARE                                               │ │
│  │  • Authentication (JWT)                                   │ │
│  │  • Authorization (RBAC)                                   │ │
│  │  • Error Handling                                         │ │
│  │  • Rate Limiting                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  POSTGRESQL      │ │     REDIS        │ │    FILE SYSTEM   │
│  ┌──────────┐    │ │  ┌──────────┐    │ │  ┌──────────┐   │
│  │  Users   │    │ │  │Sessions  │    │ │  │  Files   │   │
│  │ Profiles │    │ │  │Cache     │    │ │  │Storage   │   │
│  │  Audit   │    │ │  │Rate Limit│    │ │  │Metadata  │   │
│  │   Files  │    │ │  └──────────┘    │ │  └──────────┘   │
│  └──────────┘    │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  DOCKER COMPOSE                                             │ │
│  │  • Web Container (Next.js)                                 │ │
│  │  • API Container (Node.js)                                 │ │
│  │  • PostgreSQL Container                                     │ │
│  │  • Redis Container                                          │ │
│  │  • Nginx Reverse Proxy                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CI/CD (GitHub Actions)                                    │ │
│  │  • Automated Testing                                       │ │
│  │  • Build & Deploy                                          │ │
│  │  • Security Scanning                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────────────────
          DATA FLOW (earlier sketch only)
─────────────────────────────────────────────────────────────────

These steps are the earlier sketch. They are not the running legacy API (`127.0.0.1:3001`, `straw_session`, SQLite) and they are not how to build Eduba or the desktop.

1. USER → BROWSER
   • User visits http://localhost:3000
   • Next.js serves static pages (SSG)
   • Dynamic pages loaded on-demand (SSR)

2. BROWSER → NEXT.JS
   • Client-side routing (React Router)
   • State management (React Context/Zustand)
   • Component rendering

3. NEXT.JS → API CLIENT
   • Axios HTTP requests
   • Request interceptors add auth token
   • Response interceptors handle errors

4. API CLIENT → BACKEND
   • RESTful API calls (GET, POST, PUT, DELETE)
   • JWT tokens for authentication
   • JSON request/response

5. BACKEND → DATABASE
   • Drizzle ORM queries
   • Transaction handling
   • Data validation

6. BACKEND → REDIS
   • Session caching
   • Rate limiting data
   • API response caching

7. USER ← BROWSER
   • Form submissions
   • Navigation
   • Real-time updates (future: WebSockets)

─────────────────────────────────────────────────────────────────
           SECURITY LAYERS (earlier sketch only)
─────────────────────────────────────────────────────────────────

Level 1: Frontend
   ✓ Input validation (Zod schemas)
   ✓ XSS protection (Next.js)
   ✓ CSRF tokens ready
   ✓ Secure cookies

Level 2: API Client
   ✓ HTTPS only
   ✓ Auth token injection
   ✓ Error handling
   ✓ Timeout management

Level 3: Backend
   ✓ JWT verification
   ✓ Password hashing (bcrypt)
   ✓ SQL injection prevention
   ✓ Rate limiting
   ✓ CORS configuration

Level 4: Database
   ✓ Parameterized queries
   ✓ Row-level security
   ✓ Audit logging
   ✓ Backup & restore

─────────────────────────────────────────────────────────────────
                       DEPLOYMENT PATH
─────────────────────────────────────────────────────────────────

The lines below are the earlier sketch. They are not commands for this tree, Eduba, or the desktop. Node and Express are not the sovereign build.

Sketch (not running):
  localhost:3000 → Next.js dev server
  localhost:3001 → Express API server
  localhost:5432 → PostgreSQL
  localhost:6379 → Redis
  production sketch → Nginx, a Node.js API, managed PostgreSQL, managed Redis

Running legacy tree: Next on port 3000, Axum on `127.0.0.1:3001`, SQLite, `straw_session`.
Sovereign desktop and Eduba, from `straw-app/`: `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`.

─────────────────────────────────────────────────────────────────
                       MONITORING
─────────────────────────────────────────────────────────────────

Frontend:
  • React DevTools
  • Browser console
  • Performance metrics

Backend:
  • Log files
  • Error tracking (Sentry, etc.)
  • API metrics

Infrastructure:
  • Docker logs
  • System metrics
  • Uptime monitoring

─────────────────────────────────────────────────────────────────
   Legacy Next.js sketch. Not the sovereign STRAW or Eduba build.
─────────────────────────────────────────────────────────────────
