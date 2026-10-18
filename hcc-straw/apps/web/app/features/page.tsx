"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import CapabilityShowcase from './CapabilityShowcase';

export default function FeaturesPage() {
  const { user } = useAuth();
  const navUser = user
    ? {
        name: user.username || user.email || 'User',
        avatar: user.profile?.avatarUrl,
      }
    : null;

  return (
    <div className="min-h-screen">
      <Navbar user={navUser} />

      <div className="pt-20">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Features
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Review what AUTARCH-WEB currently provides in this Next.js UI, and which
            backend or infrastructure integrations remain planned.
          </p>
        </div>

        <CapabilityShowcase />

        <Footer />
      </div>
    </div>
  );
}
