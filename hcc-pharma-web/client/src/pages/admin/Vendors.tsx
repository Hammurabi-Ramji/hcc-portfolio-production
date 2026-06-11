import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { CrudModal } from "@/components/CrudModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, Plus, Edit, Trash2, Loader2, Search, TrendingUp, Users, Package } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
  { label: "Vendors", href: "/admin/vendors", icon: <Building2 className="h-4 w-4" /> },
  { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
];

export default function AdminVendors() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", vendorType: "raw_material", tier: "bronze" as const,
  });

  const { data: vendors, isLoading, refetch } = trpc.vendors.list.useQuery();
  const createVendor = trpc.vendors.create.useMutation({
    onSuccess: () => { toast.success("Vendor created"); setIsModalOpen(false); refetch(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVendor.mutate({ ...formData, userId: undefined });
  };

  const filteredVendors = vendors?.filter((v: any) =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PortalLayout title="Vendor Management" navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Vendor Management
          </h1>
          <Button onClick={() => setIsModalOpen(true)} size="lg"><Plus className="h-5 w-5 mr-2" />Add Vendor</Button>
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-200">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Vendors ({filteredVendors?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : 
            filteredVendors && filteredVendors.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Type</TableHead><TableHead>Tier</TableHead><TableHead>Contact</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell><p className="font-medium">{vendor.name}</p></TableCell>
                      <TableCell><Badge variant="outline">{vendor.vendorType}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{vendor.tier}</Badge></TableCell>
                      <TableCell><span className="text-sm">{vendor.email}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <div className="text-center py-12 text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No vendors found</p></div>}
          </CardContent>
        </Card>
      </div>

      <CrudModal open={isModalOpen} onOpenChange={setIsModalOpen} title="Add New Vendor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Vendor Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
          <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
          <div><Label>Vendor Type</Label>
            <Select value={formData.vendorType} onValueChange={(val) => setFormData({ ...formData, vendorType: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="raw_material">Raw Material</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={createVendor.isPending}>
              {createVendor.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Create Vendor"}
            </Button>
          </div>
        </form>
      </CrudModal>
    </PortalLayout>
  );
}