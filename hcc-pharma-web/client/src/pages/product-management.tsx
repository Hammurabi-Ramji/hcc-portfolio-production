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
import { Plus, Edit, Trash2, Search, Package, DollarSign, Tag } from "lucide-react";

type Product = {
  id: number;
  name: string;
  sku: string;
  description?: string | null;
  category: string;
  ndc?: string | null;
  unitPrice: string;
  imageUrl?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string | Date;
};

type ProductFormData = {
  name: string;
  sku: string;
  description?: string;
  category: string;
  subcategory?: string;
  ndc?: string;
  productNumber?: string;
  size?: string;
  specifications?: string;
  activeIngredients?: string;
  dosageForm?: string;
  strength?: string;
  imageUrl?: string;
  unitPrice: string;
  unitOfMeasure: string;
  storageConditions?: string;
  shelfLifeDays?: number;
  isActive: boolean;
  isFeatured: boolean;
};

export default function ProductManagementPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    category: "Large Animal",
    subcategory: "",
    ndc: "",
    productNumber: "",
    size: "",
    specifications: "",
    activeIngredients: "",
    dosageForm: "",
    strength: "",
    imageUrl: "",
    unitPrice: "",
    unitOfMeasure: "unit",
    storageConditions: "",
    shelfLifeDays: undefined,
    isActive: true,
    isFeatured: false,
  });
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const { data: products, isLoading } = trpc.products.list.useQuery();
  
  const createMutation = trpc.products.create.useMutation({
    onMutate: async (newProduct) => {
      await utils.products.list.cancel();
      const previousProducts = utils.products.list.getData();
      
      // @ts-ignore
      utils.products.list.setData(undefined, (old: any) => [
        ...(old || []),
        { ...newProduct, id: Date.now(), createdAt: new Date().toISOString() },
      ]);
      
      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      utils.products.list.setData(undefined, context?.previousProducts);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onSettled: () => {
      utils.products.list.invalidate();
    },
  });
  
  const updateMutation = trpc.products.update.useMutation({
    onMutate: async ({ id, data }) => {
      await utils.products.list.cancel();
      const previousProducts = utils.products.list.getData();
      
      utils.products.list.setData(undefined, (old) =>
        old?.map((product) =>
          product.id === id ? { ...product, ...data } : product
        )
      );
      
      return { previousProducts };
    },
    onError: (err, variables, context) => {
      utils.products.list.setData(undefined, context?.previousProducts);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product updated successfully" });
      setShowEditDialog(false);
      setSelectedProduct(null);
    },
    onSettled: () => {
      utils.products.list.invalidate();
    },
  });
  
  const deleteMutation = trpc.products.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.products.list.cancel();
      const previousProducts = utils.products.list.getData();
      
      utils.products.list.setData(undefined, (old) =>
        old?.filter((product) => product.id !== id)
      );
      
      return { previousProducts };
    },
    onError: (err, variables, context) => {
      utils.products.list.setData(undefined, context?.previousProducts);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Product deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    },
    onSettled: () => {
      utils.products.list.invalidate();
    },
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      category: "Large Animal",
      subcategory: "",
      ndc: "",
      productNumber: "",
      size: "",
      specifications: "",
      activeIngredients: "",
      dosageForm: "",
      strength: "",
      imageUrl: "",
      unitPrice: "",
      unitOfMeasure: "unit",
      storageConditions: "",
      shelfLifeDays: undefined,
      isActive: true,
      isFeatured: false,
    });
  };
  
  const handleAdd = () => {
    if (!formData.name || !formData.sku || !formData.unitPrice) {
      toast({ title: "Validation Error", description: "Name, SKU, and price are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };
  
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      category: product.category,
      subcategory: "",
      ndc: product.ndc || "",
      productNumber: "",
      size: "",
      specifications: "",
      activeIngredients: "",
      dosageForm: "",
      strength: "",
      imageUrl: product.imageUrl || "",
      unitPrice: product.unitPrice,
      unitOfMeasure: "unit",
      storageConditions: "",
      shelfLifeDays: undefined,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = () => {
    if (!selectedProduct) return;
    if (!formData.name || !formData.sku || !formData.unitPrice) {
      toast({ title: "Validation Error", description: "Name, SKU, and price are required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: selectedProduct.id,
      data: {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        ndc: formData.ndc,
        unitPrice: formData.unitPrice,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      },
    });
  };
  
  const handleDelete = () => {
    if (!selectedProduct) return;
    deleteMutation.mutate({ id: selectedProduct.id });
  };
  
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.ndc && product.ndc.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-[#1A5F7A] hover:bg-[#164d62]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by name, SKU, or NDC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts?.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                {product.isFeatured && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                    Featured
                  </Badge>
                )}
              </div>
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-[#1A5F7A]" />
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="h-4 w-4" />
                  SKU: {product.sku}
                </div>
                {product.ndc && (
                  <div className="text-sm text-gray-600">
                    NDC: {product.ndc}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1A5F7A]">
                  <DollarSign className="h-4 w-4" />
                  ${parseFloat(product.unitPrice).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  Category: {product.category}
                </div>
                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
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
        
        {filteredProducts?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products found</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PROD-001"
              />
            </div>
            
            <div>
              <Label htmlFor="ndc">NDC Code</Label>
              <Input
                id="ndc"
                value={formData.ndc}
                onChange={(e) => setFormData({ ...formData, ndc: e.target.value })}
                placeholder="XXXXX-XXX-XX"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Large Animal">Large Animal</SelectItem>
                  <SelectItem value="Small Animal">Small Animal</SelectItem>
                  <SelectItem value="Nutritional Supplements">Nutritional Supplements</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <Label htmlFor="activeIngredients">Active Ingredients</Label>
              <Input
                id="activeIngredients"
                value={formData.activeIngredients}
                onChange={(e) => setFormData({ ...formData, activeIngredients: e.target.value })}
                placeholder="e.g., Calcium Gluconate"
              />
            </div>
            
            <div>
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g., 23% w/v"
              />
            </div>
            
            <div className="flex items-center gap-4">
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
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isFeatured" className="cursor-pointer">Featured</Label>
              </div>
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
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-ndc">NDC Code</Label>
              <Input
                id="edit-ndc"
                value={formData.ndc}
                onChange={(e) => setFormData({ ...formData, ndc: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Large Animal">Large Animal</SelectItem>
                  <SelectItem value="Small Animal">Small Animal</SelectItem>
                  <SelectItem value="Nutritional Supplements">Nutritional Supplements</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-unitPrice">Unit Price *</Label>
              <Input
                id="edit-unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
            
            <div className="flex items-center gap-4">
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
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-isFeatured" className="cursor-pointer">Featured</Label>
              </div>
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
              {updateMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
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
