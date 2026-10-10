import { PortalLayout } from "@/components/PortalLayout";
import { employeePortalNavigation } from "@/lib/portal-navigation";

export default function EmployeeDeviations() {
  return (
    <PortalLayout title="Employee Portal" navigation={employeePortalNavigation}>
      <h1 className="text-3xl font-bold">Deviation Management</h1>
    </PortalLayout>
  );
}
