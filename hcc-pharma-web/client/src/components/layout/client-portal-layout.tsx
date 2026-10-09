import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  Clipboard,
  FlaskConical,
  BarChart3,
  DollarSign,
  Truck
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClientPortalLayoutProps {
  children: ReactNode;
}

const ClientPortalLayout = ({ children }: ClientPortalLayoutProps) => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Close sidebar on navigation if mobile
  const handleNavigation = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.name || "User".charAt(0)}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex-grow flex">
        {/* Sidebar - Mobile Toggle Button */}
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="fixed bottom-6 right-6 z-50 bg-[#1A5F7A] text-white p-3 rounded-full shadow-lg"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}
        
        {/* Sidebar */}
        <aside 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${isMobile ? 'fixed inset-y-0 left-0 z-40 w-64 shadow-lg' : 'w-64'}
            bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out
          `}
        >
          <div className="p-6">
            <h2 className="text-lg font-medium text-[#1A5F7A] mb-1">Client Portal</h2>
            <p className="text-sm text-gray-500 mb-6">Welcome, {user?.name}</p>
            
            <div className="space-y-1">
              <Link href="/client-portal" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href="/client-portal/orders" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/orders' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Orders
                </Button>
              </Link>
              
              <Link href="/client-portal/documents" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/documents' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Documents
                </Button>
              </Link>
              
              {/* New Quality Assurance Section */}
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-500 px-3">QUALITY ASSURANCE</p>
              </div>
              
              <Link href="/client-portal/quality-docs" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/quality-docs' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <Clipboard className="mr-2 h-5 w-5" />
                  QA Documents
                </Button>
              </Link>
              
              {/* New Manufacturing Section */}
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-500 px-3">MANUFACTURING</p>
              </div>
              
              <Link href="/client-portal/batches" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/batches' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <FlaskConical className="mr-2 h-5 w-5" />
                  Batches
                </Button>
              </Link>
              
              {/* New Inventory Section */}
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-500 px-3">INVENTORY</p>
              </div>
              
              <Link href="/client-portal/inventory" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/inventory' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Inventory
                </Button>
              </Link>
              
              {/* New Business Section */}
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-500 px-3">BUSINESS</p>
              </div>
              
              <Link href="/client-portal/invoices" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/invoices' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Invoices
                </Button>
              </Link>
              
              <Link href="/client-portal/shipping" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/shipping' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <Truck className="mr-2 h-5 w-5" />
                  Shipping
                </Button>
              </Link>
              
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-500 px-3">SETTINGS</p>
              </div>
              
              <Link href="/client-portal/settings" onClick={handleNavigation}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start ${location === '/client-portal/settings' ? 'bg-[#1A5F7A]/10 text-[#1A5F7A]' : ''}`}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 bg-[#1A5F7A] text-white mr-2">
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => await logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main 
          className={`flex-grow ${isMobile ? 'w-full' : sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-200 ease-in-out`}
        >
          <div className="container mx-auto px-4 pb-12">
            {children}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default ClientPortalLayout;
