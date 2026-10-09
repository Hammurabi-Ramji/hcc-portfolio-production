import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const QualityPage = () => {
  return (
    <>
      <Helmet>
        <title>Quality Standards - Radix Laboratories Inc.</title>
        <meta name="description" content="Learn about Radix Laboratories' commitment to quality control, testing protocols, certifications, and stability testing for veterinary pharmaceuticals." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1579154341098-e4e158cc7f55?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=500&q=80" 
                alt="Quality control laboratory" 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
            <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
                  Our Quality Standards
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  Every batch tested to meet pharmaceutical standards, ensuring consistent quality and efficacy
                </p>
              </div>
            </div>
          </section>
          
          {/* Quality Overview */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Commitment to Excellence</h2>
                <p className="text-lg text-gray-600">
                  At Radix Laboratories, quality is not just a department—it's a commitment that permeates every aspect of our operation. Our comprehensive quality assurance program ensures that every product meets the highest standards of safety, efficacy, and consistency.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[#F5F7FA] border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-[#1A5F7A]" />
                    </div>
                    <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">Raw Material Testing</h3>
                    <p className="text-gray-600">
                      Every incoming material is rigorously tested for identity, purity, and compliance with specifications.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#F5F7FA] border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#0097B2]/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-[#0097B2]" />
                    </div>
                    <h3 className="text-xl font-medium text-[#0097B2] mb-2">In-Process Controls</h3>
                    <p className="text-gray-600">
                      Multiple checkpoints throughout manufacturing ensure consistent quality during production.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#F5F7FA] border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#086D38]/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-[#086D38]" />
                    </div>
                    <h3 className="text-xl font-medium text-[#086D38] mb-2">Finished Product Testing</h3>
                    <p className="text-gray-600">
                      Comprehensive testing of each batch ensures compliance with product and USP specifications.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-[#F5F7FA] border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#FF8C42]/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-[#FF8C42]" />
                    </div>
                    <h3 className="text-xl font-medium text-[#FF8C42] mb-2">Documentation</h3>
                    <p className="text-gray-600">
                      Detailed records and Certificates of Analysis provide complete traceability for every product.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* Quality Control */}
          <section id="quality-control" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Quality Control</h2>
                  <p className="text-gray-600 mb-4">
                    Our state-of-the-art Quality Control laboratory is equipped with advanced analytical equipment and staffed by experienced scientists who ensure that every product meets or exceeds specifications.
                  </p>
                  <p className="text-gray-600 mb-6">
                    You can have full confidence in our products, because at Radix Laboratories we take the time to test every batch to meet pharmaceutical standards. The quality and purity of all our products are guaranteed, or we refund the purchase price.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Chemical analysis for potency and purity</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Microbiological testing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Physical property testing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Stability and shelf-life verification</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Quality Control Laboratory" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Testing Protocols */}
          <section id="testing-protocols" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-last lg:order-first">
                  <img 
                    src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Testing Protocols" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Testing Protocols</h2>
                  <p className="text-gray-600 mb-4">
                    Our testing protocols are designed to ensure comprehensive quality verification at every stage of production. We follow USP standards and industry best practices to maintain the highest level of quality control.
                  </p>
                  <p className="text-gray-600 mb-6">
                    Radix biologically tests every batch for compliance to product and USP specifications. Biological testing is performed in our state-of-the-art facility. Certificates of Analysis are available upon request.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Raw material identification and verification</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>In-process monitoring and testing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Finished product testing according to specifications</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Release testing and documentation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          
          {/* Certifications */}
          <section id="certifications" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center mb-12">
                <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Certifications & Compliance</h2>
                <p className="text-lg text-gray-600">
                  Radix Laboratories maintains all necessary certifications and registrations to ensure compliance with regulatory requirements.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-[#1A5F7A]">FDA</span>
                    </div>
                    <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">FDA Registration</h3>
                    <p className="text-gray-600">
                      Registered with the US Food and Drug Administration as a pharmaceutical manufacturer.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-[#1A5F7A]">cGMP</span>
                    </div>
                    <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">cGMP Compliance</h3>
                    <p className="text-gray-600">
                      Operations adhere to Current Good Manufacturing Practices as required by regulations.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-[#1A5F7A]">QMS</span>
                    </div>
                    <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">Quality Management System</h3>
                    <p className="text-gray-600">
                      Comprehensive quality management system ensuring consistency and traceability.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* Stability Testing */}
          <section id="stability-testing" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Stability Testing</h2>
                  <p className="text-gray-600 mb-4">
                    Our stability testing program ensures that products maintain their quality, safety, and efficacy throughout their intended shelf life. We conduct both accelerated and long-term stability studies to establish appropriate storage conditions and expiration dating.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Accelerated stability studies under stress conditions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Long-term stability monitoring at controlled conditions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>In-use stability testing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Packaging compatibility studies</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-[#086D38] mt-1 mr-2" />
                      <span>Stability report generation for regulatory submissions</span>
                    </li>
                  </ul>
                  <Button className="bg-[#FF8C42] hover:bg-[#086D38]">
                    Learn More About Our Stability Program
                  </Button>
                </div>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Stability Testing" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Call to Action */}
          <section className="py-16 bg-[#1A5F7A] text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-medium mb-4">Experience the Radix Quality Difference</h2>
              <p className="text-lg text-gray-200 mb-8 max-w-3xl mx-auto">
                Contact us to learn more about our quality standards and how they benefit your products.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-[#FF8C42] hover:bg-white hover:text-[#1A5F7A]">
                  Request Quality Documentation
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#1A5F7A]">
                  Schedule a Facility Tour
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

export default QualityPage;
