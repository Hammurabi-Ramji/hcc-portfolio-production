import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Radix Laboratories Inc.</title>
        <meta name="description" content="Privacy Policy for Radix Laboratories Incorporated - Learn how we collect, use, and protect your personal information." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow bg-white">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold text-[#1A5F7A] mb-6">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Radix Laboratories Incorporated ("Radix Labs," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Information We Collect</h2>
                <p className="text-gray-700 mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Contact information (name, email address, phone number, mailing address)</li>
                  <li>Business information (company name, job title, industry)</li>
                  <li>Account credentials for our client portal</li>
                  <li>Order and transaction information</li>
                  <li>Communications and correspondence with us</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  We also automatically collect certain information when you visit our website, including IP address, browser type, device information, and usage data through cookies and similar technologies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Process and fulfill your orders and requests</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Send you product information, updates, and marketing communications</li>
                  <li>Improve our website, products, and services</li>
                  <li>Comply with legal obligations and protect our rights</li>
                  <li>Detect and prevent fraud or security issues</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Information Sharing and Disclosure</h2>
                <p className="text-gray-700 mb-4">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Service providers who assist us in operating our business</li>
                  <li>Business partners with your consent</li>
                  <li>Law enforcement or regulatory authorities when required by law</li>
                  <li>Other parties in connection with a business transaction (merger, acquisition, etc.)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Your Rights and Choices</h2>
                <p className="text-gray-700 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information (subject to legal obligations)</li>
                  <li>Opt out of marketing communications</li>
                  <li>Disable cookies through your browser settings</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Cookies and Tracking Technologies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookies through your browser settings. For more information, please see our Cookie Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Children's Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Changes to This Privacy Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us:
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

export default PrivacyPolicy;
