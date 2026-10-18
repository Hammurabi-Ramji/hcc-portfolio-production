"use client";

import React from 'react';

/**
 * Destinations are limited to routes that exist under apps/web/app.
 * Legal/support/social profile URLs are omitted until those owners publish pages.
 */
export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <a href="/" className="text-xl font-bold text-gradient">
              AUTARCH
            </a>
            <p className="text-muted-foreground text-sm">
              Building the future of web development with modern, scalable architecture.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  API Reference
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2026 Hammurabi Coding Company. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
