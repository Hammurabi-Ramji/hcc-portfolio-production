import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { trpc } from "@/lib/trpc";
import { regulatoryPortalNavigation } from "@/lib/portal-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegulatoryDataExport() {
  const [exportType, setExportType] = useState<string>("orders");
  const [format, setFormat] = useState<string>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: orders } = trpc.orders.list.useQuery();
  const { data: auditTrail } = trpc.audit.list.useQuery({ limit: 1000 });

  const stringifyExportValue = (value: unknown) => {
    if (value == null) {
      return "";
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let data: any[] = [];
      let filename = "";
      let headers: string[] = [];

      // Prepare data based on export type
      switch (exportType) {
        case "orders":
          data = orders || [];
          filename = `orders-export-${new Date().toISOString().split('T')[0]}`;
          headers = ["Order Number", "Customer ID", "Order Date", "Status", "Total Amount", "Delivery Date"];
          break;
        case "audit":
          data = auditTrail || [];
          filename = `audit-trail-export-${new Date().toISOString().split('T')[0]}`;
          headers = ["Action", "Entity Type", "Entity ID", "User ID", "Timestamp", "Details"];
          break;
        default:
          throw new Error("Invalid export type");
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "There is no data to export for the selected type.",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      // Generate export based on format
      if (format === "csv") {
        exportToCSV(data, headers, filename);
      } else if (format === "excel") {
        exportToExcel(data, headers, filename);
      }

      toast({
        title: "Export Successful",
        description: `Data has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Export failed", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (data: any[], headers: string[], filename: string) => {
    // Convert data to CSV format
    let csvContent = headers.join(",") + "\n";

    data.forEach(row => {
      const values = Object.values(row).map(value => {
        // Handle values that contain commas or quotes
        const stringValue = stringifyExportValue(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replaceAll('"', '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(",") + "\n";
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any[], headers: string[], filename: string) => {
    // Create HTML table for Excel
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(value => `<td>${stringifyExportValue(value)}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <PortalLayout title="Regulatory Portal" navigation={regulatoryPortalNavigation}>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Data Export</h1>
          <p className="text-muted-foreground">Export regulatory and operational data for compliance reporting</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Export Configuration
              </CardTitle>
              <CardDescription>
                Select the data type and format for export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="exportType">Data Type</Label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger id="exportType">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="audit">Audit Trail</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {exportType === "orders" && "Export all order records with customer information"}
                  {exportType === "audit" && "Export complete audit trail for compliance review"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                    <SelectItem value="excel">Excel (XLS)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {format === "csv" && "Compatible with most spreadsheet applications"}
                  {format === "excel" && "Optimized for Microsoft Excel"}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Data"}
              </Button>
            </CardContent>
          </Card>

          {/* Export Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Information
              </CardTitle>
              <CardDescription>
                Details about the selected export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Records Available:</span>
                  <span className="text-sm text-muted-foreground">
                    {exportType === "orders" && (orders?.length || 0)}
                    {exportType === "audit" && (auditTrail?.length || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Export Date:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File Format:</span>
                  <span className="text-sm text-muted-foreground uppercase">
                    {format}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">Compliance Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All exports are logged in the audit trail</li>
                  <li>• Data is exported in accordance with 21 CFR Part 11</li>
                  <li>• Exported files should be stored securely</li>
                  <li>• Maintain data integrity and confidentiality</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Retention Policy</p>
                    <p className="text-muted-foreground">
                      Exported data must be retained for a minimum of 5 years per FDA regulations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
