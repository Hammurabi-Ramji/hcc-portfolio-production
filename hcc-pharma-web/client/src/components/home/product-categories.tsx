import type { Product } from "@/types";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Define category info for better organization
const categoryInfo = {
  "veterinary-pharmaceuticals": {
    title: "Veterinary Pharmaceuticals",
    description: "High-quality pharmaceutical products for animal health and wellness.",
    color: "#1A5F7A",
    image: "/images/calcium-bolus.svg",
    products: ["Burn Relief", "Caprotec"],
    tags: ["Pain Management", "Protective Care", "Oral Solutions"]
  },
  "nutritional-supplements": {
    title: "Nutritional Supplements",
    description: "Specialized nutritional products for optimal animal health and performance.",
    color: "#086D38",
    image: "/images/products/calcium-gluconate.svg",
    products: ["Ammoral", "Calcium Gluconate 23%"],
    tags: ["Minerals", "Calcium Supplements", "Trace Elements"]
  },
  "supplies": {
    title: "Bottles and Caps",
    description: "High-quality bottles, caps, and accessories for pharmaceutical and veterinary applications.",
    color: "#0097B2",
    image: "/images/products/plastic-bottle.svg",
    products: ["Plastic Serum Bottles", "Dropper Bottles", "Nursing Bottles"],
    tags: ["Bottles", "Caps", "Accessories"]
  }
};

// Format category name
const formatCategoryName = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ProductCategories = () => {
  // Fetch products from tRPC
  const { data: products } = trpc.products.list.useQuery();

  // Get categories
  const categories = Object.keys(categoryInfo);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h2 className="text-3xl font-medium text-[#1A5F7A] mb-3">Our Product Categories</h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Explore our comprehensive range of veterinary pharmaceutical and nutritional products.
            </p>
          </div>
          <Link href="/products">
            <Button variant="link" className="mt-4 md:mt-0 inline-flex items-center text-[#0097B2] hover:text-[#1A5F7A] font-medium">
              View Full Catalog
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const info = categoryInfo[category as keyof typeof categoryInfo];
            
            // Count products in this category
            const productCount = products?.filter(p => p.category === category).length || 0;
            
            return (
              <div 
                key={category}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="h-48 overflow-hidden bg-gray-50">
                  <img 
                    src={info.image} 
                    alt={info.title} 
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-medium" style={{ color: info.color }}>{info.title}</h3>
                  <p className="text-gray-600 mb-4">
                    {info.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {info.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-sm rounded-full"
                        style={{ backgroundColor: `${info.color}10`, color: info.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {productCount > 0 && (
                    <p className="text-gray-500 text-sm mb-3">
                      {productCount} products available
                    </p>
                  )}
                  
                  <Link href={`/products?category=${category}`}>
                    <Button 
                      variant="link" 
                      className="font-medium inline-flex items-center p-0"
                      style={{ color: info.color }}
                    >
                      Explore Products
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductCategories;
