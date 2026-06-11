import { PortalLayout } from "@/components/PortalLayout";
import { employeePortalNavigation } from "@/lib/portal-navigation";

export default function EmployeeInventory() {
  return (
    <PortalLayout title="Employee Portal" navigation={employeePortalNavigation}>
      <h1 className="text-3xl font-bold">Inventory Management</h1>
    </PortalLayout>
  );
}
