import { PortalLayout } from "@/components/PortalLayout";
import { TrendingUp, Users, Building2, Package } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
  { label: "Vendors", href: "/admin/vendors", icon: <Building2 className="h-4 w-4" /> },
  { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  return (
    <PortalLayout title="Admin Portal" navigation={navigation}>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
    </PortalLayout>
  );
}
