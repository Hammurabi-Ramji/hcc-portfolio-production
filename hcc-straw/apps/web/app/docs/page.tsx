import Link from 'next/link'
import { Book, Code, Container, Database, Lock, Server, Shield } from 'lucide-react'
import Navbar from '@/components/Navbar'

type TocItem = { title: string; id: string }
type TocGroup = { title: string; items: TocItem[] }

const toc: TocGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', id: 'introduction' },
      { title: 'Quick Start', id: 'quick-start' },
      { title: 'Installation', id: 'installation' },
      { title: 'Project Structure', id: 'project-structure' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { title: 'Architecture', id: 'architecture' },
      { title: 'Authentication', id: 'authentication' },
      { title: 'Database', id: 'database' },
      { title: 'API Design', id: 'api-design' },
    ],
  },
  {
    title: 'Backend',
    items: [
      { title: 'REST API', id: 'rest-api' },
      { title: 'Local persistence', id: 'local-persistence' },
      { title: 'Caching', id: 'caching' },
      { title: 'File uploads', id: 'file-uploads' },
    ],
  },
  {
    title: 'Frontend',
    items: [
      { title: 'Next.js App Router', id: 'nextjs-app-router' },
      { title: 'Components', id: 'components' },
      { title: 'State management', id: 'state-management' },
      { title: 'Styling', id: 'styling' },
    ],
  },
  {
    title: 'DevOps',
    items: [
      { title: 'Deployment', id: 'deployment' },
      { title: 'Environment variables', id: 'env-vars' },
    ],
  },
  {
    title: 'Security',
    items: [
      { title: 'Session cookie', id: 'session-cookie' },
      { title: 'Role checks', id: 'role-checks' },
      { title: 'Recovery and email', id: 'recovery' },
    ],
  },
]

