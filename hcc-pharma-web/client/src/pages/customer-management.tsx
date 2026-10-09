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
import { Plus, Edit, Trash2, Search, Building2, Mail, Phone, MapPin } from "lucide-react";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  customerType: string;
  isActive: boolean;
  createdAt: string | Date;
  userId?: number | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string;
  taxId?: string | null;
  notes?: string | null;
  updatedAt?: string | Date;
};

type CustomerFormData = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  customerType: "veterinarian" | "distributor" | "clinic" | "farm" | "other";
  taxId?: string;
  isActive: boolean;
};

export default function CustomerManagementPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    customerType: "veterinarian",
    taxId: "",
    isActive: true,
  });
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const { data: customers, isLoading } = trpc.customers.list.useQuery();
  
  const createMutation = trpc.customers.create.useMutation({
    onMutate: async (newCustomer) => {
      await utils.customers.list.cancel();
      const previousCustomers = utils.customers.list.getData();
      
      utils.customers.list.setData(undefined, (old: any) => [
        ...(old || []),
        { ...newCustomer, id: Date.now(), createdAt: new Date().toISOString() },
      ]);
      
      return { previousCustomers };
    },
    onError: (err, newCustomer, context) => {
      utils.customers.list.setData(undefined, context?.previousCustomers);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onSettled: () => {
      utils.customers.list.invalidate();
    },
  });
  
  const updateMutation = trpc.customers.update.useMutation({
    onMutate: async ({ id, data }) => {
      await utils.customers.list.cancel();
      const previousCustomers = utils.customers.list.getData();
      
      utils.customers.list.setData(undefined, (old) =>
        old?.map((customer) =>
          customer.id === id ? { ...customer, ...data } : customer
        )
      );
      
      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      utils.customers.list.setData(undefined, context?.previousCustomers);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer updated successfully" });
      setShowEditDialog(false);
      setSelectedCustomer(null);
    },
    onSettled: () => {
      utils.customers.list.invalidate();
    },
  });
  
  const deleteMutation = trpc.customers.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.customers.list.cancel();
      const previousCustomers = utils.customers.list.getData();
      
      utils.customers.list.setData(undefined, (old) =>
        old?.filter((customer) => customer.id !== id)
      );
      
      return { previousCustomers };
    },
    onError: (err, variables, context) => {
      utils.customers.list.setData(undefined, context?.previousCustomers);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedCustomer(null);
    },
    onSettled: () => {
      utils.customers.list.invalidate();
    },
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      customerType: "veterinarian",
      taxId: "",
      isActive: true,
    });
  };
  
  const handleAdd = () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Validation Error", description: "Name and email are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };
  
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      city: "",
      state: "",
      zipCode: "",
      customerType: customer.customerType as any,
      taxId: "",
      isActive: customer.isActive,
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = () => {
    if (!selectedCustomer) return;
    if (!formData.name || !formData.email) {
      toast({ title: "Validation Error", description: "Name and email are required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: selectedCustomer.id,
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        isActive: formData.isActive,
      },
    });
  };
  
  const handleDelete = () => {
    if (!selectedCustomer) return;
    deleteMutation.mutate({ id: selectedCustomer.id });
  };
  
  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Customer Management</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-[#1A5F7A] hover:bg-[#164d62]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers?.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#1A5F7A]" />
                  {customer.name}
                </CardTitle>
                <Badge variant={customer.isActive ? "default" : "secondary"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {customer.address}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Type: {customer.customerType}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(customer)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowDeleteDialog(true);
                  }}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredCustomers?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No customers found</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="555-0123"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="12345"
              />
            </div>
            
            <div>
              <Label htmlFor="customerType">Customer Type</Label>
              <Select
                value={formData.customerType}
                onValueChange={(value: any) => setFormData({ ...formData, customerType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veterinarian">Veterinarian</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="farm">Farm</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="XX-XXXXXXX"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="bg-[#1A5F7A] hover:bg-[#164d62]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Company Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-[#1A5F7A] hover:bg-[#164d62]"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>? This action cannot be undone.
          </p>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
