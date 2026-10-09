"use client";

import { ArrowRight, Shield, Zap, Layers, Code, Database, Cloud, Activity } from 'lucide-react';

const features = [
  {
    icon: Code,
    title: 'Type-Safe Development',
    description: 'Full TypeScript coverage across frontend and backend for fewer bugs and better developer experience.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Database,
    title: 'Modern Database',
    description: 'PostgreSQL with Redis caching for optimal performance and data integrity.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'JWT authentication, RBAC, audit logging, and bcrypt password hashing.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Zap,
    title: 'High Performance',
    description: 'Next.js 15 with App Router, server components, and intelligent caching.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Layers,
    title: 'Monorepo Architecture',
    description: 'Turborepo-powered workspace for shared code and efficient builds.',
    color: 'from-indigo-500 to-violet-500'
  },
  {
    icon: Cloud,
    title: 'Docker Ready',
    description: 'Production-ready Docker configuration with nginx, PostgreSQL, and Redis.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Activity,
    title: 'Real-time Analytics',
    description: 'Built-in audit logging and activity tracking for complete visibility.',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    icon: ArrowRight,
    title: 'API First',
    description: 'RESTful API design with comprehensive error handling and validation.',
    color: 'from-pink-500 to-rose-500'
  }
];

export default function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for <span className="text-gradient">Production</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build scalable, maintainable web applications with modern best practices.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
