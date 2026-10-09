import { PortalLayout } from "@/components/PortalLayout";
import { customerPortalNavigation } from "@/lib/portal-navigation";

export default function CustomerOrders() {
  return (
    <PortalLayout title="Customer Portal" navigation={customerPortalNavigation}>
      <h1 className="text-3xl font-bold">My Orders</h1>
    </PortalLayout>
  );
}
