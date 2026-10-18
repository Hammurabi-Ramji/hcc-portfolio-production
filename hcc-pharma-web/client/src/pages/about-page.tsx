import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>About Us - Radix Laboratories Inc.</title>
        <meta name="description" content="Learn about Radix Laboratories, established in 1979 and headquartered in Eau Claire, Wisconsin, specializing in manufacturing high-quality non-sterile pharmaceutical and nutritional veterinary products." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1581093588401-fbb62a02f120?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=600&q=80" 
                alt="Radix Laboratories facility" 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
            <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
                  About Radix Laboratories
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  A trusted name in veterinary pharmaceuticals since 1979
                </p>
              </div>
            </div>
          </section>
          
          {/* Our Story Section */}
          <section id="our-story" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Our Story</h2>
                  <p className="text-gray-600 mb-4">
                    Established in 1979, Radix Laboratories has grown from a small pharmaceutical operation to a leading provider of high-quality veterinary products. Based in Eau Claire, Wisconsin, our 31,300 square foot cGMP-compliant facility serves as the hub for our manufacturing, research, and quality testing operations.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Radix Laboratories is dedicated and committed to strengthening customer-to-company bonds, through continuous improvements to current and future products, with a goal of providing customers the highest quality pharmaceutical and nutritional products at affordable prices.
                  </p>
                  <p className="text-gray-600">
                    Our nationwide customer base of approximately 300 clients, primarily veterinary clinics, relies on us for a diverse range of pharmaceutical, nutritional, and cosmetic products.
                  </p>
                </div>
                <div className="order-first lg:order-last">
                  <img 
                    src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Radix Laboratories history" 
                    className="rounded-lg shadow-lg w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Facilities Section */}
          <section id="facilities" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-medium text-[#1A5F7A] mb-3">Our Facilities</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Our state-of-the-art manufacturing facility is designed to meet the highest standards of pharmaceutical production.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1581093450021-4a7360e9a560?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Manufacturing Area" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">Manufacturing Area</h3>
                    <p className="text-gray-600">
                      Our 31,300 square foot facility houses advanced manufacturing equipment capable of producing a wide range of pharmaceutical formulations.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1579154341098-e4e158cc7f55?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Quality Control Laboratory" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">Quality Control Laboratory</h3>
                    <p className="text-gray-600">
                      Our state-of-the-art QC lab ensures that every product meets or exceeds pharmaceutical standards through rigorous testing protocols.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1584444527303-9d66a8947f89?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Research & Development Center" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-[#1A5F7A] mb-2">Research & Development Center</h3>
                    <p className="text-gray-600">
                      Our R&D facilities enable continuous innovation and development of new formulations to meet evolving veterinary needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Leadership Section (stub) */}
          <section id="leadership" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-medium text-[#1A5F7A] mb-8 text-center">Our Leadership</h2>
              <p className="text-center text-gray-600 mb-8">
                Radix Laboratories is led by an experienced team of pharmaceutical professionals dedicated to quality and innovation.
              </p>
              {/* Leadership team would be displayed here */}
            </div>
          </section>
          
          {/* Quality Assurance Section */}
          <section id="quality-assurance" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1566836610593-62a64888a216?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="Quality Assurance Process" 
                    className="rounded-lg shadow-lg w-full h-auto"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">Quality Assurance</h2>
                  <p className="text-gray-600 mb-4">
                    At Radix Laboratories, quality is not just a department—it's a commitment that permeates every aspect of our operation. Our comprehensive quality assurance program ensures that every product meets the highest standards of safety, efficacy, and consistency.
                  </p>
                  <p className="text-gray-600 mb-4">
                    You can have full confidence in our products, because at Radix Laboratories we take the time to test every batch to meet pharmaceutical standards. The quality and purity of all our products are guaranteed, or we refund the purchase price.
                  </p>
                  <p className="text-gray-600">
                    Radix biologically tests every batch for compliance to product and USP specifications. Biological testing is performed in our state-of-the-art facility. Certificates of Analysis are available upon request.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* cGMP Compliance Section */}
          <section id="cgmp-compliance" className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="order-last lg:order-first">
                  <h2 className="text-3xl font-medium text-[#1A5F7A] mb-4">cGMP Compliance</h2>
                  <p className="text-gray-600 mb-4">
                    As an FDA-registered facility, Radix Laboratories strictly adheres to Current Good Manufacturing Practices (cGMP) in all our operations. These federally mandated standards ensure that our products are consistently produced according to quality standards.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our cGMP compliance encompasses everything from facility design and equipment validation to personnel training and documentation practices. Regular audits and continuous monitoring help us maintain and improve our compliance status.
                  </p>
                  <p className="text-gray-600">
                    This commitment to regulatory compliance gives our customers confidence that every Radix product meets the highest standards of quality and safety required for veterinary use.
                  </p>
                </div>
                <div>
                  <img 
                    src="https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                    alt="cGMP Compliant Manufacturing" 
                    className="rounded-lg shadow-lg w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AboutPage;
