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
import { Plus, Search, Factory, Calendar, Box, CheckCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "quality-check": "bg-purple-100 text-purple-800",
};

export default function ManufacturingManagementPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    batchNumber: "",
    productId: 0,
    quantityProduced: 0,
    startDate: "",
    notes: "",
  });
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const { data: batches, isLoading } = trpc.manufacturing.batches.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  
  const createMutation = trpc.manufacturing.createBatch.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Manufacturing batch created successfully" });
      setShowAddDialog(false);
      resetForm();
      utils.manufacturing.batches.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  
  const resetForm = () => {
    setFormData({
      batchNumber: "",
      productId: 0,
      quantityProduced: 0,
      startDate: "",
      notes: "",
    });
  };
  
  const handleAdd = () => {
    if (!formData.batchNumber || !formData.productId || formData.quantityProduced <= 0 || !formData.startDate) {
      toast({ title: "Validation Error", description: "Batch number, product, quantity, and start date are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      batchNumber: formData.batchNumber,
      productId: formData.productId,
      quantityProduced: formData.quantityProduced,
      startDate: new Date(formData.startDate),
      notes: formData.notes || undefined,
    });
  };
  
  const getProductName = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Product #${productId}`;
  };
  
  const filteredBatches = batches?.filter((batch: any) =>
    batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProductName(batch.productId).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading manufacturing batches...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Manufacturing Management</h1>
          <p className="text-gray-600">Manage manufacturing batches and production</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-[#1A5F7A] hover:bg-[#164d62]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Batch
        </Button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-800">
              {batches?.filter((b: any) => b.status === 'planned').length || 0}
            </div>
            <div className="text-sm text-blue-600">Planned</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-800">
              {batches?.filter((b: any) => b.status === 'in-progress').length || 0}
            </div>
            <div className="text-sm text-yellow-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-800">
              {batches?.filter((b: any) => b.status === 'quality-check').length || 0}
            </div>
            <div className="text-sm text-purple-600">Quality Check</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-800">
              {batches?.filter((b: any) => b.status === 'completed').length || 0}
            </div>
            <div className="text-sm text-green-600">Completed</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by batch number, status, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches?.map((batch: any) => (
          <Card key={batch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={statusColors[batch.status] || "bg-gray-100 text-gray-800"}>
                  {batch.status}
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Factory className="h-5 w-5 text-[#1A5F7A]" />
                {batch.batchNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Product:</strong> {getProductName(batch.productId)}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1A5F7A]">
                  <Box className="h-4 w-4" />
                  {batch.quantityProduced} units
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Started: {new Date(batch.startDate).toLocaleDateString()}
                </div>
                {batch.completionDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4" />
                    Completed: {new Date(batch.completionDate).toLocaleDateString()}
                  </div>
                )}
                {batch.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {batch.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredBatches?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No manufacturing batches found</p>
        </div>
      )}
      
      {/* Add Batch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Manufacturing Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Batch Number *</Label>
              <Input
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select
                value={formData.productId.toString()}
                onValueChange={(value) => setFormData({ ...formData, productId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity to Produce *</Label>
              <Input
                type="number"
                value={formData.quantityProduced || ""}
                onChange={(e) => setFormData({ ...formData, quantityProduced: parseInt(e.target.value) || 0 })}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
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
              {createMutation.isPending ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
