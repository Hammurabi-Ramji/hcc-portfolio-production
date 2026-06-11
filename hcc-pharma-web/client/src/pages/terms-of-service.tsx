import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Radix Laboratories Inc.</title>
        <meta name="description" content="Terms of Service for Radix Laboratories Incorporated - Review the terms and conditions for using our website and services." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow bg-white">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold text-[#1A5F7A] mb-6">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Agreement to Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing or using the website and services of Radix Laboratories Incorporated ("Radix Labs," "we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Use of Services</h2>
                <p className="text-gray-700 mb-4">
                  Our services are intended for veterinary professionals, farms, distributors, and other qualified entities in the animal health industry. You agree to use our services only for lawful purposes and in accordance with these Terms.
                </p>
                <p className="text-gray-700 mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Use our services in any way that violates applicable laws or regulations</li>
                  <li>Attempt to gain unauthorized access to our systems or networks</li>
                  <li>Interfere with or disrupt the operation of our services</li>
                  <li>Use automated systems to access our website without permission</li>
                  <li>Reproduce, distribute, or create derivative works from our content without authorization</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Products and Orders</h2>
                <p className="text-gray-700 mb-4">
                  All product descriptions, specifications, and pricing are subject to change without notice. We reserve the right to limit quantities, refuse orders, or discontinue products at our discretion.
                </p>
                <p className="text-gray-700 mb-4">
                  Orders are subject to acceptance and availability. We will notify you if we are unable to fulfill your order. Payment terms and shipping policies will be provided at the time of purchase.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Product Use and Compliance</h2>
                <p className="text-gray-700 mb-4">
                  Our products are manufactured for veterinary use in accordance with FDA regulations and cGMP standards. Users are responsible for ensuring proper storage, handling, and administration of products in compliance with all applicable laws and regulations.
                </p>
                <p className="text-gray-700 mb-4">
                  Product information provided on our website is for informational purposes only and does not constitute veterinary advice. Always consult with a licensed veterinarian before using any pharmaceutical products.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  All content on our website, including text, graphics, logos, images, and software, is the property of Radix Laboratories Incorporated and is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-gray-700 mb-4">
                  You may not use, reproduce, or distribute our content without our prior written permission, except as necessary to use our services for their intended purpose.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Account Security</h2>
                <p className="text-gray-700 mb-4">
                  If you create an account on our client portal, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  To the fullest extent permitted by law, Radix Laboratories Incorporated shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our services or products.
                </p>
                <p className="text-gray-700 mb-4">
                  Our total liability for any claims arising from your use of our services shall not exceed the amount you paid to us for the specific product or service giving rise to the claim.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Warranties and Disclaimers</h2>
                <p className="text-gray-700 mb-4">
                  We warrant that our products are manufactured in accordance with cGMP standards and meet the specifications stated at the time of manufacture. However, we make no other warranties, express or implied, including warranties of merchantability or fitness for a particular purpose.
                </p>
                <p className="text-gray-700 mb-4">
                  Our website and services are provided "as is" without warranties of any kind. We do not warrant that our services will be uninterrupted, error-free, or secure.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Indemnification</h2>
                <p className="text-gray-700 mb-4">
                  You agree to indemnify and hold harmless Radix Laboratories Incorporated and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Governing Law</h2>
                <p className="text-gray-700 mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of the State of Wisconsin, United States, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on our website. Your continued use of our services after such changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 font-semibold mb-2">Radix Laboratories Incorporated</p>
                  <p className="text-gray-700">1334 International Drive</p>
                  <p className="text-gray-700">Eau Claire, WI 54701</p>
                  <p className="text-gray-700 mt-2">Phone: (715) 833-0644</p>
                  <p className="text-gray-700">Email: radix@radix-labs.com</p>
                </div>
              </section>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default TermsOfService;
