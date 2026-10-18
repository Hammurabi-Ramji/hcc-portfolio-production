"use client";

import { ArrowRight, Shield, Zap, Layers, Code, Database, Cloud, Activity } from 'lucide-react';

type CapabilityStatus = 'available' | 'planned';

type Capability = {
  icon: typeof Code;
  title: string;
  description: string;
  status: CapabilityStatus;
  color: string;
};

const capabilities: Capability[] = [
  {
    icon: Code,
    title: 'Type-Safe UI',
    description:
      'Next.js App Router pages and shared components are written in TypeScript for safer local UI development.',
    status: 'available',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Next.js 15 App Router',
    description:
      'Client and server route modules use the App Router with Tailwind styling for the quarantined legacy web surface.',
    status: 'available',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Shield,
    title: 'Cookie Session Auth',
    description:
      'AuthProvider restores the current user through same-origin cookie sessions against the local loopback API. This is not a JWT/bcrypt marketing stack.',
    status: 'available',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: ArrowRight,
    title: 'API Proxy Routes',
    description:
      'Next.js /api handlers forward to the local Rust service with structured envelopes. They are a bridge, not a standalone production backend.',
    status: 'available',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Database,
    title: 'PostgreSQL + Redis',
    description:
      'Planned infrastructure. The current legacy API persists to local SQLite; PostgreSQL and Redis are not part of this tree.',
    status: 'planned',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Layers,
    title: 'Turborepo Workspace',
    description:
      'Planned monorepo build orchestration. This app is verified with its own npm scripts, not a Turborepo pipeline.',
    status: 'planned',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Cloud,
    title: 'Production Docker Stack',
    description:
      'Planned packaging. Production Docker with nginx, PostgreSQL, and Redis is not configured in this repository.',
    status: 'planned',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Activity,
    title: 'Audit & Analytics Suite',
    description:
      'Planned product surface. Built-in real-time analytics and complete audit dashboards are not claimed as delivered here.',
    status: 'planned',
    color: 'from-teal-500 to-cyan-500',
  },
];

function statusLabel(status: CapabilityStatus): string {
  return status === 'available' ? 'Available now' : 'Planned integration';
}

export default function CapabilityShowcase() {
  return (
    <section className="py-20 bg-background" aria-labelledby="capabilities-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 id="capabilities-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Capabilities <span className="text-gradient">by Status</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This page describes what the legacy Next.js UI actually ships today versus
            integrations that remain planned. It does not reuse unverified production claims.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {capabilities.map((capability) => (
            <article
              key={capability.title}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${capability.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <capability.icon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-xl font-semibold">{capability.title}</h3>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-1 rounded border ${
                    capability.status === 'available'
                      ? 'border-green-600/40 text-green-700 dark:text-green-400'
                      : 'border-amber-600/40 text-amber-800 dark:text-amber-400'
                  }`}
                >
                  {statusLabel(capability.status)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{capability.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto border border-border rounded-xl p-6 bg-card">
          <h3 className="text-lg font-semibold mb-3">Planned integrations</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            <li>PostgreSQL primary store and Redis caching replacing local SQLite for this web surface.</li>
            <li>Turborepo-powered shared builds across packages.</li>
            <li>Production Docker composition with nginx fronting PostgreSQL and Redis.</li>
            <li>Productized audit logging and analytics UI beyond local API session/activity records.</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Shared homepage marketing copy in <code className="text-foreground">components/Features.tsx</code>{' '}
            remains owned by the components agent. This route renders its own status-accurate source.
          </p>
        </div>
      </div>
    </section>
  );
}
