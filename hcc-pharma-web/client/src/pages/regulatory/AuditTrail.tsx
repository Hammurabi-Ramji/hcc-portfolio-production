import { PortalLayout } from "@/components/PortalLayout";
import { regulatoryPortalNavigation } from "@/lib/portal-navigation";

export default function RegulatoryAuditTrail() {
  return (
    <PortalLayout title="Regulatory Portal" navigation={regulatoryPortalNavigation}>
      <h1 className="text-3xl font-bold">Audit Trail</h1>
    </PortalLayout>
  );
}
