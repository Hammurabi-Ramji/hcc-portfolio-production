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
import { Plus, Edit, Trash2, Search, CheckCircle } from "lucide-react";

type QualityTest = {
  id: number;
  testType: string;
  batchId: number;
  result: string;
  passedCriteria: boolean;
  testDate: string;
  notes?: string | null;
  createdAt: string;
};

type TestFormData = {
  testType: string;
  batchId: number;
  result: string;
  passedCriteria: boolean;
  testDate: string;
  notes?: string;
};

const resultColors: Record<string, string> = {
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  inconclusive: "bg-orange-100 text-orange-800",
};

export default function QualityTestManagementPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<QualityTest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<TestFormData>({
    testType: "",
    batchId: 0,
    result: "",
    passedCriteria: true,
    testDate: "",
    notes: "",
  });
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  // @ts-ignore
  const { data: tests, isLoading } = trpc.qualityTests.list.useQuery();
  // @ts-ignore
  const { data: batches } = trpc.manufacturingBatches.list.useQuery();
  
  // @ts-ignore
  const createMutation = trpc.qualityTests.create.useMutation({
    onMutate: async (newTest: any) => {
      // @ts-ignore
      await utils.qualityTests.list.cancel();
      // @ts-ignore
      const previousTests = utils.qualityTests.list.getData();
      
      // @ts-ignore
      utils.qualityTests.list.setData(undefined, (old: QualityTest[]) => [
        ...(old || []),
        {
          ...newTest,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        } as QualityTest,
      ]);
      
      return { previousTests };
    },
    onError: (err: any, newTest: any, context: any) => {
      // @ts-ignore
      utils.manufacturing.qualityTests.setData({ batchId: 0 }, context?.previousTests);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quality test created successfully" });
      setShowAddDialog(false);
      resetForm();
    },
    onSettled: () => {
      // @ts-ignore
      utils.manufacturing.qualityTests.invalidate();
    },
  });
  
  // @ts-ignore
  const updateMutation = trpc.qualityTests.update.useMutation({
    onMutate: async ({ id, data }: { id: number; data: any }) => {
      // @ts-ignore
      await utils.qualityTests.list.cancel();
      // @ts-ignore
      const previousTests = utils.qualityTests.list.getData();
      
      // @ts-ignore
      utils.qualityTests.list.setData(undefined, (old: QualityTest[]) =>
        old?.map((test: QualityTest) =>
          test.id === id ? { ...test, ...data } : test
        )
      );
      
      return { previousTests };
    },
    onError: (err: any, variables: any, context: any) => {
      // @ts-ignore
      utils.manufacturing.qualityTests.setData({ batchId: 0 }, context?.previousTests);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quality test updated successfully" });
      setShowEditDialog(false);
      setSelectedTest(null);
    },
    onSettled: () => {
      // @ts-ignore
      utils.manufacturing.qualityTests.invalidate();
    },
  });
  
  // @ts-ignore
  const deleteMutation = trpc.qualityTests.delete.useMutation({
    onMutate: async ({ id }: { id: number }) => {
      // @ts-ignore
      await utils.qualityTests.list.cancel();
      // @ts-ignore
      const previousTests = utils.qualityTests.list.getData();
      
      // @ts-ignore
      utils.qualityTests.list.setData(undefined, (old: QualityTest[]) =>
        old?.filter((test: QualityTest) => test.id !== id)
      );
      
      return { previousTests };
    },
    onError: (err: any, variables: any, context: any) => {
      // @ts-ignore
      utils.manufacturing.qualityTests.setData({ batchId: 0 }, context?.previousTests);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quality test deleted successfully" });
      setShowDeleteDialog(false);
      setSelectedTest(null);
    },
    onSettled: () => {
      // @ts-ignore
      utils.manufacturing.qualityTests.invalidate();
    },
  });
  
  const resetForm = () => {
    setFormData({
      testType: "",
      batchId: 0,
      result: "",
      passedCriteria: true,
      testDate: "",
      notes: "",
    });
  };
  
  const handleAdd = () => {
    if (!formData.testType || !formData.batchId || !formData.result) {
      toast({ title: "Validation Error", description: "Test type, batch, and result are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };
  
  const handleEdit = (test: QualityTest) => {
    setSelectedTest(test);
    setFormData({
      testType: test.testType,
      batchId: test.batchId,
      result: test.result,
      passedCriteria: test.passedCriteria,
      testDate: test.testDate,
      notes: test.notes || "",
    });
    setShowEditDialog(true);
  };
  
  const handleUpdate = () => {
    if (!selectedTest) return;
    if (!formData.testType || !formData.batchId || !formData.result) {
      toast({ title: "Validation Error", description: "Test type, batch, and result are required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: selectedTest.id,
      data: {
        testType: formData.testType,
        batchId: formData.batchId,
        result: formData.result,
        passedCriteria: formData.passedCriteria,
        testDate: formData.testDate,
        notes: formData.notes || null,
      },
    });
  };
  
  const handleDelete = () => {
    if (!selectedTest) return;
    deleteMutation.mutate({ id: selectedTest.id });
  };
  
  const filteredTests = tests?.filter((test: QualityTest) =>
    test.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.result.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quality tests...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Quality Tests</h1>
          <p className="text-gray-600">Manage quality control testing and results</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-[#1A5F7A] hover:bg-[#164d62]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by test type or result..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests?.map((test: QualityTest) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={resultColors[test.result.toLowerCase()] || "bg-gray-100 text-gray-800"}>
                  {test.result}
                </Badge>
                {test.passedCriteria && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <CardTitle className="text-lg">{test.testType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  Test Date: {new Date(test.testDate).toLocaleDateString()}
                </div>
                {test.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {test.notes}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(test)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTest(test);
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
        
        {filteredTests?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quality tests found</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Add Test Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Quality Test</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testType">Test Type *</Label>
              <Input
                id="testType"
                value={formData.testType}
                onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                placeholder="e.g., Sterility, Potency"
              />
            </div>
            
            <div>
              <Label htmlFor="batchId">Manufacturing Batch *</Label>
              <Select
                value={formData.batchId.toString()}
                onValueChange={(value) => setFormData({ ...formData, batchId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches?.map((batch: any) => (
                    <SelectItem key={batch.id} value={batch.id.toString()}>
                      {batch.batchNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="result">Result *</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="testDate">Test Date *</Label>
              <Input
                id="testDate"
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="passedCriteria">Passed Quality Criteria</Label>
              <Select
                value={formData.passedCriteria.toString()}
                onValueChange={(value) => setFormData({ ...formData, passedCriteria: value === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Test notes and observations"
                rows={3}
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
              {createMutation.isPending ? "Creating..." : "Create Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Test Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Quality Test</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-testType">Test Type *</Label>
              <Input
                id="edit-testType"
                value={formData.testType}
                onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-batchId">Manufacturing Batch *</Label>
              <Select
                value={formData.batchId.toString()}
                onValueChange={(value) => setFormData({ ...formData, batchId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {batches?.map((batch: any) => (
                    <SelectItem key={batch.id} value={batch.id.toString()}>
                      {batch.batchNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-result">Result *</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-testDate">Test Date *</Label>
              <Input
                id="edit-testDate"
                type="date"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-passedCriteria">Passed Quality Criteria</Label>
              <Select
                value={formData.passedCriteria.toString()}
                onValueChange={(value) => setFormData({ ...formData, passedCriteria: value === "true" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
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
              {updateMutation.isPending ? "Updating..." : "Update Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quality Test</DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600">
            Are you sure you want to delete this <strong>{selectedTest?.testType}</strong> test? This action cannot be undone.
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
