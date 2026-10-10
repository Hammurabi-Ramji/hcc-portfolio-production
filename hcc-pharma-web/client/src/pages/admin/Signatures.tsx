import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

/**
 * Signature Workflow Dashboard
 * Manage DocuSign signature requests for batch records, COAs, and compliance documents
 */
export default function Signatures() {
  // Mock data - in production this would come from trpc.signatures.list.useQuery()
  const mockSignatures = [
    {
      id: 1,
      envelopeId: "ENV-2024-001",
      documentName: "Batch Production Record - B-2024-001",
      documentType: "batch_record",
      status: "sent",
      signers: [
        { name: "Production Manager", email: "production@radixlabs.com", status: "sent" },
        { name: "QA Manager", email: "qa@radixlabs.com", status: "pending" },
      ],
      createdAt: new Date("2024-12-17"),
    },
    {
      id: 2,
      envelopeId: "ENV-2024-002",
      documentName: "Certificate of Analysis - Equine Antibiotic 500mg",
      documentType: "coa",
      status: "completed",
      signers: [
        { name: "QC Analyst", email: "qc@radixlabs.com", status: "signed" },
        { name: "QA Manager", email: "qa@radixlabs.com", status: "signed" },
      ],
      createdAt: new Date("2024-12-16"),
      completedAt: new Date("2024-12-17"),
    },
    {
      id: 3,
      envelopeId: "ENV-2024-003",
      documentName: "Deviation Investigation Report - #DEV-045",
      documentType: "deviation",
      status: "declined",
      signers: [
        { name: "QA Investigator", email: "qa-inv@radixlabs.com", status: "declined" },
      ],
      createdAt: new Date("2024-12-15"),
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      created: { variant: "secondary", icon: Clock, label: "Created" },
      sent: { variant: "default", icon: Clock, label: "Sent" },
      delivered: { variant: "default", icon: Clock, label: "Delivered" },
      signed: { variant: "default", icon: CheckCircle2, label: "Signed" },
      completed: { variant: "default", icon: CheckCircle2, label: "Completed" },
      declined: { variant: "destructive", icon: XCircle, label: "Declined" },
      voided: { variant: "secondary", icon: AlertCircle, label: "Voided" },
    };

    const config = variants[status] || variants.created;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getDocumentTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      batch_record: "Batch Record",
      coa: "Certificate of Analysis",
      compliance_report: "Compliance Report",
      deviation: "Deviation Report",
    };

    return (
      <Badge variant="outline" className="bg-purple-50">
        {labels[type] || type}
      </Badge>
    );
  };

  const navigation = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Signatures", href: "/admin/signatures" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Vendors", href: "/admin/vendors" },
    { label: "Products", href: "/admin/products" },
  ];

  return (
    <PortalLayout title="Signature Workflows" navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Signature Workflows</h1>
            <p className="text-gray-600 mt-1">
              Manage DocuSign signature requests for batch records, COAs, and compliance documents
            </p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <FileSignature className="h-4 w-4 mr-2" />
            New Signature Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Declined</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">1</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">16</div>
            </CardContent>
          </Card>
        </div>

        {/* Signature Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signature Requests</CardTitle>
            <CardDescription>Track the status of all signature workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSignatures.map((sig) => (
                <div
                  key={sig.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{sig.documentName}</h3>
                        {getDocumentTypeBadge(sig.documentType)}
                        {getStatusBadge(sig.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        Envelope ID: <span className="font-mono">{sig.envelopeId}</span>
                      </div>

                      {/* Signers */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Signers:</div>
                        {sig.signers.map((signer, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            <span className="font-medium">{signer.name}</span>
                            <span className="text-gray-500">({signer.email})</span>
                            <Badge variant="outline" className="text-xs">
                              {signer.status}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        Created: {sig.createdAt.toLocaleDateString()}
                        {sig.completedAt && ` • Completed: ${sig.completedAt.toLocaleDateString()}`}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {sig.status === "completed" && (
                        <Button variant="outline" size="sm" className="bg-green-50">
                          Download Signed
                        </Button>
                      )}
                      {sig.status === "sent" && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          Void Request
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              DocuSign Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">
              To enable DocuSign integration, you'll need to configure your API credentials:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Create a DocuSign developer account at <a href="https://developers.docusign.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">developers.docusign.com</a></li>
              <li>Get your Integration Key (Client ID) and Secret Key from the admin panel</li>
              <li>Add the following environment variables to your project:
                <ul className="list-disc list-inside ml-6 mt-1 font-mono text-xs">
                  <li>DOCUSIGN_INTEGRATION_KEY</li>
                  <li>DOCUSIGN_SECRET_KEY</li>
                  <li>DOCUSIGN_USER_ID</li>
                  <li>DOCUSIGN_ACCOUNT_ID</li>
                </ul>
              </li>
              <li>Restart the server to apply the changes</li>
            </ol>
            <p className="text-xs text-gray-600 mt-3">
              <strong>Note:</strong> The current implementation uses mock data for demonstration.
              Once configured, it will integrate with the actual DocuSign API.
            </p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
