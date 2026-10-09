import React from "react";

const CompanyOverview = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A5F7A] mb-6 text-center">Committed to Animal Health Excellence</h2>
          
          <div className="space-y-6 text-gray-700">
            <p className="text-lg text-center">
              For over four decades, Radix Labs has been at the forefront of veterinary pharmaceutical innovation, developing trusted solutions that improve animal health outcomes.
            </p>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Our Mission</h3>
              <p className="text-lg mb-4">
                To advance animal health through innovative pharmaceutical solutions, supporting veterinary professionals with products that meet the highest standards of quality, safety, and efficacy.
              </p>
              <ul className="space-y-2 text-lg">
                <li className="flex items-start">
                  <span className="text-[#FF8C42] mr-2">✓</span>
                  <span>FDA inspected manufacturing facilities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF8C42] mr-2">✓</span>
                  <span>Comprehensive quality control testing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF8C42] mr-2">✓</span>
                  <span>Continuous research and innovation</span>
                </li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <h4 className="text-xl font-semibold text-[#1A5F7A] mb-3">Company Overview</h4>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Founded:</strong> 1979</li>
                  <li><strong>Location:</strong> Eau Claire, Wisconsin</li>
                  <li><strong>Status:</strong> FDA inspected and cGMP compliant</li>
                  <li><strong>Focus:</strong> Animal health products and pharmaceuticals</li>
                  <li><strong>Categories:</strong> Cattle, swine, equine, and other animals</li>
                  <li><strong>Manufacturing:</strong> Made in U.S.A.</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <h4 className="text-xl font-semibold text-[#1A5F7A] mb-3">We Serve</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#FF8C42] mr-2">•</span>
                    <span><strong>Radix branded products</strong> through trusted distributors and direct-to-customer</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF8C42] mr-2">•</span>
                    <span><strong>White labeled products</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF8C42] mr-2">•</span>
                    <span><strong>Custom formulations</strong></span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF8C42] mr-2">•</span>
                    <span><strong>Contract manufacturing</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyOverview;