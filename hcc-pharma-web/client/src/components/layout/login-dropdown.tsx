import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
// User types defined inline
import { ChevronDown, LogOut, User } from "lucide-react";

interface LoginDropdownProps {
  className?: string;
}

export function LoginDropdown({ className }: LoginDropdownProps) {
  const { user, logout } = useAuth();

  const userTypes = ["veterinarian", "wholesaler", "farm", "regulatory", "vendor"];
  
  const userTypeLabels = {
    veterinarian: "Veterinarian",
    wholesaler: "Wholesaler",
    farm: "Farm",
    regulatory: "Regulatory",
    vendor: "Vendor",
  };

  const handleLogout = async () => {
    await logout();
  };

  // If user is logged in, show profile and logout
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            <User className="mr-2 h-4 w-4" />
            {user.name || 'User'}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} Portal
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/my-dashboard">My Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/client-portal/dashboard">Client Portal</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/client-portal/orders">Orders</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/client-portal/documents">Documents</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If not logged in, show login and registration by user type
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <User className="mr-2 h-4 w-4" />
          Login
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Login by User Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userTypes.map((type) => (
          <DropdownMenuItem key={type} asChild>
            <Link href={`/auth?type=${type}`}>
              {userTypeLabels[type as keyof typeof userTypeLabels]} Login
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}