import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { CrudModal } from "@/components/CrudModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Package, Plus, Edit, Loader2, Search, TrendingUp, Users, Building2 } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
  { label: "Vendors", href: "/admin/vendors", icon: <Building2 className="h-4 w-4" /> },
  { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
];

export default function AdminProducts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "", sku: "", description: "", category: "pharmaceutical", ndc: "", unitPrice: "0.00", unitOfMeasure: "unit",
  });

  const { data: products, isLoading, refetch } = trpc.products.list.useQuery();
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("Product created"); setIsModalOpen(false); refetch(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(formData);
  };

  const filteredProducts = products?.filter((p: any) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PortalLayout title="Product Management" navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Product Management</h1>
          <Button onClick={() => setIsModalOpen(true)} size="lg"><Plus className="h-5 w-5 mr-2" />Add Product</Button>
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-200">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Products ({filteredProducts?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
            filteredProducts && filteredProducts.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell><p className="font-medium">{product.name}</p></TableCell>
                      <TableCell><span className="font-mono text-sm">{product.sku}</span></TableCell>
                      <TableCell><span className="text-sm">{product.category}</span></TableCell>
                      <TableCell><span className="font-mono">${parseFloat(product.unitPrice).toFixed(2)}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <div className="text-center py-12 text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No products found</p></div>}
          </CardContent>
        </Card>
      </div>

      <CrudModal open={isModalOpen} onOpenChange={setIsModalOpen} title="Add New Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Product Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SKU *</Label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required /></div>
            <div><Label>NDC</Label><Input value={formData.ndc} onChange={(e) => setFormData({ ...formData, ndc: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Category</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
            <div><Label>Unit Price *</Label><Input type="number" step="0.01" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} required /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={createProduct.isPending}>
              {createProduct.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Create Product"}
            </Button>
          </div>
        </form>
      </CrudModal>
    </PortalLayout>
  );
}