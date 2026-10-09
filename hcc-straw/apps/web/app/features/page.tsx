"use client";

import Navbar from '@/components/Navbar';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Navbar user={null} />
      
      <div className="pt-20">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Features
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Discover all the powerful features that make AUTARCH-WEB the perfect foundation
            for your next web application.
          </p>
        </div>
        
        <Features />
        
        <Footer />
      </div>
    </div>
  );
}
