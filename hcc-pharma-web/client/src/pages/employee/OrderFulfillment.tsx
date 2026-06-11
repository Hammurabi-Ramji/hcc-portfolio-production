import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { trpc } from "@/lib/trpc";
import { employeePortalNavigation } from "@/lib/portal-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, XCircle, Clock, Truck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function EmployeeOrderFulfillment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOrders = filteredOrders?.filter(o => o.status === "pending" || o.status === "confirmed");
  const processingOrders = filteredOrders?.filter(o => o.status === "processing");
  const readyToShipOrders = filteredOrders?.filter(o => o.status === "processing");

  const getStatusVariant = (status: string) => {
    if (status === "delivered") {
      return "default" as const;
    }

    if (status === "shipped") {
      return "secondary" as const;
    }

    if (status === "processing") {
      return "outline" as const;
    }

    return "secondary" as const;
  };

  const handleStatusUpdate = (orderId: number, newStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled") => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleStartProcessing = (orderId: number) => {
    handleStatusUpdate(orderId, "processing");
  };

  const handleOpenShipDialog = (orderId: number) => {
    setSelectedOrder(orderId);
    setTrackingNumber("");
    setIsShipDialogOpen(true);
  };

  const handleShipOrder = () => {
    if (!selectedOrder) return;
    
    // Update order status to shipped
    handleStatusUpdate(selectedOrder, "shipped");
    setIsShipDialogOpen(false);
    setSelectedOrder(null);
    setTrackingNumber("");
  };

  const handleCancelOrder = (orderId: number) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      handleStatusUpdate(orderId, "cancelled");
    }
  };

  if (isLoading) {
    return (
      <PortalLayout title="Employee Portal" navigation={employeePortalNavigation}>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Fulfillment</CardTitle>
              <CardDescription>Loading orders...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Employee Portal" navigation={employeePortalNavigation}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Fulfillment</h1>
            <p className="text-muted-foreground">Process and ship customer orders</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processingOrders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently being processed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readyToShipOrders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for shipment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Manage order fulfillment and shipping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          ${Number(order.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {(order.status === "pending" || order.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartProcessing(order.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Start Processing
                            </Button>
                          )}
                          {order.status === "processing" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenShipDialog(order.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Ship Order
                            </Button>
                          )}
                          {(order.status === "pending" || order.status === "confirmed" || order.status === "processing") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                          {order.status === "shipped" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, "delivered")}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Delivered
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Ship Order Dialog */}
        <Dialog open={isShipDialogOpen} onOpenChange={setIsShipDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ship Order</DialogTitle>
              <DialogDescription>
                Enter shipping details to mark this order as shipped.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number (Optional)</Label>
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShipDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShipOrder}>
                Ship Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
