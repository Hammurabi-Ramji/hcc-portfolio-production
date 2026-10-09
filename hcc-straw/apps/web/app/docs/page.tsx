"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Book, Code, Database, Server, Container, Lock, Shield, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';

const documentation = [
  {
    title: 'Getting Started',
    icon: Book,
    items: [
      { title: 'Introduction', href: '#introduction' },
      { title: 'Quick Start', href: '#quick-start' },
      { title: 'Installation', href: '#installation' },
      { title: 'Project Structure', href: '#project-structure' },
    ],
  },
  {
    title: 'Core Concepts',
    icon: Code,
    items: [
      { title: 'Architecture', href: '#architecture' },
      { title: 'Authentication', href: '#authentication' },
      { title: 'Database Schema', href: '#database-schema' },
      { title: 'API Design', href: '#api-design' },
    ],
  },
  {
    title: 'Backend',
    icon: Server,
    items: [
      { title: 'REST API', href: '#rest-api' },
      { title: 'Database ORM', href: '#database-orm' },
      { title: 'Caching with Redis', href: '#caching' },
      { title: 'File Uploads', href: '#file-uploads' },
    ],
  },
  {
    title: 'Frontend',
    icon: Code,
    items: [
      { title: 'Next.js 15 App Router', href: '#nextjs-app-router' },
      { title: 'Components', href: '#components' },
      { title: 'State Management', href: '#state-management' },
      { title: 'Styling with Tailwind', href: '#styling' },
    ],
  },
  {
    title: 'DevOps',
    icon: Container,
    items: [
      { title: 'Docker Setup', href: '#docker' },
      { title: 'CI/CD Pipeline', href: '#cicd' },
      { title: 'Deployment', href: '#deployment' },
      { title: 'Environment Variables', href: '#env-vars' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { title: 'JWT Authentication', href: '#jwt-auth' },
      { title: 'Role-Based Access', href: '#rbac' },
      { title: 'Audit Logging', href: '#audit-logging' },
      { title: 'Best Practices', href: '#security-best-practices' },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('#introduction');

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />

      <div className="pt-20 lg:pl-64">
        {/* Mobile TOC Toggle */}
        <div className="lg:hidden p-4 border-b border-border">
          <Link
            href="#table-of-contents"
            className="text-primary hover:underline flex items-center"
          >
            <ChevronRight className="w-4 h-4 mr-1" />
            Table of Contents
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 overflow-y-auto p-6 border-r border-border bg-card">
            <nav className="space-y-6">
              {documentation.map((section) => (
                <div key={section.title}>
                  <h3 className="font-semibold text-sm mb-3 flex items-center">
                    <section.icon className="w-4 h-4 mr-2" />
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto">
            {/* Header */}
            <section id="table-of-contents" className="mb-12">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                Documentation
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Build production-ready web applications with AUTARCH platform.
              </p>
              <div className="bg-secondary rounded-lg p-4">
                <h3 className="font-semibold mb-2">Quick Links</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <a href="#introduction" className="text-primary hover:underline">
                      📖 Introduction
                    </a>
                  </li>
                  <li>
                    <a href="#architecture" className="text-primary hover:underline">
                      🏗️ Architecture
                    </a>
                  </li>
                  <li>
                    <a href="#authentication" className="text-primary hover:underline">
                      🔐 Authentication
                    </a>
                  </li>
                  <li>
                    <a href="#docker" className="text-primary hover:underline">
                      🐳 Docker Setup
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* Introduction */}
            <section id="introduction" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Book className="w-6 h-6 mr-3 text-primary" />
                Introduction
              </h2>
              <div className="bg-secondary rounded-lg p-6">
                <p className="text-muted-foreground mb-4">
                  AUTARCH-WEB is a comprehensive full-stack platform built with modern technologies
                  and best practices. It provides everything you need to build scalable, maintainable
                  web applications with type safety, security, and performance at its core.
                </p>
                <h3 className="font-semibold mb-2">Tech Stack</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-primary" />
                    <strong>Frontend:</strong> Next.js 15, TypeScript, TailwindCSS, ShadCN UI
                  </li>
                  <li className="flex items-center">
                    <Code className="w-4 h-4 mr-2 text-primary" />
                    <strong>Backend:</strong> Node.js, Express, TypeScript
                  </li>
                  <li className="flex items-center">
                    <Database className="w-4 h-4 mr-2 text-primary" />
                    <strong>Database:</strong> PostgreSQL, Redis (cache)
                  </li>
                  <li className="flex items-center">
                    <Container className="w-4 h-4 mr-2 text-primary" />
                    <strong>Infrastructure:</strong> Docker, Nginx, GitHub Actions
                  </li>
                </ul>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-3 text-primary" />
                Quick Start
              </h2>
              <div className="bg-secondary rounded-lg p-6">
                <p className="mb-4">Follow these steps to get started with AUTARCH-WEB:</p>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    <span>Clone the repository and install dependencies</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    <span>Copy <code className="bg-background px-2 py-1 rounded">.env.example</code> to <code className="bg-background px-2 py-1 rounded">.env</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    <span>Start the development environment with <code className="bg-background px-2 py-1 rounded">npm run dev</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">4.</span>
                    <span>Build for production with <code className="bg-background px-2 py-1 rounded">npm run build</code></span>
                  </li>
                </ol>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-primary" />
                Architecture
              </h2>
              <div className="bg-secondary rounded-lg p-6">
                <p className="mb-4">
                  The platform uses a monorepo architecture with Turborepo for efficient builds
                  and shared code across frontend and backend.
                </p>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-xs">
{`autarch-web-foundation/
├── apps/
│   ├── web/        # Next.js frontend
│   └── api/        # Backend API
├── packages/       # Shared packages
│   ├── ui/
│   ├── utils/
│   └── types/
├── docker/
└── scripts/`}
                </pre>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-primary" />
                Authentication
              </h2>
              <div className="bg-secondary rounded-lg p-6">
                <p className="mb-4">
                  JWT-based authentication with session management, email verification,
                  and password reset functionality.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• JWT tokens with refresh mechanism</li>
                  <li>• Email verification on registration</li>
                  <li>• Password reset via email</li>
                  <li>• Role-based access control (RBAC)</li>
                  <li>• Session management and auditing</li>
                </ul>
              </div>
            </section>

            {/* Docker Setup */}
            <section id="docker" className="mb-12">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Container className="w-6 h-6 mr-3 text-primary" />
                Docker Setup
              </h2>
              <div className="bg-secondary rounded-lg p-6">
                <p className="mb-4">
                  Production-ready Docker configuration with PostgreSQL, Redis, and Nginx.
                </p>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-xs">
{`# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down`}
                </pre>
              </div>
            </section>

            {/* Learn More */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Learn More</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="#"
                  className="bg-secondary rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold mb-2">API Reference</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete API documentation with examples
                  </p>
                </a>
                <a
                  href="#"
                  className="bg-secondary rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold mb-2">Component Library</h3>
                  <p className="text-sm text-muted-foreground">
                    Reusable UI components and patterns
                  </p>
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
