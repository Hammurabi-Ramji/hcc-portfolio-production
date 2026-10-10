import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ExportOption = {
  id: string;
  label: string;
  description: string;
  formats: string[];
};

const exportOptions: ExportOption[] = [
  {
    id: "orders",
    label: "Orders",
    description: "All orders with items and status",
    formats: ["excel", "csv"],
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Current inventory levels and lot tracking",
    formats: ["excel", "csv"],
  },
  {
    id: "quality",
    label: "Quality Tests",
    description: "Quality test results and compliance data",
    formats: ["excel", "csv"],
  },
  {
    id: "deviations",
    label: "Deviations",
    description: "Quality deviations and corrective actions",
    formats: ["excel", "csv"],
  },
  {
    id: "audit_trail",
    label: "Audit Trail",
    description: "Complete audit trail for compliance",
    formats: ["excel", "csv"],
  },
  {
    id: "vendors",
    label: "Vendor Performance",
    description: "Vendor metrics and performance scores",
    formats: ["excel", "csv"],
  },
];

export default function DataExportPage() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");
  const { toast } = useToast();
  
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export - in production this would call a real export API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Success", description: "Export completed successfully. Download will start shortly." });
      setShowExportDialog(false);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedExports.length === exportOptions.length) {
      setSelectedExports([]);
    } else {
      setSelectedExports(exportOptions.map((opt) => opt.id));
    }
  };
  
  const handleToggleExport = (id: string) => {
    setSelectedExports((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  
  
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2 flex items-center gap-2">
          <Download className="h-8 w-8" />
          Data Export
        </h1>
        <p className="text-gray-600">Export compliance data for regulatory reporting and analysis</p>
      </div>
      
      <Button
        onClick={() => setShowExportDialog(true)}
        className="mb-8 bg-[#1A5F7A] hover:bg-[#164d62]"
      >
        <Download className="h-4 w-4 mr-2" />
        Create Export
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportOptions.map((option) => (
          <Card key={option.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-[#1A5F7A]" />
                {option.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              <div className="flex gap-2 flex-wrap">
                {option.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline">
                    {fmt.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  id="select-all"
                  checked={selectedExports.length === exportOptions.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                  Select All
                </Label>
              </div>
              
              <div className="space-y-3 pl-4 border-l-2 border-[#1A5F7A]">
                {exportOptions.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedExports.includes(option.id)}
                      onCheckedChange={() => handleToggleExport(option.id)}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      <span className="font-medium">{option.label}</span>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              className="bg-[#1A5F7A] hover:bg-[#164d62]"
              disabled={isExporting || selectedExports.length === 0}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
