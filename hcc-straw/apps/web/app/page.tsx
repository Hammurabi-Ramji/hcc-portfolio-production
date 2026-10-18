"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Features from '@/components/Features';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navUser = user
    ? {
        name: user.username || user.email || 'User',
        avatar: user.profile?.avatarUrl,
      }
    : null;

  return (
    <main className="min-h-screen">
      <Navbar user={navUser} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Build Production-Ready
              <br />
              <span className="text-gradient">Web Applications</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A comprehensive full-stack foundation with Next.js 15, TypeScript, 
              PostgreSQL, and Docker. Everything you need to launch your next project.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="px-8 py-4 text-base font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
              >
                Get Started Free
              </a>
              <a
                href="/docs"
                className="px-8 py-4 text-base font-semibold text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-all hover:scale-105"
              >
                View Documentation
              </a>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-16">
            <p className="text-sm text-muted-foreground mb-6">POWERED BY</p>
            <div className="flex flex-wrap justify-center gap-6 text-2xl font-bold text-muted-foreground">
              <span className="hover:text-primary transition-colors">Next.js</span>
              <span className="text-gray-600">•</span>
              <span className="hover:text-primary transition-colors">TypeScript</span>
              <span className="text-gray-600">•</span>
              <span className="hover:text-primary transition-colors">PostgreSQL</span>
              <span className="text-gray-600">•</span>
              <span className="hover:text-primary transition-colors">Docker</span>
              <span className="text-gray-600">•</span>
              <span className="hover:text-primary transition-colors">Redis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Building?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are building faster with our production-ready foundation.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            Start Building Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
