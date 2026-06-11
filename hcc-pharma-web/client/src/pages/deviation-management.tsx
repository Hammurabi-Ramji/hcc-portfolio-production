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
import { Plus, Search, AlertTriangle, Calendar, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-500 text-white",
  major: "bg-orange-500 text-white",
  minor: "bg-yellow-500 text-black",
};

export default function DeviationManagementPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    deviationNumber: "",
    title: "",
    description: "",
    severity: "minor" as "critical" | "major" | "minor",
    affectedBatch: "",
  });
  
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { user } = useAuth();
  
  const { data: deviations, isLoading } = trpc.deviations.list.useQuery();
  
  const createMutation = trpc.deviations.create.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Deviation created successfully" });
      setShowAddDialog(false);
      resetForm();
      utils.deviations.list.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  
  const resetForm = () => {
    setFormData({
      deviationNumber: "",
      title: "",
      description: "",
      severity: "minor",
      affectedBatch: "",
    });
  };
  
  const handleAdd = () => {
    if (!formData.deviationNumber || !formData.title || !formData.description) {
      toast({ title: "Validation Error", description: "Deviation number, title, and description are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      deviationNumber: formData.deviationNumber,
      title: formData.title,
      description: formData.description,
      severity: formData.severity,
      affectedBatch: formData.affectedBatch || undefined,
      reportedBy: user?.id || 1,
    });
  };
  
  const filteredDeviations = deviations?.filter((deviation: any) =>
    deviation.deviationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deviation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deviation.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deviation.severity.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deviations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Deviation Management</h1>
          <p className="text-gray-600">Track and manage quality deviations</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-[#1A5F7A] hover:bg-[#164d62]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Report Deviation
        </Button>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-800">
              {deviations?.filter((d: any) => d.status === 'open').length || 0}
            </div>
            <div className="text-sm text-red-600">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-800">
              {deviations?.filter((d: any) => d.status === 'investigating').length || 0}
            </div>
            <div className="text-sm text-yellow-600">Investigating</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-800">
              {deviations?.filter((d: any) => d.status === 'resolved').length || 0}
            </div>
            <div className="text-sm text-green-600">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-800">
              {deviations?.filter((d: any) => d.severity === 'critical').length || 0}
            </div>
            <div className="text-sm text-orange-600">Critical</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by deviation number, title, status, or severity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeviations?.map((deviation: any) => (
          <Card key={deviation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={statusColors[deviation.status] || "bg-gray-100 text-gray-800"}>
                  {deviation.status}
                </Badge>
                <Badge className={severityColors[deviation.severity] || "bg-gray-100 text-gray-800"}>
                  {deviation.severity}
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#1A5F7A]" />
                {deviation.deviationNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm font-semibold text-[#1A5F7A]">
                  {deviation.title}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {deviation.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Reported: {new Date(deviation.reportedDate).toLocaleDateString()}
                </div>
                {deviation.affectedBatch && (
                  <div className="text-sm text-gray-600">
                    <strong>Affected Batch:</strong> {deviation.affectedBatch}
                  </div>
                )}
                {deviation.rootCause && (
                  <div className="text-sm text-gray-600">
                    <strong>Root Cause:</strong> {deviation.rootCause}
                  </div>
                )}
                {deviation.correctiveAction && (
                  <div className="text-sm text-gray-600">
                    <strong>Corrective Action:</strong> {deviation.correctiveAction}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredDeviations?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No deviations found</p>
        </div>
      )}
      
      {/* Add Deviation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Deviation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Deviation Number *</Label>
              <Input
                value={formData.deviationNumber}
                onChange={(e) => setFormData({ ...formData, deviationNumber: e.target.value })}
                placeholder="e.g., DEV-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title of the deviation"
              />
            </div>
            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Affected Batch</Label>
              <Input
                value={formData.affectedBatch}
                onChange={(e) => setFormData({ ...formData, affectedBatch: e.target.value })}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the deviation..."
                rows={4}
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
              {createMutation.isPending ? "Creating..." : "Report Deviation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
