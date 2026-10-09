import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const QualityProcess = () => {
  const processSteps = [
    {
      number: 1,
      title: "Raw Material Testing",
      description: "All incoming materials are tested for identity, purity, and compliance with specifications.",
      bgColor: "bg-[#1A5F7A]",
      position: "md:mb-16"
    },
    {
      number: 2,
      title: "Manufacturing Process",
      description: "Production following cGMP guidelines with in-process controls and monitoring.",
      bgColor: "bg-[#0097B2]",
      position: "md:mt-16"
    },
    {
      number: 3,
      title: "Final Quality Testing",
      description: "Every batch undergoes comprehensive testing for compliance with product and USP specifications.",
      bgColor: "bg-[#086D38]",
      position: "md:mb-16"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-medium text-[#1A5F7A] mb-3">Our Quality Process</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            At Radix Laboratories, we take the time to test every batch to meet pharmaceutical standards. 
            Our stringent quality process ensures consistent, high-quality products.
          </p>
        </div>
        
        <div className="relative">
          {/* Process Steps Line */}
          <div className="hidden md:block h-1 bg-gray-200 absolute top-1/2 left-0 right-0 transform -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className={step.position}>
                  <div className={`w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center text-white mx-auto mb-4 relative z-10`}>
                    <span className="font-medium">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-medium text-[#1A5F7A] text-center mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-center">
                    {step.description}
                  </p>
                </div>
                <div className="hidden md:block h-40 w-px bg-gray-200 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/quality">
              <Button className="inline-block px-6 py-3 bg-[#1A5F7A] hover:bg-[#0097B2] text-white rounded-md transition-colors duration-200 font-medium">
                Learn More About Our Quality Process
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QualityProcess;
