import { PortalLayout } from "@/components/PortalLayout";
import { TrendingUp, FileText } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/vendor", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Purchase Orders", href: "/vendor/purchase-orders", icon: <FileText className="h-4 w-4" /> },
];

export default function VendorDashboard() {
  return (
    <PortalLayout title="Vendor Portal" navigation={navigation}>
      <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
    </PortalLayout>
  );
}
