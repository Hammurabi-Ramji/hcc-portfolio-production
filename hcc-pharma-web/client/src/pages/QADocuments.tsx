import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Download, 
  Search, 
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function QADocuments() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents, isLoading } = trpc.documents.listPublic.useQuery();

  const filteredDocuments = documents?.filter((doc: any) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safety": return "bg-red-100 text-red-800 border-red-300";
      case "compliance": return "bg-blue-100 text-blue-800 border-blue-300";
      case "quality_report": return "bg-green-100 text-green-800 border-green-300";
      case "sop": return "bg-purple-100 text-purple-800 border-purple-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "safety": return <AlertTriangle className="h-5 w-5" />;
      case "compliance": return <Shield className="h-5 w-5" />;
      case "quality_report": return <CheckCircle2 className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Quality & Safety Documents</h1>
              <p className="text-purple-100">
                Public access to safety data sheets, compliance documents, and product information
              </p>
            </div>
            <Link href="/">
              <Button variant="secondary">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Search */}
        <Card className="bg-white border-purple-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documents by title, number, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Safety & Compliance Information</h3>
                <p className="text-sm text-blue-700">
                  All documents are publicly available for transparency and regulatory compliance. 
                  For additional information or to request specific documents, please contact our Quality Assurance team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{documents?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Available for download</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-100 to-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Data Sheets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {documents?.filter((d: any) => d.category === 'safety').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">SDS documents</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {documents?.filter((d: any) => d.category === 'compliance').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Regulatory documents</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Reports</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {documents?.filter((d: any) => d.category === 'quality_report').length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">QA reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Documents</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDocuments && filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((doc: any) => (
                <Card
                  key={doc.id}
                  className="hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-purple-50 border-purple-200"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${getCategoryColor(doc.category)}`}>
                          {getCategoryIcon(doc.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">
                              {doc.documentNumber}
                            </Badge>
                            <Badge className={getCategoryColor(doc.category)}>
                              {doc.category.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary">v{doc.version}</Badge>
                          </div>
                          <CardTitle className="text-xl mb-2">{doc.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span>Type: {doc.fileType || 'PDF'}</span>
                            <span>•</span>
                            <span>Size: {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'N/A'}</span>
                            {doc.approvalDate && (
                              <>
                                <span>•</span>
                                <span>Approved: {new Date(doc.approvalDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {doc.tags && JSON.parse(doc.tags).length > 0 && (
                    <CardContent>
                      <Separator className="mb-4" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Tags:</span>
                        {JSON.parse(doc.tags).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No documents found matching your search" : "No public documents available"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Need More Information?</CardTitle>
            <CardDescription>
              Contact our Quality Assurance team for additional documents or inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Email</p>
                <p className="text-sm text-muted-foreground">qa@radixlabs.com</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Phone</p>
                <p className="text-sm text-muted-foreground">1-800-RADIX-QA</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Hours</p>
                <p className="text-sm text-muted-foreground">Mon-Fri, 8AM-5PM EST</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
