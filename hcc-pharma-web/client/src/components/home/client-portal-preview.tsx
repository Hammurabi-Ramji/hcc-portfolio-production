import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle, User } from "lucide-react";

const ClientPortalPreview = () => {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-[#1A5F7A] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-medium mb-4">Streamline Your Ordering Process</h2>
              <p className="text-lg text-gray-200 mb-6">
                Access our new client portal to place orders, track shipments, access technical documentation, and manage your account - all in one convenient location.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="text-[#FF8C42] mt-1 mr-3 h-5 w-5" />
                  <span>Easy ordering and reordering of products</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#FF8C42] mt-1 mr-3 h-5 w-5" />
                  <span>Real-time order status and shipment tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#FF8C42] mt-1 mr-3 h-5 w-5" />
                  <span>Access to product documentation and certificates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="text-[#FF8C42] mt-1 mr-3 h-5 w-5" />
                  <span>Account management and order history</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link href="/client-portal">
                    <Button className="px-6 py-3 bg-[#FF8C42] hover:bg-white hover:text-[#1A5F7A] text-white rounded-md transition-colors duration-200 font-medium">
                      Sign In to Portal
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <Button className="px-6 py-3 bg-[#FF8C42] hover:bg-white hover:text-[#1A5F7A] text-white rounded-md transition-colors duration-200 font-medium">
                      Sign In to Portal
                    </Button>
                  </Link>
                )}
                <Link href="/auth">
                  <Button variant="outline" className="px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1A5F7A] rounded-md transition-colors duration-200 font-medium">
                    Request Account
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Mock Portal Interface */}
                <div className="bg-gray-100 px-4 py-3 flex items-center border-b border-gray-200">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <div className="ml-4 text-gray-600 text-sm">Radix Laboratories Client Portal</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-[#1A5F7A] rounded-full flex items-center justify-center text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-[#1A5F7A] font-medium">Welcome back</p>
                      <p className="text-gray-600 text-sm">Veterinary Clinic Account</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-100 p-4 rounded">
                      <p className="text-sm text-gray-600">Recent Orders</p>
                      <p className="text-2xl font-medium text-[#1A5F7A]">12</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                      <p className="text-sm text-gray-600">Pending Shipments</p>
                      <p className="text-2xl font-medium text-[#086D38]">3</p>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-md p-4 mb-6">
                    <h4 className="font-medium text-[#1A5F7A] mb-2">Quick Reorder</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-sm">Calcium Solution 23%</span>
                        <button className="text-xs bg-[#0097B2] text-white px-2 py-1 rounded">Add</button>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-sm">Phosphorus Supplement</span>
                        <button className="text-xs bg-[#0097B2] text-white px-2 py-1 rounded">Add</button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Dextrose Solution 50%</span>
                        <button className="text-xs bg-[#0097B2] text-white px-2 py-1 rounded">Add</button>
                      </div>
                    </div>
                  </div>
                  <Link href="/client-portal">
                    <Button className="w-full bg-[#FF8C42] hover:bg-[#086D38] text-white py-2 rounded transition-colors duration-200">
                      View All Products
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientPortalPreview;
