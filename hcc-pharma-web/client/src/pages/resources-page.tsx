import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { Document } from "@/types";
import { FileText, Download, Search, Info } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const ResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch documents from API
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });
  
  // Filter documents based on search term
  const filteredDocuments = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Group documents by type (using actual schema categories)
  const technicalDocs = filteredDocuments?.filter(doc => doc.category === 'sop');
  const specifications = filteredDocuments?.filter(doc => doc.category === 'quality_report');
  const safetyDocs = filteredDocuments?.filter(doc => doc.category === 'safety');
  const insights = filteredDocuments?.filter(doc => doc.category === 'compliance');

  return (
    <>
      <Helmet>
        <title>Resources - Radix Laboratories Inc.</title>
        <meta name="description" content="Access technical documentation, product specifications, safety data sheets, FAQs, and industry insights from Radix Laboratories." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1566836610593-62a64888a216?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=500&q=80" 
                alt="Resources and Documentation" 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
            <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
                  Resources & Documentation
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  Access technical information, product specifications, and industry insights
                </p>
              </div>
            </div>
          </section>
          
          {/* Search & Resources Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto mb-10">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    type="search" 
                    placeholder="Search resources..." 
                    className="pl-10 pr-4 py-6 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A5F7A]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <Tabs defaultValue="technical-documents" className="w-full">
                <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                  <TabsTrigger value="technical-documents">Technical Documents</TabsTrigger>
                  <TabsTrigger value="product-specifications">Product Specifications</TabsTrigger>
                  <TabsTrigger value="safety-data-sheets">Safety Data Sheets</TabsTrigger>
                  <TabsTrigger value="industry-insights">Industry Insights</TabsTrigger>
                </TabsList>
                
                <TabsContent value="technical-documents" className="mt-6">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-6" id="technical-documentation">Technical Documentation</h2>
                  
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-10 h-10 border-4 border-[#1A5F7A] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading documents...</p>
                    </div>
                  ) : technicalDocs && technicalDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {technicalDocs.map((doc) => (
                        <ResourceCard 
                          key={doc.id} 
                          title={doc.title} 
                          description={doc.description || ""} 
                          fileUrl={doc.fileUrl} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No Documents Found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? "No matching technical documents found. Try a different search term." : "Technical documents will be available soon."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="product-specifications" className="mt-6">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-6" id="product-specifications">Product Specifications</h2>
                  
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-10 h-10 border-4 border-[#1A5F7A] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading specifications...</p>
                    </div>
                  ) : specifications && specifications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {specifications.map((doc) => (
                        <ResourceCard 
                          key={doc.id} 
                          title={doc.title} 
                          description={doc.description || ""} 
                          fileUrl={doc.fileUrl} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No Specifications Found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? "No matching product specifications found. Try a different search term." : "Product specifications will be available soon."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="safety-data-sheets" className="mt-6">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-6" id="safety-data-sheets">Safety Data Sheets</h2>
                  
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-10 h-10 border-4 border-[#1A5F7A] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading safety data sheets...</p>
                    </div>
                  ) : safetyDocs && safetyDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {safetyDocs.map((doc) => (
                        <ResourceCard 
                          key={doc.id} 
                          title={doc.title} 
                          description={doc.description || ""} 
                          fileUrl={doc.fileUrl} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No Safety Data Sheets Found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? "No matching safety data sheets found. Try a different search term." : "Safety data sheets will be available soon."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="industry-insights" className="mt-6">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-6" id="industry-insights">Industry Insights</h2>
                  
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-10 h-10 border-4 border-[#1A5F7A] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading industry insights...</p>
                    </div>
                  ) : insights && insights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {insights.map((doc) => (
                        <ResourceCard 
                          key={doc.id} 
                          title={doc.title} 
                          description={doc.description || ""} 
                          fileUrl={doc.fileUrl} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No Industry Insights Found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? "No matching industry insights found. Try a different search term." : "Industry insights will be available soon."}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </section>
          
          {/* FAQs Section */}
          <section className="py-16 bg-gray-50" id="faqs">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-medium text-[#1A5F7A] mb-8 text-center">Frequently Asked Questions</h2>
                
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">What documentation is provided with your products?</h3>
                      <p className="text-gray-600">
                        All Radix Laboratories products are shipped with comprehensive documentation including a Certificate of Analysis. Additional documentation such as Safety Data Sheets and detailed specifications are available upon request or through our client portal.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">How can I request a Certificate of Analysis?</h3>
                      <p className="text-gray-600">
                        Certificates of Analysis (COA) can be requested through our client portal, by contacting your sales representative, or by emailing our quality department at quality@radixlabs.com with your order information.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">Are your products FDA-approved?</h3>
                      <p className="text-gray-600">
                        Radix Laboratories is an FDA-registered facility that follows Current Good Manufacturing Practices (cGMP). Our manufacturing processes and quality systems meet regulatory requirements for veterinary pharmaceuticals.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">What is the shelf life of your products?</h3>
                      <p className="text-gray-600">
                        The shelf life varies by product. Each product is labeled with an expiration date based on stability testing. Specific shelf life information can be found on product packaging, in the accompanying documentation, or by contacting our quality department.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">Can you provide custom formulations?</h3>
                      <p className="text-gray-600">
                        Yes, Radix Laboratories offers custom formulation development services. Our R&D team can work with you to develop formulations that meet your specific requirements. Contact us to discuss your needs and request a consultation.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
          
          {/* Contact CTA */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-medium text-[#1A5F7A] mb-4">Need Additional Information?</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Our technical support team is available to answer your questions and provide additional resources.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-[#FF8C42] hover:bg-[#086D38]">Contact Technical Support</Button>
                <Button variant="outline" className="border-[#1A5F7A] text-[#1A5F7A] hover:bg-[#1A5F7A] hover:text-white">
                  Request Custom Documentation
                </Button>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

// Resource Card Component
const ResourceCard = ({ title, description, fileUrl }: { title: string; description: string; fileUrl?: string }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start">
            <div className="mr-4">
              <div className="w-10 h-10 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#1A5F7A]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">{title}</h3>
              <p className="text-gray-600 text-sm mb-4">{description}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">.pdf</span>
          <Button variant="ghost" size="sm" className="text-[#0097B2] hover:text-[#1A5F7A] flex items-center">
            Download <Download className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourcesPage;
