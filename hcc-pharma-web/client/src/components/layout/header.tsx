import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PhoneCall, Mail, ChevronDown, Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoginDropdown } from "./login-dropdown";
import { ShoppingCartButton } from "@/components/cart/shopping-cart";

const Header = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md">
      {/* Top utility bar */}
      <div className="bg-[#1A5F7A] text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 text-sm">
            <a href="tel:18009272349" className="hover:text-[#FF8C42] transition-colors duration-200 flex items-center">
              <PhoneCall className="h-4 w-4 mr-1" /> 1-800-927-2349
            </a>
            <a href="mailto:info@radixlabs.com" className="hover:text-[#FF8C42] transition-colors duration-200 flex items-center">
              <Mail className="h-4 w-4 mr-1" /> info@radixlabs.com
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <ShoppingCartButton />
            <LoginDropdown className="text-white bg-transparent border-white hover:bg-white/10" />
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-white hover:text-[#FF8C42] hover:bg-transparent">
                Request a Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Logo Banner - Full Width */}
      <div className="w-full bg-gradient-to-r from-[#086D38]/10 via-white to-[#1A5F7A]/10 py-4">
        <div className="container mx-auto flex justify-center">
          <Link href="/" onClick={closeMobileMenu} className="block w-full max-w-2xl">
            <img 
              src="/images/radix-logo-modern.svg" 
              alt="Radix Labs Logo" 
              className="w-full h-auto transition-all duration-300 hover:filter hover:brightness-105" 
            />
          </Link>
        </div>
      </div>
      
      {/* Main navigation */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 mx-auto">
            <div className="group relative">
              <Link href="/about" className="font-medium text-[#1A5F7A] hover:text-[#0097B2] flex items-center">
                About Us <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link href="/about#our-story" className="block px-4 py-2 hover:bg-gray-100">Our Story</Link>
                <Link href="/about#facilities" className="block px-4 py-2 hover:bg-gray-100">Facilities</Link>
                <Link href="/about#leadership" className="block px-4 py-2 hover:bg-gray-100">Leadership</Link>
                <Link href="/about#quality-assurance" className="block px-4 py-2 hover:bg-gray-100">Quality Assurance</Link>
                <Link href="/about#cgmp-compliance" className="block px-4 py-2 hover:bg-gray-100">cGMP Compliance</Link>
              </div>
            </div>
            
            <div className="group relative">
              <Link href="/products" className="font-medium text-[#1A5F7A] hover:text-[#0097B2] flex items-center">
                Products <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link href="/products?category=veterinary-pharmaceuticals" className="block px-4 py-2 hover:bg-gray-100">Veterinary Pharmaceuticals</Link>
                <Link href="/products?category=nutritional-supplements" className="block px-4 py-2 hover:bg-gray-100">Nutritional Supplements</Link>
                <Link href="/products" className="block px-4 py-2 hover:bg-gray-100">Product Catalog</Link>
              </div>
            </div>
            
            <div className="group relative">
              <Link href="/services" className="font-medium text-[#1A5F7A] hover:text-[#0097B2] flex items-center">
                Services <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link href="/services#contract-manufacturing" className="block px-4 py-2 hover:bg-gray-100">Contract Manufacturing</Link>
                <Link href="/services#quality-testing" className="block px-4 py-2 hover:bg-gray-100">Quality Testing</Link>
                <Link href="/services#formulation-development" className="block px-4 py-2 hover:bg-gray-100">Formulation Development</Link>
                <Link href="/services#stability-studies" className="block px-4 py-2 hover:bg-gray-100">Stability Studies</Link>
              </div>
            </div>
            
            <div className="group relative">
              <Link href="/quality" className="font-medium text-[#1A5F7A] hover:text-[#0097B2] flex items-center">
                Quality <ChevronDown className="h-4 w-4 ml-1" />
              </Link>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <Link href="/quality#quality-control" className="block px-4 py-2 hover:bg-gray-100">Quality Control</Link>
                <Link href="/quality#testing-protocols" className="block px-4 py-2 hover:bg-gray-100">Testing Protocols</Link>
                <Link href="/quality#certifications" className="block px-4 py-2 hover:bg-gray-100">Certifications</Link>
                <Link href="/quality#stability-testing" className="block px-4 py-2 hover:bg-gray-100">Stability Testing</Link>
              </div>
            </div>
            
            <Link href="/resources" className="font-medium text-[#1A5F7A] hover:text-[#0097B2]">
              Resources
            </Link>
            
            <Link href="/contact" className="font-medium text-[#1A5F7A] hover:text-[#0097B2]">
              Contact
            </Link>
            
            {user ? (
              <Link href="/client-portal">
                <Button className="ml-4 px-6 py-2 bg-[#086D38] hover:bg-[#1A5F7A] text-white rounded-md transition-colors duration-200">
                  Client Portal
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button className="ml-4 px-6 py-2 bg-[#FF8C42] hover:bg-[#086D38] text-white rounded-md transition-colors duration-200">
                  Client Portal
                </Button>
              </Link>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden text-[#1A5F7A] mx-auto"
            onClick={toggleMobileMenu}
          >
            <div className="flex items-center">
              <span className="mr-2">Menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </div>
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-white border-t border-gray-200`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col space-y-2 mb-4 border-b border-gray-200 pb-4">
            <h3 className="font-semibold text-[#1A5F7A]">Login Options</h3>
            <Link href="/auth?type=veterinarian" onClick={closeMobileMenu} className="block py-1 text-sm text-[#1A5F7A]">
              Veterinarian Login
            </Link>
            <Link href="/auth?type=wholesaler" onClick={closeMobileMenu} className="block py-1 text-sm text-[#1A5F7A]">
              Wholesaler Login
            </Link>
            <Link href="/auth?type=farm" onClick={closeMobileMenu} className="block py-1 text-sm text-[#1A5F7A]">
              Farm Login
            </Link>
            <Link href="/auth?type=regulatory" onClick={closeMobileMenu} className="block py-1 text-sm text-[#1A5F7A]">
              Regulatory Login
            </Link>
            <Link href="/auth?type=vendor" onClick={closeMobileMenu} className="block py-1 text-sm text-[#1A5F7A]">
              Vendor Login
            </Link>
          </div>

          <Link href="/about" onClick={closeMobileMenu} className="block py-2 text-[#1A5F7A] font-medium">About Us</Link>
          <Link href="/products" onClick={closeMobileMenu} className="block py-2 text-[#1A5F7A] font-medium">Products</Link>
          <Link href="/services" onClick={closeMobileMenu} className="block py-2 text-[#1A5F7A] font-medium">Services</Link>
          <Link href="/quality" onClick={closeMobileMenu} className="block py-2 text-[#1A5F7A] font-medium">Quality</Link>
          <Link href="/resources" onClick={closeMobileMenu} className="block py-2 text-[#1A5F7A] font-medium">Resources</Link>
          <Link href="/contact" onClick={closeMobileMenu} className="block py-2 text-[#1A5F7A] font-medium">Contact</Link>
          
          {user ? (
            <div className="flex flex-col space-y-2 mt-2">
              <Link href="/client-portal" onClick={closeMobileMenu}>
                <Button className="w-full bg-[#086D38] hover:bg-[#1A5F7A]">
                  Client Portal
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white"
                onClick={async () => {
                  await logout();
                  closeMobileMenu();
                }}
              >
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/auth" onClick={closeMobileMenu}>
              <Button className="block w-full py-2 px-4 mt-2 bg-[#FF8C42] hover:bg-[#086D38] text-white rounded-md">
                Client Portal
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
