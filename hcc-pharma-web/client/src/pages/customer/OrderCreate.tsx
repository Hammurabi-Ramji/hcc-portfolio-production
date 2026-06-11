import { PortalLayout } from "@/components/PortalLayout";
import { customerPortalNavigation } from "@/lib/portal-navigation";

export default function CustomerOrderCreate() {
  return (
    <PortalLayout title="Customer Portal" navigation={customerPortalNavigation}>
      <h1 className="text-3xl font-bold">Create New Order</h1>
    </PortalLayout>
  );
}
