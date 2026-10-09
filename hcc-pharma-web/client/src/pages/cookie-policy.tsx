import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - Radix Laboratories Inc.</title>
        <meta name="description" content="Cookie Policy for Radix Laboratories Incorporated - Learn about how we use cookies and tracking technologies on our website." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow bg-white">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold text-[#1A5F7A] mb-6">Cookie Policy</h1>
            <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">What Are Cookies?</h2>
                <p className="text-gray-700 mb-4">
                  Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">How We Use Cookies</h2>
                <p className="text-gray-700 mb-4">
                  Radix Laboratories Incorporated uses cookies and similar tracking technologies to enhance your experience on our website, analyze site traffic, and understand where our visitors are coming from.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Types of Cookies We Use</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A5F7A] mb-3">Essential Cookies</h3>
                  <p className="text-gray-700 mb-2">
                    These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and authentication.
                  </p>
                  <p className="text-gray-700 italic">
                    Examples: Session cookies, security cookies, load balancing cookies
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A5F7A] mb-3">Performance Cookies</h3>
                  <p className="text-gray-700 mb-2">
                    These cookies collect information about how visitors use our website, such as which pages are visited most often. This data helps us improve how our website works.
                  </p>
                  <p className="text-gray-700 italic">
                    Examples: Analytics cookies, error tracking cookies
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A5F7A] mb-3">Functionality Cookies</h3>
                  <p className="text-gray-700 mb-2">
                    These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features.
                  </p>
                  <p className="text-gray-700 italic">
                    Examples: Preference cookies, language selection cookies
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A5F7A] mb-3">Targeting/Advertising Cookies</h3>
                  <p className="text-gray-700 mb-2">
                    These cookies are used to deliver advertisements that are relevant to you and your interests. They may also be used to limit the number of times you see an advertisement and measure the effectiveness of advertising campaigns.
                  </p>
                  <p className="text-gray-700 italic">
                    Examples: Marketing cookies, retargeting cookies
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Third-Party Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We may use third-party services that place cookies on your device to help us analyze website usage and improve our services. These third parties include:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li>Analytics providers (e.g., Google Analytics)</li>
                  <li>Social media platforms</li>
                  <li>Advertising networks</li>
                  <li>Customer support tools</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Managing Cookies</h2>
                <p className="text-gray-700 mb-4">
                  You can control and manage cookies in various ways:
                </p>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A5F7A] mb-3">Browser Settings</h3>
                  <p className="text-gray-700 mb-4">
                    Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or delete certain cookies. Please note that if you disable cookies, some features of our website may not function properly.
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-[#1A5F7A] mb-3">Opt-Out Options</h3>
                  <p className="text-gray-700 mb-4">
                    You can opt out of certain third-party cookies by visiting the following websites:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                    <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" className="text-[#0097B2] hover:underline" target="_blank" rel="noopener noreferrer">www.networkadvertising.org/choices/</a></li>
                    <li>Digital Advertising Alliance: <a href="http://www.aboutads.info/choices/" className="text-[#0097B2] hover:underline" target="_blank" rel="noopener noreferrer">www.aboutads.info/choices/</a></li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Cookie Duration</h2>
                <p className="text-gray-700 mb-4">
                  Cookies may be either "session" cookies or "persistent" cookies:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                  <li><strong>Session cookies:</strong> These are temporary and are deleted when you close your browser</li>
                  <li><strong>Persistent cookies:</strong> These remain on your device for a set period or until you delete them</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Updates to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please check this page periodically for updates.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#1A5F7A] mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have questions about our use of cookies, please contact us:
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

export default CookiePolicy;
