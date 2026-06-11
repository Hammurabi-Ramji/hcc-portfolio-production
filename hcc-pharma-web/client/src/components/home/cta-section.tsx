import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CtaSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-medium text-[#1A5F7A] mb-6">Ready to Experience the Radix Difference?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Contact our team today to learn more about our products, request samples, or discuss how we can meet your veterinary pharmaceutical needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button className="px-6 py-3 bg-[#FF8C42] hover:bg-[#086D38] text-white rounded-md transition-colors duration-200 font-medium">
                Contact Our Team
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="px-6 py-3 bg-[#0097B2] hover:bg-[#1A5F7A] text-white rounded-md transition-colors duration-200 font-medium">
                Request Product Samples
              </Button>
            </Link>
            <Link href="/resources">
              <Button variant="outline" className="px-6 py-3 bg-transparent border-2 border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white rounded-md transition-colors duration-200 font-medium">
                Access Technical Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
