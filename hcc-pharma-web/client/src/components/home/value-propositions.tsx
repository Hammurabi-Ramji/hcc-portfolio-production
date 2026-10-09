import { 
  Beaker, 
  Tags, 
  Microscope, 
  ClipboardCheck 
} from "lucide-react";

const ValuePropositions = () => {
  const valueProps = [
    {
      icon: <ClipboardCheck className="text-2xl text-[#1A5F7A]" />,
      title: "Quality",
      description: "Robust quality system standards deliver consistent, safe products for animals",
      bgColor: "bg-[#1A5F7A]/10",
      textColor: "text-[#1A5F7A]"
    },
    {
      icon: <Tags className="text-2xl text-[#086D38]" />,
      title: "Value",
      description: "Cost-efficient procurement and manufacturing processes to provide the best price",
      bgColor: "bg-[#086D38]/10",
      textColor: "text-[#086D38]"
    },
    {
      icon: <Microscope className="text-2xl text-[#0097B2]" />,
      title: "Innovation",
      description: "Lead with science, formulating modern products sought by the marketplace",
      bgColor: "bg-[#0097B2]/10",
      textColor: "text-[#0097B2]"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A5F7A] mb-3">Core Principles</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our commitment to quality, value, and innovation drives everything we do.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {valueProps.map((prop, index) => (
            <div key={index} className="bg-[#F5F7FA] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className={`w-16 h-16 ${prop.bgColor} rounded-full flex items-center justify-center mb-4 mx-auto`}>
                {prop.icon}
              </div>
              <h3 className={`text-xl font-medium ${prop.textColor} text-center mb-3`}>{prop.title}</h3>
              <p className="text-gray-600 text-center">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositions;
