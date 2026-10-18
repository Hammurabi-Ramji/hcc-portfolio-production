"use client";

import React, { useState, useEffect } from 'react';

interface NavbarProps {
  user?: {
    name: string;
    avatar?: string;
  } | null;
}

const MOBILE_MENU_ID = 'navbar-mobile-menu';

export default function Navbar({ user = null }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <a href="/" className="text-xl font-bold text-gradient">
              AUTARCH
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </a>
            <a href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
              Docs
            </a>
            {user ? (
              <div className="flex items-center space-x-4">
                <a
                  href="/dashboard"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </a>
                <div className="flex items-center space-x-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a
                  href="/login"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          id={MOBILE_MENU_ID}
          className={`md:hidden py-4 border-t border-border ${mobileMenuOpen ? '' : 'hidden'}`}
          hidden={!mobileMenuOpen}
        >
          <div className="flex flex-col space-y-4">
            <a href="/features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </a>
            <a href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
              Docs
            </a>
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </a>
                <div className="flex items-center space-x-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
