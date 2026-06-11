import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTierRange, getPricingBreakdown, parsePriceValue } from "@/lib/pricing";
import type { Product, Document } from "@/types";
import { Loader2, FileText, ShoppingCart, Download, ExternalLink, Tag, Info, Eye, Sparkles, LifeBuoy, ShieldCheck, Search, Filter, X, Minus, Plus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Product3DViewer from "@/components/products/product-3d-viewer";
import AIRecommendation from "@/components/products/ai-recommendation";
import LargeAnimalFeature from "@/components/products/large-animal-feature";
import ProductLifecycleView from "@/components/lifecycle/product-lifecycle-view";
import RegulatoryCompliance from "@/components/lifecycle/regulatory-compliance";

const ProductsPage = () => {
  const [location, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [ndcFilter, setNdcFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get category from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) {
      setActiveCategory(category);
    }
  }, [location]);
  
  // Fetch products using tRPC with search filters
  const { data: products, isLoading, error } = trpc.products.searchWithFilters.useQuery(
    {
      keyword: searchKeyword || undefined,
      category: selectedCategory || undefined,
      minPrice: minPrice,
      maxPrice: maxPrice,
      ndc: ndcFilter || undefined,
      limit: 100,
    },
    {
      enabled: true,
    }
  );
  
  // Fetch documents for selected product using tRPC
  const { data: documents, isLoading: isLoadingDocs } = trpc.documents.list.useQuery(
    undefined,
    { enabled: !!selectedProduct }
  );

  const { data: selectedPricingTiers = [] } = trpc.products.getPricingTiers.useQuery(
    { productId: selectedProduct?.id ?? 0 },
    { enabled: !!selectedProduct },
  );

  useEffect(() => {
    setSelectedQuantity(1);
  }, [selectedProduct?.id]);
  
  // Filter products by category
  const filteredProducts = (() => {
    if (activeCategory === "all") {
      return products;
    } else if (activeCategory === "accessories") {
      // For the accessories tab, show products with the "accessories" subcategory
      return products?.filter(product => product.subcategory === "accessories" || product.subcategory === "caps");
    } else {
      // For other categories, filter as normal
      return products?.filter(product => product.category === activeCategory);
    }
  })();

  // Handle add to cart
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    },
  });
  
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add products to your cart.",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
    });
  };

  const selectedPricing = selectedProduct
    ? getPricingBreakdown(selectedProduct.unitPrice, selectedQuantity, selectedPricingTiers)
    : null;
  
  // Handle document download
  const handleDocumentDownload = (document: Document) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to access product documentation.",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    // In a real implementation, we would handle the document download
    window.open(document.fileUrl, "_blank");
  };

  return (
    <>
      <Helmet>
        <title>Products - Radix Laboratories Inc.</title>
        <meta name="description" content="Explore our comprehensive range of veterinary pharmaceutical and nutritional products. High-quality, FDA-compliant products for animal health." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="grow">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white">
            <div className="absolute inset-0 z-0 bg-linear-to-r from-[#1A5F7A] to-[#086D38]">
              <div className="flex items-center justify-center h-full opacity-10">
                <img 
                  src="/images/calcium-bolus.svg" 
                  alt="Calcium Bolus" 
                  className="h-full max-h-80 object-contain"
                />
              </div>
            </div>
            <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
                  Our Product Catalog
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  Explore our comprehensive range of veterinary pharmaceutical and nutritional products for animal health
                </p>
              </div>
            </div>
          </section>
          
          {/* Product Catalog Section */}
          {/* Large Animal Feature */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <LargeAnimalFeature products={products || []} onProductSelect={setSelectedProduct} />
            </div>
          </section>
          
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              {/* Search and Filter Section */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search products by name, description, or SKU..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A5F7A] focus:border-transparent"
                    />
                  </div>
                  
                  {/* Filter Toggle Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                  
                  {/* Clear Filters Button */}
                  {(searchKeyword || selectedCategory || minPrice || maxPrice || ndcFilter) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchKeyword("");
                        setSelectedCategory("");
                        setMinPrice(undefined);
                        setMaxPrice(undefined);
                        setNdcFilter("");
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>
                
                {/* Advanced Filters */}
                {showFilters && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select                          aria-label="Filter products by category"                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A5F7A] focus:border-transparent"
                        >
                          <option value="">All Categories</option>
                          <option value="veterinary-pharmaceuticals">Veterinary Pharmaceuticals</option>
                          <option value="nutritional-supplements">Nutritional Supplements</option>
                          <option value="supplies">Bottles & Supplies</option>
                          <option value="accessories">Caps & Accessories</option>
                        </select>
                      </div>
                      
                      {/* Min Price Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Price
                        </label>
                        <input
                          type="number"
                          placeholder="$0"
                          value={minPrice || ""}
                          onChange={(e) => setMinPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A5F7A] focus:border-transparent"
                        />
                      </div>
                      
                      {/* Max Price Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Price
                        </label>
                        <input
                          type="number"
                          placeholder="$999"
                          value={maxPrice || ""}
                          onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A5F7A] focus:border-transparent"
                        />
                      </div>
                      
                      {/* NDC Code Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          NDC Code
                        </label>
                        <input
                          type="text"
                          placeholder="Search by NDC..."
                          value={ndcFilter}
                          onChange={(e) => setNdcFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A5F7A] focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Results Count */}
                    <div className="text-sm text-gray-600">
                      {products && `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                )}
              </div>
              
              <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-4">Product Categories</h2>
                  <TabsList className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <TabsTrigger value="all">All Products</TabsTrigger>
                    <TabsTrigger value="veterinary-pharmaceuticals">Veterinary Pharmaceuticals</TabsTrigger>
                    <TabsTrigger value="nutritional-supplements">Nutritional Supplements</TabsTrigger>
                    <TabsTrigger value="supplies">Bottles & Supplies</TabsTrigger>
                    <TabsTrigger value="accessories">Caps & Accessories</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="mt-0">
                  <h3 className="text-xl font-medium text-[#1A5F7A] mb-6">All Products</h3>
                  {renderProductGrid(filteredProducts, isLoading, error, setSelectedProduct)}
                </TabsContent>
                
                <TabsContent value="veterinary-pharmaceuticals" className="mt-0">
                  <h3 className="text-xl font-medium text-[#1A5F7A] mb-6">Veterinary Pharmaceuticals</h3>
                  {renderProductGrid(filteredProducts, isLoading, error, setSelectedProduct)}
                </TabsContent>
                
                <TabsContent value="nutritional-supplements" className="mt-0">
                  <h3 className="text-xl font-medium text-[#1A5F7A] mb-6">Nutritional Supplements</h3>
                  {renderProductGrid(filteredProducts, isLoading, error, setSelectedProduct)}
                </TabsContent>
                
                <TabsContent value="supplies" className="mt-0">
                  <h3 className="text-xl font-medium text-[#1A5F7A] mb-6">Bottles & Supplies</h3>
                  
                  <div className="mb-8">
                    <p className="text-gray-600 mb-4">
                      Radix Laboratories offers a range of high-quality bottles and supplies for veterinary and pharmaceutical purposes.
                      Contact us for bulk pricing and availability.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-[#1A5F7A] mb-2">Bulk Orders Available</h4>
                        <p className="text-sm text-gray-600">
                          All bottles and supplies are available for bulk orders. Contact us for special pricing and discounts on larger quantities.
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-[#1A5F7A] mb-2">Custom Solutions</h4>
                        <p className="text-sm text-gray-600">
                          Need a specific bottle size or accessory not listed? Contact our team to discuss custom options for your specific requirements.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {renderProductGrid(filteredProducts, isLoading, error, setSelectedProduct)}
                </TabsContent>
                
                <TabsContent value="accessories" className="mt-0">
                  <h3 className="text-xl font-medium text-[#1A5F7A] mb-6">Caps & Accessories</h3>
                  
                  <div className="mb-8">
                    <p className="text-gray-600 mb-4">
                      Radix Laboratories offers a comprehensive selection of caps, stoppers, and accessories 
                      designed to complement our bottle products. All items are manufactured to the highest quality standards.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-[#1A5F7A] mb-2">Perfect Compatibility</h4>
                        <p className="text-sm text-gray-600">
                          All caps and accessories are precision-designed to fit perfectly with Radix bottles, ensuring a secure and reliable seal every time.
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-[#1A5F7A] mb-2">Custom Color Options</h4>
                        <p className="text-sm text-gray-600">
                          Many of our caps are available in custom colors to help with product identification or to match your brand colors. Contact us for customization options.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-[#1A5F7A] mb-2">Cap Types Available</h4>
                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-gray-700">
                        <li className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#1A5F7A] mr-2"></span>
                          Rubber Stoppers
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#1A5F7A] mr-2"></span>
                          Crimp Caps
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#1A5F7A] mr-2"></span>
                          Dropper Caps
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#1A5F7A] mr-2"></span>
                          Flip-Top Caps
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#1A5F7A] mr-2"></span>
                          Child-Resistant Caps
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-[#1A5F7A] mr-2"></span>
                          Tamper-Evident Seals
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {renderProductGrid(filteredProducts, isLoading, error, setSelectedProduct)}
                </TabsContent>
              </Tabs>
            </div>
          </section>
          
          {/* AI Recommendation Section */}
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-medium text-[#1A5F7A] mb-3">
                  <Sparkles className="inline mr-2 h-6 w-6 text-[#FF8C42]" />
                  AI-Powered Product Recommendations
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Our intelligent recommendation system can help you find the right products for your specific needs.
                  Simply describe your requirements and let our AI suggest the best options.
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <AIRecommendation products={products} onSelectProduct={setSelectedProduct} />
              </div>
            </div>
          </section>
          
          {/* Call to Action */}
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-medium text-[#1A5F7A] mb-4">Need More Information?</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Contact our team for detailed product specifications, pricing information, or to discuss custom formulations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-[#FF8C42] hover:bg-[#086D38]">Request a Quote</Button>
                <Button variant="outline" className="border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white">
                  Contact Sales Team
                </Button>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
      
      {/* Product Detail Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#1A5F7A]">{selectedProduct.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-sm">
                <span>Product #: {selectedProduct.productNumber}</span>
                {selectedProduct.size && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Size: {selectedProduct.size}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <div className="rounded-lg overflow-hidden shadow-md mb-4">
                  {/* 3D Viewer for products */}
                  <Product3DViewer 
                    productId={selectedProduct.id} 
                    productName={selectedProduct.name}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {selectedProduct.category?.replace(/-/g, ' ') || 'Product'}
                  </Badge>
                  {selectedProduct.subcategory && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {selectedProduct.subcategory.replace(/-/g, ' ')}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  {selectedPricing && selectedPricing.discountPercentage > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 line-through">{selectedProduct.unitPrice}</span>
                      <span className="text-lg font-medium text-[#086D38]">{formatCurrency(selectedPricing.effectiveUnitPrice)}</span>
                    </div>
                  ) : (
                    <span className="text-lg font-medium text-[#1A5F7A]">{selectedProduct.unitPrice}</span>
                  )}
                  {selectedProduct.isActive ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>

                <div className="mb-6 rounded-lg border border-[#1A5F7A]/10 bg-[#1A5F7A]/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1A5F7A]">Order quantity</span>
                    <span className="text-sm text-gray-600">
                      {selectedQuantity} {selectedProduct.unitOfMeasure}
                    </span>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(Math.max(1, Number.parseInt(e.target.value || "1", 10) || 1))}
                      className="w-24 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedPricing && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Base total</span>
                        <span>{formatCurrency(selectedPricing.lineSubtotal)}</span>
                      </div>
                      {selectedPricing.savingsAmount > 0 && (
                        <div className="flex justify-between font-medium text-[#086D38]">
                          <span>Volume savings ({selectedPricing.discountPercentage}% off)</span>
                          <span>-{formatCurrency(selectedPricing.savingsAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-[#1A5F7A]">
                        <span>Estimated total</span>
                        <span>{formatCurrency(selectedPricing.lineTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedPricingTiers.length > 0 && (
                  <div className="mb-6 rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-md font-medium text-[#1A5F7A]">Volume pricing</h4>
                      <span className="text-xs text-gray-500">Applied automatically in cart and quotes</span>
                    </div>
                    <div className="space-y-2">
                      {selectedPricingTiers.map((tier) => {
                        const isActiveTier = selectedQuantity >= tier.minQuantity && (tier.maxQuantity == null || selectedQuantity <= tier.maxQuantity);
                        const tierPrice = parsePriceValue(tier.discountedPrice) || parsePriceValue(selectedProduct.unitPrice);

                        return (
                          <div
                            key={`${tier.minQuantity}-${tier.maxQuantity ?? "plus"}`}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                              isActiveTier ? "border-[#086D38] bg-green-50" : "border-gray-200"
                            }`}
                          >
                            <span>{formatTierRange(tier)} units</span>
                            <span className="text-right">
                              <span className="font-medium text-[#1A5F7A]">{formatCurrency(tierPrice)}</span>
                              <span className="ml-2 text-gray-500">({tier.discountPercentage}% off)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => handleAddToCart(selectedProduct, selectedQuantity)} 
                  className="w-full bg-[#086D38] hover:bg-[#1A5F7A]"
                  disabled={!selectedProduct.isActive}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add {selectedQuantity} to Cart
                </Button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">Product Details</h3>
                <p className="text-gray-700 mb-6">{selectedProduct.description}</p>
                
                {selectedProduct.specifications && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-[#1A5F7A] mb-2">Specifications</h4>
                    <p className="text-gray-700">{selectedProduct.specifications}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-[#1A5F7A] mb-2 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Product Documentation
                  </h4>
                  
                  {isLoadingDocs ? (
                    <div className="flex items-center py-4">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading documents...
                    </div>
                  ) : !documents || documents.length === 0 ? (
                    <p className="text-gray-500 py-2">
                      <Info className="inline mr-2 h-4 w-4" />
                      Login to view product documentation
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {documents.map((doc) => (
                        <li key={doc.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
                          <span>{doc.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentDownload(doc)}
                            className="text-[#0097B2] hover:text-[#1A5F7A] hover:bg-[#1A5F7A]/10"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {selectedProduct.category !== "supplies" && 
                 selectedProduct.subcategory !== "accessories" && 
                 selectedProduct.subcategory !== "caps" && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-gray-500 text-sm italic flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      All pharmaceutical products are for oral use only
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Product Lifecycle and Regulatory Section for pharma products */}
            {selectedProduct.category === "veterinary-pharmaceuticals" && (
              <div className="mt-6">
                <Tabs defaultValue="lifecycle" className="w-full">
                  <TabsList>
                    <TabsTrigger value="lifecycle" className="flex items-center">
                      <LifeBuoy className="h-4 w-4 mr-2" />
                      Product Lifecycle
                    </TabsTrigger>
                    <TabsTrigger value="regulatory" className="flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Regulatory Compliance
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="lifecycle" className="mt-4">
                    {/* Only show lifecycle view to authenticated users */}
                    {user ? (
                      <ProductLifecycleView productId={selectedProduct.id} />
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-center flex-col text-center py-8">
                            <LifeBuoy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Product Lifecycle Information</h3>
                            <p className="text-muted-foreground mb-4">
                              Login to view detailed product lifecycle information including development stages, 
                              approval timelines, and product history.
                            </p>
                            <Button onClick={() => setLocation("/auth")}>
                              Login for Access
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="regulatory" className="mt-4">
                    {/* Only show regulatory compliance to authenticated users */}
                    {user ? (
                      <RegulatoryCompliance productId={selectedProduct.id} />
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-center flex-col text-center py-8">
                            <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium mb-2">Regulatory Compliance</h3>
                            <p className="text-muted-foreground mb-4">
                              Login to view detailed regulatory compliance information including approval status, 
                              documentation, and certification details.
                            </p>
                            <Button onClick={() => setLocation("/auth")}>
                              Login for Access
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            <DialogFooter>
              <div className="flex justify-between w-full">
                <Button variant="outline" asChild>
                  <a href={`mailto:info@radix-labs.com?subject=Question about ${selectedProduct.name}`} className="flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Contact for Inquiries
                  </a>
                </Button>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// Helper function to render product grid
const renderProductGrid = (
  products: Product[] | undefined, 
  isLoading: boolean, 
  error: any,
  setSelectedProduct: (product: Product) => void
) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A5F7A]" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading products. Please try again later.</p>
      </div>
    );
  }
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found in this category.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="h-48 overflow-hidden bg-white">
            <img 
              src={product.imageUrl || '/images/placeholder.svg'} 
              alt={product.name} 
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-medium text-[#1A5F7A]">{product.name}</h3>
              {product.size && (
                <Badge variant="outline" className="ml-2">{product.size}</Badge>
              )}
            </div>
            <p className="text-gray-600 mb-2 text-sm">#{product.productNumber}</p>
            <p className="text-gray-600 mb-4">{product.description}</p>
            {product.subcategory && (
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-[#1A5F7A]/10 text-[#1A5F7A] text-sm rounded-full">
                  {product.subcategory.replace(/-/g, ' ')}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 pt-0 flex flex-col space-y-3">
            <div className="flex justify-between items-center w-full">
              <Button 
                variant="link" 
                className="text-[#0097B2] hover:text-[#1A5F7A] p-0"
                onClick={() => setSelectedProduct(product)}
              >
                View Details
              </Button>
              <span className="font-medium text-[#1A5F7A]">{product.unitPrice}</span>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white"
              onClick={() => setSelectedProduct(product)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View 3D Model
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProductsPage;
