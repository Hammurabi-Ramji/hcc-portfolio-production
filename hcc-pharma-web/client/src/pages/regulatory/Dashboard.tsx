import { PortalLayout } from "@/components/PortalLayout";
import { regulatoryPortalNavigation } from "@/lib/portal-navigation";

export default function RegulatoryDashboard() {
  return (
    <PortalLayout title="Regulatory Portal" navigation={regulatoryPortalNavigation}>
      <h1 className="text-3xl font-bold">Regulatory Dashboard</h1>
    </PortalLayout>
  );
}
