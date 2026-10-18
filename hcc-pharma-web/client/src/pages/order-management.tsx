import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, ShoppingCart, Eye, Package } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

type OrderItem = {
  productId: number;
  quantity: number;
  notes?: string;
};

type OrderFormData = {
  orderNumber: string;
  customerId: number;
  totalAmount: string;
  shippingAddress?: string;
  notes?: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }[];
};

export default function OrderManagementPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState<OrderFormData>({
    orderNumber: `ORD-${Date.now()}`,
    customerId: 0,
    totalAmount: "0",
    shippingAddress: "",
    notes: "",
    items: [{ productId: 0, quantity: 1, unitPrice: "0", totalPrice: "0" }],
  });
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  
  const createMutation = trpc.orders.create.useMutation({
    onMutate: async (newOrder) => {
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();
      
      utils.orders.list.setData(undefined, (old: any) => [
        ...(old || []),
        { ...newOrder, id: Date.now(), orderNumber: `ORD-${Date.now()}`, status: "pending", createdAt: new Date() },
      ]);
      
      return { previousOrders };
    },
    onError: (err, newOrder, context) => {
      utils.orders.list.setData(undefined, context?.previousOrders);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order created successfully" });
      setShowCreateDialog(false);
      resetForm();
    },
    onSettled: () => {
      utils.orders.list.invalidate();
    },
  });
  
  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.orders.list.cancel();
      const previousOrders = utils.orders.list.getData();
      
      utils.orders.list.setData(undefined, (old: any) =>
        old?.map((order: any) =>
          order.id === id ? { ...order, status } : order
        )
      );
      
      return { previousOrders };
    },
    onError: (err: any, variables: any, context: any) => {
      utils.orders.list.setData(undefined, context?.previousOrders);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order status updated successfully" });
      setShowEditDialog(false);
      setSelectedOrder(null);
    },
    onSettled: () => {
      utils.orders.list.invalidate();
    },
  });
  
// Note: Delete functionality not available in API - orders should be cancelled instead
  
  const resetForm = () => {
    setFormData({
      orderNumber: `ORD-${Date.now()}`,
      customerId: 0,
      totalAmount: "0",
      shippingAddress: "",
      notes: "",
      items: [{ productId: 0, quantity: 1, unitPrice: "0", totalPrice: "0" }],
    });
  };
  
  const handleCreate = () => {
    if (formData.customerId === 0) {
      toast({ title: "Error", description: "Please select a customer", variant: "destructive" });
      return;
    }
    if (formData.items.some(item => item.productId === 0 || item.quantity <= 0)) {
      toast({ title: "Error", description: "Please fill in all order items", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };
  
  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status: newStatus as any,
    });
  };
  
  const handleDelete = () => {
    if (!selectedOrder) return;
    // Cancel the order instead of deleting
    updateStatusMutation.mutate({
      id: selectedOrder.id,
      status: "cancelled" as any,
    });
    setShowDeleteDialog(false);
  };
  
  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, unitPrice: "0", totalPrice: "0" }],
    });
  };
  
  const removeOrderItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };
  
  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate prices when product or quantity changes
    if (field === 'productId' || field === 'quantity') {
      const product = products?.find(p => p.id === newItems[index].productId);
      if (product) {
        const unitPrice = parseFloat(product.unitPrice || "0");
        const quantity = newItems[index].quantity;
        newItems[index].unitPrice = unitPrice.toFixed(2);
        newItems[index].totalPrice = (unitPrice * quantity).toFixed(2);
      }
    }
    
    // Recalculate total amount
    const totalAmount = newItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || "0"), 0);
    setFormData({ ...formData, items: newItems, totalAmount: totalAmount.toFixed(2) });
  };
  
  const getCustomerName = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || `Customer #${customerId}`;
  };
  
  const getProductName = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Product #${productId}`;
  };
  
  const filteredOrders = orders?.filter((order: any) =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCustomerName(order.customerId).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Order Management
          </h1>
          <p className="text-gray-600">Create, view, and manage customer orders</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#1A5F7A] hover:bg-[#164d62]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by order number, status, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid gap-4">
        {filteredOrders && filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-[#1A5F7A]">
                        {order.orderNumber || `Order #${order.id}`}
                      </h3>
                      <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Customer:</span> {getCustomerName(order.customerId)}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ${parseFloat(order.totalAmount || 0).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Order Date:</span>{" "}
                        {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
                      </div>
                      {order.trackingNumber && (
                        <div>
                          <span className="font-medium">Tracking:</span> {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowViewDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Status
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDeleteDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No orders found</p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-[#1A5F7A]">
                <Plus className="h-4 w-4 mr-2" />
                Create First Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={formData.customerId.toString()}
                onValueChange={(value) => setFormData({ ...formData, customerId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Order Items *</Label>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Select
                    value={item.productId.toString()}
                    onValueChange={(value) => updateOrderItem(index, "productId", parseInt(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                    className="w-24"
                    min="1"
                  />
                  {formData.items.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addOrderItem} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div>
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                placeholder="Enter shipping address"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any special instructions or notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-[#1A5F7A] hover:bg-[#164d62]"
            >
              {createMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Status Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Status</Label>
              <p className="text-sm text-gray-600 mb-4">
                Order {selectedOrder?.orderNumber || `#${selectedOrder?.id}`} - {selectedOrder?.status}
              </p>
            </div>
            <div>
              <Label>New Status</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.keys(statusColors).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    onClick={() => handleUpdateStatus(status)}
                    disabled={updateStatusMutation.isPending}
                    className="justify-start"
                  >
                    <Badge className={`${statusColors[status]} mr-2`}>
                      {status}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Order Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Order Number</Label>
                <p className="font-medium">{selectedOrder?.orderNumber || `#${selectedOrder?.id}`}</p>
              </div>
              <div>
                <Label className="text-gray-600">Status</Label>
                <Badge className={statusColors[selectedOrder?.status] || "bg-gray-100 text-gray-800"}>
                  {selectedOrder?.status}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-600">Customer</Label>
                <p className="font-medium">{getCustomerName(selectedOrder?.customerId)}</p>
              </div>
              <div>
                <Label className="text-gray-600">Total Amount</Label>
                <p className="font-medium">${parseFloat(selectedOrder?.totalAmount || 0).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-gray-600">Order Date</Label>
                <p className="font-medium">
                  {selectedOrder?.orderDate 
                    ? new Date(selectedOrder.orderDate).toLocaleDateString()
                    : new Date(selectedOrder?.createdAt).toLocaleDateString()}
                </p>
              </div>
              {selectedOrder?.trackingNumber && (
                <div>
                  <Label className="text-gray-600">Tracking Number</Label>
                  <p className="font-medium">{selectedOrder.trackingNumber}</p>
                </div>
              )}
            </div>
            {selectedOrder?.notes && (
              <div>
                <Label className="text-gray-600">Notes</Label>
                <p className="text-sm mt-1">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete order {selectedOrder?.orderNumber || `#${selectedOrder?.id}`}? 
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={updateStatusMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateStatusMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
