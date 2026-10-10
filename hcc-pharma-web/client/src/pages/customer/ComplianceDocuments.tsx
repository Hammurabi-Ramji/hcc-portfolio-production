import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { customerPortalNavigation } from "@/lib/portal-navigation";
import { Download, FileText, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock compliance documents data
const complianceDocuments = [
  {
    id: 1,
    name: "Certificate of Analysis - Penicillin G Procaine",
    type: "COA",
    productName: "Penicillin G Procaine Injectable",
    lotNumber: "LOT-2024-001",
    date: "2024-01-15",
    expiryDate: "2026-01-15",
    status: "active",
    fileUrl: "#",
  },
  {
    id: 2,
    name: "Safety Data Sheet - Oxytetracycline",
    type: "SDS",
    productName: "Oxytetracycline HCl Soluble Powder",
    lotNumber: "N/A",
    date: "2024-01-10",
    expiryDate: "N/A",
    status: "active",
    fileUrl: "#",
  },
  {
    id: 3,
    name: "Certificate of Analysis - Ivermectin",
    type: "COA",
    productName: "Ivermectin Pour-On",
    lotNumber: "LOT-2024-002",
    date: "2024-01-20",
    expiryDate: "2026-01-20",
    status: "active",
    fileUrl: "#",
  },
  {
    id: 4,
    name: "GMP Certificate",
    type: "Certificate",
    productName: "All Products",
    lotNumber: "N/A",
    date: "2023-12-01",
    expiryDate: "2024-12-01",
    status: "active",
    fileUrl: "#",
  },
  {
    id: 5,
    name: "FDA Establishment Registration",
    type: "Certificate",
    productName: "All Products",
    lotNumber: "N/A",
    date: "2024-01-01",
    expiryDate: "2024-12-31",
    status: "active",
    fileUrl: "#",
  },
];

export default function CustomerComplianceDocuments() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocuments = complianceDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (doc: typeof complianceDocuments[0]) => {
    // Generate a simple document HTML
    const docHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${doc.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .content { margin: 20px 0; }
          .footer { margin-top: 50px; text-align: center; font-size: 0.9em; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Radix Laboratories Incorporated</h1>
          <p>1334 International Drive, Eau Claire, WI 54701</p>
          <p>Phone: (715) 833-0644 | Email: radix@radix-labs.com</p>
          <h2 style="margin-top: 20px;">${doc.name}</h2>
        </div>
        <div class="content">
          <table>
            <tr>
              <th>Document Type</th>
              <td>${doc.type}</td>
            </tr>
            <tr>
              <th>Product Name</th>
              <td>${doc.productName}</td>
            </tr>
            <tr>
              <th>Lot Number</th>
              <td>${doc.lotNumber}</td>
            </tr>
            <tr>
              <th>Issue Date</th>
              <td>${new Date(doc.date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <th>Expiry Date</th>
              <td>${doc.expiryDate === "N/A" ? "N/A" : new Date(doc.expiryDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>${doc.status.toUpperCase()}</td>
            </tr>
          </table>
          <div style="margin-top: 30px;">
            <h3>Certification</h3>
            <p>This document certifies that the above-mentioned product meets all applicable quality standards and regulatory requirements as established by the FDA and relevant governing bodies.</p>
            <p>This product has been manufactured in accordance with Good Manufacturing Practices (GMP) and has passed all required quality control tests.</p>
          </div>
        </div>
        <div class="footer">
          <p>This document is electronically generated and is valid without signature.</p>
          <p>© ${new Date().getFullYear()} Radix Laboratories Incorporated. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([docHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.type}-${doc.productName.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <PortalLayout title="Customer Portal" navigation={customerPortalNavigation}>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Compliance Documents
            </CardTitle>
            <CardDescription>
              Access certificates of analysis, safety data sheets, and regulatory documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by document name, product, type, or lot number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.type}</Badge>
                        </TableCell>
                        <TableCell>{doc.productName}</TableCell>
                        <TableCell>{doc.lotNumber}</TableCell>
                        <TableCell>
                          {new Date(doc.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={doc.status === "active" ? "default" : "secondary"}
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No documents found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Document Types</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><strong>COA:</strong> Certificate of Analysis - Quality test results for specific product lots</li>
                <li><strong>SDS:</strong> Safety Data Sheet - Safety and handling information for products</li>
                <li><strong>Certificate:</strong> Regulatory certificates and compliance documentation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
