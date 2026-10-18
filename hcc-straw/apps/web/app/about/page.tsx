"use client";

import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const { user } = useAuth();
  const navbarUser = user
    ? { name: user.username || user.email || 'User', avatar: user.profile?.avatarUrl }
    : null;

  return (
    <div className="min-h-screen">
      <Navbar user={navbarUser} />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">About AUTARCH</h1>

            <div className="space-y-8">
              {/* Mission */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AUTARCH is a legacy Next.js web tree paired with a loopback Rust API,
                  giving developers a typed frontend and session-aware pages they can
                  extend without claiming a production-hosted platform.
                </p>
              </section>

              {/* Technology */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Capabilities below match what this quarantined tree implements today.
                  PostgreSQL, Redis, Express, Docker Compose, and Nginx are not part of
                  this tree.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Frontend</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Next.js 15 (App Router)</li>
                      <li>• TypeScript 5.x</li>
                      <li>• TailwindCSS</li>
                      <li>• React 19</li>
                      <li>• React Hook Form</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Local API</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Rust & Axum on 127.0.0.1:3001</li>
                      <li>• SQLite (local file)</li>
                      <li>• straw_session cookie auth</li>
                      <li>• Argon2id password hashing</li>
                      <li>• Next.js /api proxy to the API</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Local tooling</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• npm scripts (dev, build, type-check)</li>
                      <li>• cargo run --offline --locked</li>
                      <li>• Environment via .env.local</li>
                      <li>• Loopback-only web origin CORS</li>
                      <li>• No production host configured</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Security (implemented)</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Argon2id password hashing</li>
                      <li>• Session cookie management</li>
                      <li>• Role checks (user / moderator / admin)</li>
                      <li>• Exact-origin CORS on the API proxy</li>
                      <li>• Owner-scoped project authorization</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Values */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <h3 className="font-medium mb-2">Quality</h3>
                    <p className="text-sm text-muted-foreground">
                      Typed frontend and documented local setup; not a certified
                      production test suite
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <h3 className="font-medium mb-2">Security</h3>
                    <p className="text-sm text-muted-foreground">
                      Session cookies, Argon2id hashing, and role/owner checks on the
                      loopback API
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <h3 className="font-medium mb-2">Scalability</h3>
                    <p className="text-sm text-muted-foreground">
                      App Router pages and a proxied API shaped for further integration
                    </p>
                  </div>
                </div>
              </section>

              {/* Team */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Built by Hammurabi Coding Company</h2>
                <p className="text-muted-foreground">
                  We&apos;re a team of passionate developers and engineers dedicated to creating
                  tools that empower developers to build better applications faster.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
