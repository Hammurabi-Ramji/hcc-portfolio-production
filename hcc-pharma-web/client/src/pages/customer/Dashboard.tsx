import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { customerPortalNavigation } from "@/lib/portal-navigation";
import { Link } from "wouter";

export default function CustomerDashboard() {
  const { data: orders } = trpc.orders.list.useQuery({ limit: 5 });

  return (
    <PortalLayout title="Customer Portal" navigation={customerPortalNavigation}>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Customer Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>New Order</CardTitle>
              <CardDescription>Place a new product order</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client-portal/orders/new">
                <Button className="w-full">Create Order</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
