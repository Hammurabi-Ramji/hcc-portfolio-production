import { PortalLayout } from "@/components/PortalLayout";
import { employeePortalNavigation } from "@/lib/portal-navigation";

export default function EmployeeManufacturing() {
  return (
    <PortalLayout title="Employee Portal" navigation={employeePortalNavigation}>
      <h1 className="text-3xl font-bold">Manufacturing Batches</h1>
    </PortalLayout>
  );
}
