import { User } from "lucide-react";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      text: "We've been using Radix Labs products for over 10 years in our veterinary practice. The quality is consistently excellent, and their technical support is always responsive.",
      author: "Dr. Michael Johnson",
      title: "Veterinary Clinic Owner"
    },
    {
      text: "Radix's calcium solutions have been a cornerstone of our treatment protocols. The product efficacy is outstanding, and we appreciate their commitment to quality.",
      author: "Dr. Sarah Williams",
      title: "Veterinary Specialist"
    },
    {
      text: "The new client portal has transformed how we order supplies. It's intuitive and saves us significant time. Radix continues to innovate in ways that make our practice more efficient.",
      author: "Dr. James Thompson",
      title: "Large Animal Specialist"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-medium text-[#1A5F7A] mb-3">Trusted by Veterinary Professionals</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Here's what our clients have to say about our products and services.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-[#F5F7FA] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex items-center mt-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-[#1A5F7A]">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
