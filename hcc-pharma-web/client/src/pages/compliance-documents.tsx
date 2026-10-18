import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ComplianceDocument = {
  id: number;
  documentName: string;
  category: string;
  description?: string;
  fileUrl?: string;
  uploadedDate: string;
  expiryDate?: string;
  status: string;
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  sds: "bg-blue-100 text-blue-800",
  coa: "bg-green-100 text-green-800",
  certificate: "bg-purple-100 text-purple-800",
  regulatory: "bg-red-100 text-red-800",
  quality: "bg-orange-100 text-orange-800",
};

export default function ComplianceDocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  
  // Mock compliance documents since the API doesn't exist yet
  const documents: ComplianceDocument[] = [
    { id: 1, documentName: "Safety Data Sheet - Antibiotics", category: "sds", description: "SDS for antibiotic products", uploadedDate: "2024-01-15", status: "active", createdAt: "2024-01-15" },
    { id: 2, documentName: "Certificate of Analysis - Batch 2024-001", category: "coa", description: "COA for batch 2024-001", uploadedDate: "2024-02-10", status: "active", createdAt: "2024-02-10" },
    { id: 3, documentName: "FDA Registration Certificate", category: "certificate", description: "FDA facility registration", uploadedDate: "2023-06-01", expiryDate: "2025-06-01", status: "active", createdAt: "2023-06-01" },
    { id: 4, documentName: "GMP Compliance Report", category: "regulatory", description: "Good Manufacturing Practice compliance", uploadedDate: "2024-03-01", status: "active", createdAt: "2024-03-01" },
    { id: 5, documentName: "Quality Manual v3.0", category: "quality", description: "Company quality manual", uploadedDate: "2024-01-01", status: "active", createdAt: "2024-01-01" },
  ];
  const isLoading = false;
  
  const filteredDocuments = documents?.filter((doc: ComplianceDocument) => {
    const matchesSearch = doc.documentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const handleDownload = (doc: ComplianceDocument) => {
    if (!doc.fileUrl) {
      toast({ title: "Error", description: "File not available", variant: "destructive" });
      return;
    }
    window.open(doc.fileUrl, "_blank");
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance documents...</p>
        </div>
      </div>
    );
  }
  
  const categories = ["all", "sds", "coa", "certificate", "regulatory", "quality"];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Compliance Documents
        </h1>
        <p className="text-gray-600">Access safety data sheets, certificates, and regulatory documents</p>
      </div>
      
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "bg-[#1A5F7A] hover:bg-[#164d62]" : ""}
            >
              {cat.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments?.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2 gap-2">
                <Badge className={categoryColors[doc.category.toLowerCase()] || "bg-gray-100 text-gray-800"}>
                  {doc.category}
                </Badge>
                <Badge className={
                  doc.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }>
                  {doc.status}
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1A5F7A]" />
                {doc.documentName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {doc.description && (
                  <p className="text-sm text-gray-600">{doc.description}</p>
                )}
                <div className="text-sm text-gray-600">
                  Uploaded: {new Date(doc.uploadedDate).toLocaleDateString()}
                </div>
                {doc.expiryDate && (
                  <div className="text-sm text-gray-600">
                    Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredDocuments?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No compliance documents found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
