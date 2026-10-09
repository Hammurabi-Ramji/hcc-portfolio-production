"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar user={null} />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">About AUTARCH</h1>

            <div className="space-y-8">
              {/* Mission */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  AUTARCH is building the future of web development with production-ready
                  platforms that enable developers to create scalable, maintainable,
                  and secure applications without reinventing the wheel.
                </p>
              </section>

              {/* Technology */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Technology Stack</h2>
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
                    <h3 className="font-medium mb-2">Backend</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Node.js & Express</li>
                      <li>• PostgreSQL</li>
                      <li>• Redis</li>
                      <li>• JWT Authentication</li>
                      <li>• RESTful APIs</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">DevOps</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Docker & Docker Compose</li>
                      <li>• Nginx</li>
                      <li>• GitHub Actions</li>
                      <li>• CI/CD Pipelines</li>
                      <li>• Environment Management</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Security</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• bcrypt Password Hashing</li>
                      <li>• JWT Token Management</li>
                      <li>• Role-Based Access Control</li>
                      <li>• CORS & CSRF Protection</li>
                      <li>• Audit Logging</li>
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
                      Production-ready code with comprehensive testing and documentation
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <h3 className="font-medium mb-2">Security</h3>
                    <p className="text-sm text-muted-foreground">
                      Built-in security best practices and data protection
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <h3 className="font-medium mb-2">Scalability</h3>
                    <p className="text-sm text-muted-foreground">
                      Architecture designed to grow with your application
                    </p>
                  </div>
                </div>
              </section>

              {/* Team */}
              <section className="bg-card p-8 rounded-xl border border-border">
                <h2 className="text-2xl font-semibold mb-4">Built by Hammurabi Coding Company</h2>
                <p className="text-muted-foreground">
                  We're a team of passionate developers and engineers dedicated to creating
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
