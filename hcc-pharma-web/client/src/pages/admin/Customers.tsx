import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { CrudModal } from "@/components/CrudModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Search,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Building2,
  Package
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
  { label: "Vendors", href: "/admin/vendors", icon: <Building2 className="h-4 w-4" /> },
  { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
];

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
  creditLimit: string;
}

export default function AdminCustomers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
    taxId: "",
    creditLimit: "10000.00",
  });

  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created successfully");
      setIsModalOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Customer updated successfully");
      setIsModalOpen(false);
      setEditingCustomer(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
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
      country: "USA",
      taxId: "",
      creditLimit: "10000.00",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    if (editingCustomer) {
      updateCustomer.mutate({
        id: editingCustomer.id,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        },
      });
    } else {
      createCustomer.mutate({
        userId: undefined,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        country: formData.country,
        customerType: 'clinic' as const,
        taxId: formData.taxId || undefined,
      });
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
      country: customer.country || "USA",
      taxId: customer.taxId || "",
      creditLimit: customer.creditLimit || "10000.00",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      deleteCustomer.mutate({ id });
    }
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    resetForm();
    setIsModalOpen(true);
  };

  const filteredCustomers = customers?.filter((customer: any) =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PortalLayout title="Customer Management" navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage customer accounts and information
            </p>
          </div>
          <Button onClick={handleAddNew} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-200">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Customers ({filteredCustomers?.length || 0})
            </CardTitle>
            <CardDescription>View and manage all customer accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCustomers && filteredCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.taxId && (
                            <p className="text-xs text-muted-foreground">Tax ID: {customer.taxId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.city || customer.state ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {customer.city}{customer.city && customer.state ? ", " : ""}{customer.state}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          ${parseFloat(customer.creditLimit || "0").toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CRUD Modal */}
      <CrudModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        description={editingCustomer ? "Update customer information" : "Create a new customer account"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Veterinary Clinic"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@acme.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Springfield"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="IL"
              />
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="62701"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="USA"
              />
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="12-3456789"
              />
            </div>

            <div>
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                placeholder="10000.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createCustomer.isPending || updateCustomer.isPending}
            >
              {(createCustomer.isPending || updateCustomer.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingCustomer ? "Update" : "Create"} Customer</>
              )}
            </Button>
          </div>
        </form>
      </CrudModal>
    </PortalLayout>
  );
}
