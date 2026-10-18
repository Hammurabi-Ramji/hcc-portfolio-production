import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sparkles, Beaker, FlaskConical, Microscope, Award } from "lucide-react";
import { useState, useEffect } from "react";

const Hero = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const parallaxOffset = scrollPosition * 0.15;
  
  return (
    <section className="relative bg-gradient-to-b from-[#1A5F7A] to-gray-800 text-white overflow-hidden">
      {/* Background Building Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://www.radix-labs.com/1mages/graphics/radixsign.gif" 
          alt="Radix Laboratories Building" 
          className="w-full h-full object-cover opacity-30"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        />
      </div>
      
      {/* Large Animal Silhouettes */}
      <div className="absolute inset-0 z-0 opacity-15">
        <img 
          src="/images/large-animal-silhouettes.svg" 
          alt="Large Animal Silhouettes" 
          className="w-full h-full object-contain"
          style={{ transform: `translateY(${parallaxOffset * 0.8}px)` }}
        />
      </div>
      
      {/* Pharma Icons */}
      <div className="absolute top-10 right-10 z-0">
        <img 
          src="/images/pharma-icons.svg" 
          alt="Pharmaceutical Icons" 
          className="w-64 h-auto opacity-30"
          style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
        />
      </div>
      
      {/* Hero Content */}
      <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
        <div className="max-w-4xl backdrop-blur-sm bg-[#1A5F7A]/20 p-8 rounded-lg border border-white/10">
          <div className="text-center mb-6">
            <span className="inline-block bg-gradient-to-r from-[#FF8C42] to-[#FF6B1A] text-white px-5 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse shadow-lg">
              🏆 45-Year History of Business Success
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white drop-shadow-lg">
              Advancing Animal Health Through Quality, Value, and Innovation
            </h1>
          </div>
          
          <p className="text-lg md:text-xl mb-6 text-center text-gray-100 leading-relaxed">
            Radix Labs is a trusted, <span className="font-semibold text-white">FDA inspected manufacturer</span> of 50+ products serving veterinary professionals, farms, and distributors nationally across the categories of cattle, swine, equine, and others.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-8 text-sm md:text-base">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              ✓ 45-Year History
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              ✓ FDA Inspected & cGMP Compliant
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              ✓ 750+ Customers Served Globally
            </div>
          </div>
          
          {/* Feature Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col items-center text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Award className="h-8 w-8 mb-2 text-[#FF8C42]" />
              <span className="text-sm font-medium">Premium Quality</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Beaker className="h-8 w-8 mb-2 text-[#FF8C42]" />
              <span className="text-sm font-medium">Advanced Formulations</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Microscope className="h-8 w-8 mb-2 text-[#FF8C42]" />
              <span className="text-sm font-medium">Research-Backed</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-8 w-8 mb-2 text-[#FF8C42]" />
              <span className="text-sm font-medium">Industry Leader</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-5 mt-8">
            <Link href="/products">
              <Button className="px-8 py-6 bg-[#FF8C42] hover:bg-[#086D38] text-white rounded-md transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium text-lg">
                <Beaker className="mr-2 h-5 w-5" />
                Explore Our Products
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="px-8 py-6 bg-transparent border-2 border-white hover:bg-white hover:text-[#1A5F7A] text-white rounded-md transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium text-lg">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
