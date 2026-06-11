import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const ServicesPage = () => {
  return (
    <>
      <Helmet>
        <title>Services - Radix Laboratories Inc.</title>
        <meta name="description" content="Discover our range of veterinary pharmaceutical services including contract manufacturing, quality testing, formulation development, and stability studies." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1581093588401-fbb62a02f120?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=500&q=80" 
                alt="Laboratory services" 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
            <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
                  Our Services
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  Comprehensive pharmaceutical services for the veterinary industry
                </p>
              </div>
            </div>
          </section>
          
          {/* Contract Manufacturing */}
          <section id="contract-manufacturing" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-sm text-[#0097B2] font-medium uppercase tracking-wider">Services</span>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mt-2 mb-4">Contract Manufacturing</h2>
                  <p className="text-gray-600 mb-4">
                    Our state-of-the-art cGMP-compliant manufacturing facility offers comprehensive contract manufacturing services for veterinary pharmaceutical and nutritional products.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Custom formulation development to your specifications</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Scalable production capabilities from small to large batches</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Comprehensive quality testing and documentation</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Packaging and labeling solutions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Private labeling options</span>
                    </li>
                  </ul>
                  <Button className="bg-[#FF8C42] hover:bg-[#086D38]">
                    Request Manufacturing Quote
                  </Button>
                </div>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1579154341098-e4e158cc7f55?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Contract Manufacturing" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Quality Testing */}
          <section id="quality-testing" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-last lg:order-first">
                  <img 
                    src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Quality Testing" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div>
                  <span className="text-sm text-[#0097B2] font-medium uppercase tracking-wider">Services</span>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mt-2 mb-4">Quality Testing</h2>
                  <p className="text-gray-600 mb-4">
                    Our comprehensive quality testing services ensure that your products meet the highest standards of safety, efficacy, and compliance.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Raw material testing and verification</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>In-process quality control</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Finished product testing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Biological and chemical analysis</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Certificate of Analysis generation</span>
                    </li>
                  </ul>
                  <Button className="bg-[#FF8C42] hover:bg-[#086D38]">
                    Learn More About Testing
                  </Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Formulation Development */}
          <section id="formulation-development" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="text-sm text-[#0097B2] font-medium uppercase tracking-wider">Services</span>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mt-2 mb-4">Formulation Development</h2>
                  <p className="text-gray-600 mb-4">
                    Our experienced R&D team works closely with clients to develop innovative formulations that address specific veterinary needs.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Custom formulation for specific applications</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Reformulation of existing products for improved efficacy</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Consultation on ingredient selection and compatibility</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Development of specialized delivery systems</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Pilot batch production and testing</span>
                    </li>
                  </ul>
                  <Button className="bg-[#FF8C42] hover:bg-[#086D38]">
                    Discuss Your Formulation Needs
                  </Button>
                </div>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1584444527303-9d66a8947f89?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Formulation Development" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Stability Studies */}
          <section id="stability-studies" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-last lg:order-first">
                  <img 
                    src="https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Stability Studies" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div>
                  <span className="text-sm text-[#0097B2] font-medium uppercase tracking-wider">Services</span>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mt-2 mb-4">Stability Studies</h2>
                  <p className="text-gray-600 mb-4">
                    Our comprehensive stability testing program provides critical data on product shelf life and storage requirements.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Accelerated stability testing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Long-term stability monitoring</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Environmental condition testing (temperature, humidity)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Packaging compatibility studies</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Detailed stability reports and documentation</span>
                    </li>
                  </ul>
                  <Button className="bg-[#FF8C42] hover:bg-[#086D38]">
                    Inquire About Stability Testing
                  </Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Call to Action */}
          <section className="py-16 bg-[#1A5F7A] text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-medium mb-4">Ready to Partner with Radix Laboratories?</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-3xl mx-auto">
                Our team is ready to discuss how our comprehensive services can meet your veterinary pharmaceutical needs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-[#FF8C42] hover:bg-white hover:text-[#1A5F7A]">
                  Schedule a Consultation
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#1A5F7A]">
                  Download Service Brochure
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

export default ServicesPage;