function DocsToc({ className, label }: { className: string; label: string }) {
  return (
    <nav className={className} aria-label={label}>
      {toc.map((group) => (
        <div key={group.title} className="docs-toc-group">
          <p className="docs-toc-heading">{group.title}</p>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.title}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function DocsPage() {
  return (
    <div className="docs-shell min-h-screen bg-background">
      <style>{`
        .docs-shell { color: #171717; background: #fff; }
        .docs-main { max-width: 52rem; margin: 0 auto; padding: 1.5rem; }
        .docs-main > section { margin-bottom: 2.5rem; scroll-margin-top: 1.25rem; }
        .docs-main h1 { font-size: 1.875rem; line-height: 1.2; margin: 0 0 0.75rem; }
        .docs-main h2 { font-size: 1.4rem; line-height: 1.3; margin: 0 0 0.75rem; }
        .docs-main h3 { font-size: 1rem; margin: 1rem 0 0.5rem; }
        .docs-main p, .docs-main li { line-height: 1.5; }
        .docs-main ul, .docs-main ol { margin: 0.5rem 0 0; padding-left: 1.25rem; }
        .docs-panel, .docs-card {
          border: 1px solid #d4d4d4;
          border-radius: 0.5rem;
          padding: 1rem 1.25rem;
          background: #fafafa;
        }
        .docs-pre {
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.8rem;
          white-space: pre-wrap;
          background: #fff;
          border-radius: 0.375rem;
          padding: 0.75rem;
        }
        .docs-toc-heading { font-weight: 650; margin: 0 0 0.35rem; }
        .docs-toc-group { margin-bottom: 1rem; }
        .docs-toc-group ul { list-style: none; margin: 0; padding: 0; }
        .docs-toc-group a { display: inline-block; margin: 0.2rem 0; }
        .docs-cards { display: grid; gap: 1rem; }
        .docs-card { display: block; color: inherit; text-decoration: none; }
        .docs-card h3 { margin-top: 0; }
        .docs-desktop-toc { display: none; }
        .docs-mobile-toc { display: block; margin: 0 1.5rem; }
        @media (min-width: 1024px) {
          .docs-frame { display: flex; }
          .docs-desktop-toc {
            display: block;
            width: 16rem;
            flex: none;
            padding: 1.5rem;
          }
          .docs-mobile-toc { display: none; }
        }
        @media (min-width: 768px) {
          .docs-cards { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      <Navbar user={null} />

      <div className="docs-frame lg:pl-64">
        <DocsToc className="docs-mobile-toc lg:hidden" label="Documentation sections" />
        <aside className="docs-desktop-toc hidden lg:block">
          <DocsToc className="" label="Documentation sections" />
        </aside>

        <main className="docs-main">
          <section id="table-of-contents">
            <h1>Documentation</h1>
            <p>
              Local guide for the Next.js application in <code>apps/web</code>. It describes this
              checkout. Express, PostgreSQL, Redis, Docker Compose, Nginx, and a Turborepo layout
              are not part of the tree.
            </p>
          </section>

          <section id="introduction">
            <h2>
              <Book aria-hidden="true" size={22} /> Introduction
            </h2>
            <div className="docs-panel">
              <p>
                AUTARCH web is the Next.js 15 App Router application in <code>apps/web</code>,
                with TypeScript and Tailwind CSS source. Its local API is the separate Rust/Axum
                service in <code>apps/api</code>. That service stores accounts in SQLite. The
                desktop workspace under <code>straw-app</code> is not started by the commands on
                this page.
              </p>
              <h3>What is in this checkout</h3>
              <ul>
                <li>Frontend: Next.js 15, TypeScript, Tailwind CSS.</li>
                <li>API: Rust, Axum, rusqlite, loopback <code>127.0.0.1:3001</code>.</li>
                <li>Session: HttpOnly cookie <code>straw_session</code>. The browser client calls same-origin <code>/api</code>.</li>
              </ul>
            </div>
          </section>

          <section id="quick-start">
            <h2>Quick Start</h2>
            <div className="docs-panel">
              <p>From the repository root, start the site:</p>
              <pre className="docs-pre">{`cd apps/web
npm install
copy .env.example .env.local
npm run dev`}</pre>
              <p>
                <code>copy</code> is the Windows command. The dev server listens on{' '}
                <code>http://localhost:3000</code>. When <code>node_modules</code> already matches
                the lockfile, <code>npm install --offline</code> is enough.
              </p>
              <p>In a second terminal, start the API:</p>
              <pre className="docs-pre">{`cd apps/api
cargo run --offline --locked`}</pre>
              <p>
                That process binds <code>127.0.0.1:3001</code>. Open{' '}
                <Link href="/docs">/docs</Link>, <Link href="/">/</Link>,{' '}
                <Link href="/login">/login</Link>, and <Link href="/features">/features</Link>.
              </p>
            </div>
          </section>

          <section id="installation">
            <h2>Installation</h2>
            <div className="docs-panel">
              <p>Advertised prerequisites for the commands above:</p>
              <ul>
                <li>Node.js 18 or newer, with npm.</li>
                <li>
                  Rust and Cargo on the terminal PATH, with this workspace&apos;s offline Cargo cache, for{' '}
                  <code>apps/api</code>. The executable may be installed under the user Cargo directory
                  without being on PATH. Run <code>cargo --version</code> in the same terminal before the
                  API command, and add that bin directory to PATH when the command is not found.
                </li>
                <li><code>apps/web/package.json</code> and <code>apps/web/.env.example</code>.</li>
                <li><code>apps/api/Cargo.toml</code> and <code>apps/api/Cargo.lock</code>.</li>
              </ul>
              <p>
                Package scripts in <code>apps/web</code> are <code>dev</code>, <code>build</code>,{' '}
                <code>start</code>, <code>lint</code>, and <code>type-check</code>. The API is not
                an npm script.
              </p>
            </div>
          </section>

          <section id="project-structure">
            <h2>Project Structure</h2>
            <div className="docs-panel">
              <pre className="docs-pre">{`apps/
├── web/                 # Next.js site, run commands here
│   ├── app/             # App Router pages, including this docs route
│   ├── components/      # Navbar, Footer, Features, ProtectedRoute
│   ├── context/         # AuthContext
│   ├── lib/             # api-client.ts, backend-proxy.ts
│   ├── .env.example
│   └── package.json
└── api/                 # Rust/Axum service and SQLite file
    ├── src/
    ├── Cargo.toml
    └── Cargo.lock`}</pre>
              <p>There is no root <code>package.json</code>, <code>packages/</code> workspace, or <code>docker-compose</code> file.</p>
            </div>
          </section>

          <section id="architecture">
            <h2>
              <Shield aria-hidden="true" size={22} /> Architecture
            </h2>
            <div className="docs-panel">
              <p>
                The browser talks to Next.js on port 3000. Route handlers proxy <code>/api</code> to
                the Rust process on <code>127.0.0.1</code> and <code>STRAW_API_PORT</code> (default
                3001). Session state is the <code>straw_session</code> cookie. Unsafe API requests
                must send the configured local <code>Origin</code>.
              </p>
              <p>
                <code>apps/web/lib/api-client.ts</code> uses base URL <code>/api</code>. It does not
                read a public API host. Server-only <code>STRAW_API_PORT</code> and{' '}
                <code>STRAW_WEB_ORIGIN</code> must match the <code>apps/api</code> process.
              </p>
            </div>
          </section>

          <section id="authentication">
            <h2>
              <Lock aria-hidden="true" size={22} /> Authentication
            </h2>
            <div className="docs-panel">
              <p>Capabilities below are labeled as implemented service behavior or as an unsupported contract.</p>
              <h3>Implemented in apps/api</h3>
              <ul>
                <li>POST <code>/api/auth/register</code> and POST <code>/api/auth/login</code> create an HttpOnly session cookie.</li>
                <li>GET <code>/api/auth/me</code>, POST <code>/api/auth/refresh-token</code>, and POST <code>/api/auth/logout</code> use that cookie.</li>
                <li>Passwords are salted Argon2id hashes. Public registration creates a non-admin user with <code>emailVerified: false</code>.</li>
                <li>Expired, revoked, and forged sessions are rejected by the API. Logout revokes the server session.</li>
              </ul>
              <p>
                Those routes are implemented in <code>apps/api</code>. The Rust HTTP suite is the
                recorded acceptance for register, login, me, refresh, logout, restart, and
                expired or forged cookies. Loading this page, or the login page, is not that check.
                Next.js reload and logout through the auth provider are still a separate integration.
              </p>
              <h3>Unsupported contract</h3>
              <ul>
                <li>GET and POST <code>/api/auth/verify-email</code>, POST <code>/api/auth/forgot-password</code>, and POST <code>/api/auth/reset-password</code> return HTTP 501. No local mail transport is implemented.</li>
              </ul>
            </div>
          </section>

          <section id="database">
            <h2>
              <Database aria-hidden="true" size={22} /> Database
            </h2>
            <div className="docs-panel">
              <p>
                The API uses rusqlite. The default file is <code>straw-web.sqlite3</code> in the
                API process working directory. <code>STRAW_API_DATABASE</code> selects another path.
                The file holds password hashes and session credential hashes. There is no PostgreSQL
                server and no Redis cache.
              </p>
            </div>
          </section>

          <section id="api-design">
            <h2>
              <Code aria-hidden="true" size={22} /> API Design
            </h2>
            <div className="docs-panel">
              <p>
                JSON responses use one envelope: <code>{'{ success: true, data }'}</code> or{' '}
                <code>{'{ success: false, error: { code, message, status } }'}</code>. Auth request
                bodies are limited to 16 KiB. Unknown or malformed auth fields return HTTP 400.
                Identifiers and timestamps are strings.
              </p>
              <p>
                The current Rust router registers auth and users only. Project HTTP routes are not
                mounted. Same-origin Next handlers proxy the routes listed under REST API.
              </p>
            </div>
          </section>

          <section id="rest-api">
            <h2>
              <Server aria-hidden="true" size={22} /> REST API
            </h2>
            <div className="docs-panel">
              <ul>
                <li>POST <code>/api/auth/register</code>, <code>/login</code>, <code>/logout</code>, <code>/refresh-token</code></li>
                <li>GET <code>/api/auth/me</code></li>
                <li>GET and POST <code>/api/auth/verify-email</code>, POST <code>/forgot-password</code>, POST <code>/reset-password</code> — HTTP 501</li>
                <li>GET and POST <code>/api/users</code> — administrator session required</li>
                <li>GET <code>/api/users/:id</code> — that user or an administrator</li>
                <li>GET and PUT <code>/api/users/profile</code> — current session; fields are first name, last name, bio, website, location, and an avatar reference</li>
                <li>POST <code>/api/users/avatar</code> — authenticated HTTP 501, no stored file</li>
              </ul>
              <p>An administrator account is created with the API CLI <code>bootstrap-admin</code>, not by a public registration field. See <code>apps/api/README.md</code>.</p>
            </div>
          </section>

          <section id="local-persistence">
            <h2>Local persistence</h2>
            <div className="docs-panel">
              <p>
                Users, profiles, and sessions are rows in the SQLite file. Restarting the API
                process keeps that file. There is no separate ORM service, and there is no
                PostgreSQL schema in this checkout.
              </p>
            </div>
          </section>

          <section id="caching">
            <h2>Caching</h2>
            <div className="docs-panel">
              <p>Redis is not implemented. API responses send <code>Cache-Control: no-store</code>. Do not add a Redis URL to the web env file; the template does not have one.</p>
            </div>
          </section>

          <section id="file-uploads">
            <h2>File uploads</h2>
            <div className="docs-panel">
              <p>
                Avatar and other file storage are unsupported. POST <code>/api/users/avatar</code>{' '}
                returns HTTP 501 after a valid session and does not write a file. Profile{' '}
                <code>avatar</code> values are HTTP(S) references stored as text; the API does not
                fetch them.
              </p>
            </div>
          </section>

          <section id="nextjs-app-router">
            <h2>Next.js App Router</h2>
            <div className="docs-panel">
              <p>
                Pages live in <code>apps/web/app</code>. This route is <code>app/docs/page.tsx</code>.
                API handlers live in <code>app/api</code> and proxy to the Rust service. Run the
                site only after <code>cd apps/web</code>.
              </p>
            </div>
          </section>

          <section id="components">
            <h2>Components</h2>
            <div className="docs-panel">
              <p>Checked-in components are <code>Navbar</code>, <code>Footer</code>, <code>Features</code>, and <code>ProtectedRoute</code>. This page renders the anonymous navbar. The feature overview is the <Link href="/features">/features</Link> route.</p>
            </div>
          </section>

          <section id="state-management">
            <h2>State management</h2>
            <div className="docs-panel">
              <p>
                <code>apps/web/context/AuthContext.tsx</code> is the session client. The root layout
                does not mount that provider yet, so this page does not read a signed-in user.
                Treat page-level login, reload, and logout as unfinished until that integration is
                exercised.
              </p>
            </div>
          </section>

          <section id="styling">
            <h2>Styling</h2>
            <div className="docs-panel">
              <p>
                Tailwind source is <code>apps/web/app/globals.css</code> and{' '}
                <code>tailwind.config.js</code>. The root layout does not import the stylesheet yet,
                so utility colors on other routes are not evidence of a finished theme. Readable
                text on this page comes from the local stylesheet in this file.
              </p>
            </div>
          </section>

          <section id="deployment">
            <h2>
              <Container aria-hidden="true" size={22} /> Deployment
            </h2>
            <div className="docs-panel">
              <p>
                No Docker Compose file, Nginx config, or CI workflow is checked in. Do not run{' '}
                <code>docker-compose up</code> for this application. Production hosting, TLS, and
                GitHub Actions are undeclared until those manifests exist. Local production mode,
                after a successful build, is <code>npm run build</code> and <code>npm start</code>{' '}
                from <code>apps/web</code>, with the API still running separately.
              </p>
            </div>
          </section>

          <section id="env-vars">
            <h2>Environment variables</h2>
            <div className="docs-panel">
              <p>
                Copy <code>apps/web/.env.example</code> to <code>apps/web/.env.local</code>. The
                template sets:
              </p>
              <pre className="docs-pre">{`NEXT_PUBLIC_APP_URL=http://localhost:3000
STRAW_API_PORT=3001
STRAW_WEB_ORIGIN=http://localhost:3000
NODE_ENV=development`}</pre>
              <p>
                <code>STRAW_API_PORT</code> and <code>STRAW_WEB_ORIGIN</code> are server-only and
                must match <code>apps/api</code>. The API also accepts <code>STRAW_API_DATABASE</code>.
                There is no PostgreSQL, Redis, JWT, or SMTP variable.
              </p>
            </div>
          </section>

          <section id="session-cookie">
            <h2>Session cookie</h2>
            <div className="docs-panel">
              <p>
                The session cookie is <code>straw_session</code> (HttpOnly, SameSite=Strict, Path=/).
                Ordinary sessions expire on the server after 8 hours. A remember-me login sets a
                bounded 30-day cookie. The browser client does not store the credential in local
                storage. This is not a JWT-in-the-browser design.
              </p>
            </div>
          </section>

          <section id="role-checks">
            <h2>Role checks</h2>
            <div className="docs-panel">
              <p>
                Listing and creating users requires an administrator session. Reading another
                user requires that user&apos;s own session or an administrator. Public registration
                cannot set the administrator role. Audit logging is not implemented.
              </p>
            </div>
          </section>

          <section id="recovery">
            <h2>Recovery and email</h2>
            <div className="docs-panel">
              <p>
                Email verification and password reset are an explicit unsupported contract. Those
                routes return HTTP 501 and do not send mail, create recovery tokens, or reveal
                whether an account exists beyond that status.
              </p>
            </div>
          </section>

          <section id="learn-more" aria-label="Related sections">
            <h2>Learn more</h2>
            <div className="docs-cards">
              <a className="docs-card" href="#rest-api">
                <h3>API reference</h3>
                <p>Routes implemented by the local Rust service, including HTTP 501 contracts.</p>
              </a>
              <a className="docs-card" href="#env-vars">
                <h3>Environment variables</h3>
                <p>The variables in <code>apps/web/.env.example</code> and the matching API process.</p>
              </a>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
