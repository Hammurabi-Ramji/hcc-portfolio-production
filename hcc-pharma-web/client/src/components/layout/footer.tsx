import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Linkedin, Twitter, Facebook, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    // In a real application, this would send the email to a server
    toast({
      title: "Thanks for subscribing!",
      description: "You'll now receive our newsletter updates."
    });
    
    setEmail("");
  };

  return (
    <footer className="bg-gray-800 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h4 className="text-xl font-medium mb-4">Radix Laboratories</h4>
            <address className="not-italic text-gray-300 mb-4">
              <div className="flex items-start mb-2">
                <MapPin className="h-5 w-5 mr-2 mt-1 text-gray-400" />
                <div>
                  <p>1334 International Drive</p>
                  <p>Eau Claire, WI 54701</p>
                </div>
              </div>
              <div className="flex items-center mb-2">
                <Phone className="h-5 w-5 mr-2 text-gray-400" />
                <p>(715) 833-0644</p>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-gray-400" />
                <p>radix@radix-labs.com</p>
              </div>
            </address>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/quality" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Quality
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-xl font-medium mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/resources#technical-documentation" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Technical Documentation
                </Link>
              </li>
              <li>
                <Link href="/resources#product-specifications" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Product Specifications
                </Link>
              </li>
              <li>
                <Link href="/resources#safety-data-sheets" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Safety Data Sheets
                </Link>
              </li>
              <li>
                <Link href="/resources#faqs" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/resources#industry-insights" className="text-gray-300 hover:text-white transition-colors duration-200 block">
                  Industry Insights
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter Signup */}
          <div>
            <h4 className="text-xl font-medium mb-4">Stay Updated</h4>
            <p className="text-gray-300 mb-4">
              Subscribe to our newsletter for industry updates and product announcements.
            </p>
            <form className="space-y-2" onSubmit={handleNewsletterSubmit}>
              <div>
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0097B2]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#FF8C42] hover:bg-[#0097B2] text-white font-medium py-2 rounded transition-colors duration-200"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="bg-gray-900 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0 text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Radix Laboratories Incorporated. All rights reserved.</p>
              <p className="text-xs mt-1">🇺🇸 Proudly made in the USA</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Cookie Policy
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
