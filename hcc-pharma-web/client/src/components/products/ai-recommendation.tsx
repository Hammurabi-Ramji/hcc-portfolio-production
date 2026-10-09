import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";
import { BrainCircuit, Sparkles, Search, Loader2, RefreshCw, Check, Pill, Beaker, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendationProps {
  products: Product[] | undefined;
  onSelectProduct: (product: Product) => void;
}

const AIRecommendation = ({ products, onSelectProduct }: AIRecommendationProps) => {
  const [inputMode, setInputMode] = useState<"basic" | "advanced">("basic");
  const [searchQuery, setSearchQuery] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [reasonings, setReasonings] = useState<string[]>([]);
  const { toast } = useToast();

  // Sample animal types for demonstration
  const animalTypes = ["Cattle", "Swine", "Equine", "Sheep", "Goats", "Poultry"];

  // Sample symptom tags for demonstration
  const commonSymptoms = [
    "Digestive Issues", "Respiratory Problems", "Skin Conditions", 
    "Lameness", "Infections", "Nutritional Deficiency", "Parasites"
  ];

  // Function to simulate AI-driven product recommendations
  const generateRecommendations = () => {
    // Only proceed if we have products
    if (!products || products.length === 0) {
      toast({
        title: "No products available",
        description: "Unable to generate recommendations without product data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      let filteredProducts: Product[] = [];
      let generatedReasonings: string[] = [];

      // Basic filtering logic based on input
      if (inputMode === "basic") {
        const query = searchQuery.toLowerCase();
        
        // Simple keyword matching
        filteredProducts = products.filter(product => 
          product.name?.toLowerCase()?.includes(query) || 
          product.description?.toLowerCase()?.includes(query) ||
          product.category?.toLowerCase()?.includes(query) ||
          (product.subcategory && product.subcategory?.toLowerCase()?.includes(query))
        ).slice(0, 3); // Limit to 3 results
        
        // Generate "AI-like" reasonings
        generatedReasonings = filteredProducts.map(product => {
          let confidence = Math.floor(Math.random() * 30) + 70; // 70-99% confidence
          return `${confidence}% match based on your search query. ${product.name} is recommended for ${
            product.category === "veterinary-pharmaceuticals" 
              ? "treatment and prevention" 
              : "supporting animal health"
          }. Keywords matched: "${searchQuery}".`;
        });
      } else {
        // Advanced filtering with more context
        const animalKeyword = animalType.toLowerCase();
        const symptomKeywords = symptoms.toLowerCase().split(",").map(s => s.trim());
        
        // More sophisticated matching (simulated)
        filteredProducts = products
          .filter(product => {
            const relevanceScore = 
              // Check if product description mentions the animal type
              (product.description?.toLowerCase()?.includes(animalKeyword) ? 20 : 0) +
              // Check if product matches any symptoms
              symptomKeywords.reduce((score, symptom) => {
                return score + (product.description?.toLowerCase()?.includes(symptom) ? 15 : 0);
              }, 0) + 
              // Preferred product categories for symptoms
              (product.category === "veterinary-pharmaceuticals" ? 10 : 0);
              
            return relevanceScore > 15; // Threshold for relevance
          })
          .sort(() => 0.5 - Math.random()) // Randomize for demo
          .slice(0, 3); // Limit to 3 results
        
        // Generate more detailed reasonings
        generatedReasonings = filteredProducts.map(product => {
          return `Based on the ${animalType} health profile and symptoms "${symptoms}", ${product.name} may be effective. This ${
            product.category?.replace(/-/g, ' ') || 'product'
          } is commonly used for similar conditions. For best results, consult with a veterinarian for proper dosing and administration.`;
        });
      }
      
      // If no matches, show a helpful message
      if (filteredProducts.length === 0) {
        toast({
          title: "No matching products found",
          description: "Try adjusting your search criteria or contact our support for personalized recommendations.",
          variant: "destructive",
        });
      }

      setRecommendations(filteredProducts);
      setReasonings(generatedReasonings);
      setLoading(false);
    }, 2000); // 2 second delay to simulate processing
  };

  // Reset form
  const resetForm = () => {
    setSearchQuery("");
    setAnimalType("");
    setSymptoms("");
    setRecommendations([]);
    setReasonings([]);
  };

  // Select a symptom tag
  const addSymptom = (symptom: string) => {
    const currentSymptoms = symptoms.split(",").map(s => s.trim()).filter(s => s !== "");
    if (!currentSymptoms.includes(symptom)) {
      setSymptoms(currentSymptoms.length > 0 ? `${symptoms}, ${symptom}` : symptom);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-[#1A5F7A] to-[#0097B2] text-white">
        <div className="flex items-center">
          <BrainCircuit className="h-6 w-6 mr-2" />
          <CardTitle>AI Product Recommendation</CardTitle>
        </div>
        <CardDescription className="text-gray-100">
          Get intelligent product suggestions based on your specific needs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as "basic" | "advanced")}>
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Basic Search
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              Smart Assist
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div>
              <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
                What are you looking for?
              </label>
              <Input
                id="search-query"
                placeholder="Enter product type, condition, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: "cattle digestion" or "wound treatment"
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div>
              <label htmlFor="animal-type" className="block text-sm font-medium text-gray-700 mb-1">
                Animal Type
              </label>
              <Input
                id="animal-type"
                placeholder="Enter animal species..."
                value={animalType}
                onChange={(e) => setAnimalType(e.target.value)}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {animalTypes.map((type) => (
                  <Badge 
                    key={type} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-[#1A5F7A]/10"
                    onClick={() => setAnimalType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                Symptoms or Conditions
              </label>
              <Textarea
                id="symptoms"
                placeholder="Describe symptoms or conditions..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {commonSymptoms.map((symptom) => (
                  <Badge 
                    key={symptom} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-[#1A5F7A]/10"
                    onClick={() => addSymptom(symptom)}
                  >
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={resetForm}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={generateRecommendations}
            disabled={loading || (inputMode === "basic" ? !searchQuery : (!animalType && !symptoms))}
            className="bg-[#086D38] hover:bg-[#1A5F7A]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recommendations
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      {recommendations.length > 0 && (
        <div className="p-4 pt-0">
          <h3 className="text-lg font-medium text-[#1A5F7A] mb-3 flex items-center">
            <Check className="h-5 w-5 mr-2 text-green-500" />
            Recommended Products
          </h3>
          
          <div className="space-y-4">
            {recommendations.map((product, index) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {product.category === "veterinary-pharmaceuticals" ? (
                      <Pill className="h-8 w-8 mr-3 text-[#086D38]" />
                    ) : product.category === "nutritional-supplements" ? (
                      <FlaskConical className="h-8 w-8 mr-3 text-[#0097B2]" />
                    ) : (
                      <Beaker className="h-8 w-8 mr-3 text-[#FF8C42]" />
                    )}
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.productNumber}</p>
                    </div>
                  </div>
                  <Badge className="bg-[#1A5F7A]">{product.price}</Badge>
                </div>
                
                <p className="text-sm my-2">{product.description?.substring(0, 120)}...</p>
                
                <div className="bg-[#F8FAFC] p-3 rounded-md mt-2 mb-3 border border-[#E2E8F0]">
                  <div className="flex items-start">
                    <Sparkles className="h-4 w-4 mr-2 text-[#0097B2] mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{reasonings[index]}</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white"
                  onClick={() => onSelectProduct(product)}
                >
                  View Product Details
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIRecommendation;