import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const FeaturedProduct = () => {
  // Fetch products from tRPC
  const { data: products } = trpc.products.list.useQuery();
  
  // Get featured product if available, otherwise use the first product
  const featuredProduct = products?.find(product => product.isFeatured) || products?.[0];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-sm text-[#0097B2] font-medium uppercase tracking-wider">Featured Product</span>
              <h2 className="text-3xl font-medium text-[#1A5F7A] mt-2 mb-4">
                {featuredProduct?.name || "Calcium Solution for Injection"}
              </h2>
              <p className="text-gray-600 mb-4">
                {featuredProduct?.description || 
                  "Our pharmaceutical-grade calcium solution is formulated specifically for veterinary use, providing essential calcium supplementation for animals with hypocalcemia."}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <CheckCircle className="text-[#086D38] mt-1 mr-2" />
                  <span>USP-grade calcium gluconate in sterile solution</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#086D38] mt-1 mr-2" />
                  <span>Available in multiple concentrations and package sizes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#086D38] mt-1 mr-2" />
                  <span>Tested for potency, sterility, and endotoxins</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#086D38] mt-1 mr-2" />
                  <span>Certificate of Analysis available upon request</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link href={featuredProduct ? `/products/${featuredProduct.id}` : "/products"}>
                  <Button className="px-6 py-3 bg-[#FF8C42] hover:bg-[#086D38] text-white rounded-md transition-colors duration-200 font-medium">
                    Product Details
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="px-6 py-3 border-2 border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white rounded-md transition-colors duration-200 font-medium">
                    Request Quote
                  </Button>
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <img 
                  src={featuredProduct?.imageUrl || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"} 
                  alt={featuredProduct?.name || "Calcium Solution for Injection"} 
                  className="w-full h-auto rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;
