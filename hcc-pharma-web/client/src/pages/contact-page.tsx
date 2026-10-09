import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { MapPin, Phone, Mail, Clock, Building, ChevronRight, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  inquiryType: z.enum(["general", "quote", "support", "partnership", "regulatory"]),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const { toast } = useToast();
  const submitInquiry = trpc.contact.submitInquiry.useMutation();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      inquiryType: "general" as const,
      subject: "",
      message: ""
    }
  });
  
  const onSubmit = async (data: ContactFormData) => {
    try {
      await submitInquiry.mutateAsync({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        company: data.company,
        subject: data.subject,
        message: data.message,
        inquiryType: data.inquiryType,
      });
      
      toast({
        title: "Thank you for your message!",
        description: "We've received your inquiry and will get back to you as soon as possible.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your inquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - Radix Laboratories Inc.</title>
        <meta name="description" content="Contact Radix Laboratories for information about our veterinary pharmaceutical products, technical support, or business inquiries." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative bg-gray-800 text-white">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=500&q=80" 
                alt="Contact Radix Laboratories" 
                className="w-full h-full object-cover opacity-40"
              />
            </div>
            <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-4">
                  Get in Touch
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  Ready to discuss our products or manufacturing services? Our team is ready to help.
                </p>
              </div>
            </div>
          </section>
          
          {/* Contact Information & Form */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Information */}
                <div className="lg:col-span-1">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-6">Contact Information</h2>
                  
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="w-10 h-10 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center">
                              <Building className="h-5 w-5 text-[#1A5F7A]" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-[#1A5F7A] mb-1">Headquarters</h3>
                            <address className="not-italic text-gray-600 text-sm">
                              1334 International Drive<br />
                              Eau Claire, WI 54701<br />
                              United States
                            </address>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="w-10 h-10 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-[#1A5F7A]" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-[#1A5F7A] mb-1">Phone</h3>
                            <p className="text-gray-600 text-sm">(715) 833-0644</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="w-10 h-10 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center">
                              <Mail className="h-5 w-5 text-[#1A5F7A]" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-[#1A5F7A] mb-1">Email</h3>
                            <p className="text-gray-600 text-sm">radix@radix-labs.com</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="w-10 h-10 bg-[#1A5F7A]/10 rounded-full flex items-center justify-center">
                              <Clock className="h-5 w-5 text-[#1A5F7A]" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-[#1A5F7A] mb-1">Business Hours</h3>
                            <p className="text-gray-600 text-sm">Monday - Friday: 8:00 AM - 5:00 PM Central</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="w-10 h-10 bg-[#FF8C42]/10 rounded-full flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-[#FF8C42]" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-[#1A5F7A] mb-1">Holiday Closures</h3>
                            <p className="text-gray-600 text-sm">Radix Laboratories observes the following holidays:</p>
                            <ul className="text-gray-600 text-sm list-disc ml-5 mt-1">
                              <li>New Year's Day (January 1)</li>
                              <li>Memorial Day (Last Monday in May)</li>
                              <li>Independence Day (July 4)</li>
                              <li>Labor Day (First Monday in September)</li>
                              <li>Thanksgiving Day (Fourth Thursday in November)</li>
                              <li>Day after Thanksgiving</li>
                              <li>Christmas Eve (December 24)</li>
                              <li>Christmas Day (December 25)</li>
                              <li>New Year's Eve (December 31)</li>
                            </ul>
                            <p className="text-gray-600 text-sm italic mt-2">
                              When a holiday falls on a weekend, the nearest weekday will be observed.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Contact Form */}
                <div className="lg:col-span-2">
                  <h2 className="text-2xl font-medium text-[#1A5F7A] mb-6">Send Us a Message</h2>
                  
                  <Card>
                    <CardContent className="p-6">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="john.doe@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="(123) 456-7890" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company/Organization (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Veterinary Clinic Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="inquiryType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Inquiry Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an inquiry type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="general">General Information</SelectItem>
                                    <SelectItem value="quote">Request a Quote</SelectItem>
                                    <SelectItem value="support">Technical Support</SelectItem>
                                    <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                                    <SelectItem value="regulatory">Regulatory/Compliance</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input placeholder="Brief subject of your inquiry" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="How can we help you?"
                                    className="min-h-[120px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full md:w-auto bg-[#FF8C42] hover:bg-[#086D38]"
                          >
                            Send Message
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
          
          {/* Quick Links */}
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-medium text-[#1A5F7A] mb-8 text-center">Quick Links</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">Request a Quote</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Get detailed pricing information for our products and services.
                    </p>
                    <Button variant="link" className="p-0 text-[#0097B2] hover:text-[#1A5F7A] flex items-center">
                      Get a Quote <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">Technical Support</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Get assistance with product usage, specifications, or troubleshooting.
                    </p>
                    <Button variant="link" className="p-0 text-[#0097B2] hover:text-[#1A5F7A] flex items-center">
                      Contact Support <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-[#1A5F7A] mb-2">Careers</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Explore job opportunities at Radix Laboratories.
                    </p>
                    <Button variant="link" className="p-0 text-[#0097B2] hover:text-[#1A5F7A] flex items-center">
                      View Openings <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* Map Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-medium text-[#1A5F7A] mb-8 text-center">Our Location</h2>
              
              <div className="max-w-5xl mx-auto">
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d45099.66004491029!2d-91.53287754441797!3d44.811054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87f8bd0fb3c80ba5%3A0x173b3e77c8c9518e!2sEau%20Claire%2C%20WI!5e0!3m2!1sen!2sus!4v1680123456789!5m2!1sen!2sus" 
                    width="100%" 
                    height="450" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Radix Laboratories Location"
                  ></iframe>
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-600 mb-4">
                    Our facility is located in Eau Claire, Wisconsin, with easy access from major highways.
                  </p>
                  <Button className="bg-[#1A5F7A] hover:bg-[#0097B2]">
                    Get Directions
                  </Button>
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

export default ContactPage;
