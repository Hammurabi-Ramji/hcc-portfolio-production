const CredibilityIndicators = () => {
  const indicators = [
    {
      number: "44+",
      label: "Years in Operation"
    },
    {
      number: "FDA",
      label: "Registered Facility"
    },
    {
      number: "cGMP",
      label: "Compliant Manufacturing"
    },
    {
      number: "300+",
      label: "Veterinary Clients"
    },
    {
      number: "31,300",
      label: "sq ft Facility"
    }
  ];

  return (
    <section className="py-10 bg-gray-50 border-t border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-around items-center gap-x-8 gap-y-6">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-3xl font-medium text-[#1A5F7A] mb-1">{indicator.number}</span>
              <span className="text-gray-600 text-sm">{indicator.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CredibilityIndicators;
