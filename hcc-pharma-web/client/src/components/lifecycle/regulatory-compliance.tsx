import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { CheckCircle, AlertTriangle, Clock, XCircle, FileCheck, CalendarIcon } from "lucide-react";

type RegulatoryRequirement = {
  id: number;
  regulatoryBody: string;
  requirementName: string;
  requirementCode: string;
  description: string;
  productCategoryApplicability: string;
  requiredDocuments: string[];
  effectiveDate: string;
  updatedAt: string;
};

type ProductRegulatoryStatus = {
  id: number;
  productId: number;
  requirementId: number;
  status: string;
  approvalDate: string | null;
  expirationDate: string | null;
  documentIds: number[];
  notes: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
};

const statusDisplay = {
  "pending": { label: "Pending", icon: <Clock className="h-4 w-4 text-amber-500 mr-1" />, color: "bg-amber-100 text-amber-800" },
  "approved": { label: "Approved", icon: <CheckCircle className="h-4 w-4 text-green-500 mr-1" />, color: "bg-green-100 text-green-800" },
  "rejected": { label: "Rejected", icon: <XCircle className="h-4 w-4 text-red-500 mr-1" />, color: "bg-red-100 text-red-800" },
  "in_progress": { label: "In Progress", icon: <Clock className="h-4 w-4 text-blue-500 mr-1" />, color: "bg-blue-100 text-blue-800" },
  "expiring_soon": { label: "Expiring Soon", icon: <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />, color: "bg-orange-100 text-orange-800" },
  "expired": { label: "Expired", icon: <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />, color: "bg-red-100 text-red-800" }
};

interface RegulatoryComplianceProps {
  productId: number;
}

export const RegulatoryCompliance = ({ productId }: RegulatoryComplianceProps) => {
  const [activeTab, setActiveTab] = useState("summary");

  // Fetch regulatory requirements
  const { data: regulatoryStatuses, isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['/api/products', productId, 'regulatory-status'],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/regulatory-status`);
      if (!res.ok) throw new Error('Failed to fetch regulatory status');
      return res.json() as Promise<ProductRegulatoryStatus[]>;
    },
    enabled: !!productId
  });

  // Fetch all regulatory requirements for reference
  const { data: requirements, isLoading: isLoadingRequirements } = useQuery({
    queryKey: ['/api/regulatory-requirements'],
    queryFn: async () => {
      const res = await fetch('/api/regulatory-requirements');
      if (!res.ok) throw new Error('Failed to fetch regulatory requirements');
      return res.json() as Promise<RegulatoryRequirement[]>;
    }
  });

  // Calculate compliance status
  const getComplianceStatus = () => {
    if (!regulatoryStatuses || regulatoryStatuses.length === 0 || !requirements) {
      return { percentage: 0, color: "bg-gray-400" };
    }

    const relevantRequirements = requirements.filter(req => req.productCategoryApplicability === "all" || req.productCategoryApplicability === "pharmaceuticals");
    const requiredCount = relevantRequirements.length;
    const approvedCount = regulatoryStatuses.filter(s => s.status === "approved").length;
    
    const percentage = requiredCount > 0 ? Math.round((approvedCount / requiredCount) * 100) : 0;
    
    let color = "bg-red-500";
    if (percentage >= 90) color = "bg-green-500";
    else if (percentage >= 70) color = "bg-amber-500";
    else if (percentage >= 50) color = "bg-orange-500";
    
    return { percentage, color };
  };

  const complianceStatus = getComplianceStatus();

  // Group regulatory by body
  const groupedByBody = requirements ? requirements.reduce((acc, req) => {
    if (!acc[req.regulatoryBody]) {
      acc[req.regulatoryBody] = [];
    }
    acc[req.regulatoryBody].push(req);
    return acc;
  }, {} as Record<string, RegulatoryRequirement[]>) : {};

  if (isLoadingStatuses || isLoadingRequirements) {
    return <RegulatoryComplianceSkeleton />;
  }

  if (!regulatoryStatuses || !requirements) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Regulatory Compliance</CardTitle>
          <CardDescription>
            No regulatory data available for this product.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get status for a specific requirement
  const getStatusForRequirement = (requirementId: number) => {
    const status = regulatoryStatuses?.find(s => s.requirementId === requirementId);
    return status;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Regulatory Compliance</CardTitle>
        <CardDescription>
          Overall compliance status and regulatory documentation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Compliance Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Compliance Status</span>
            <span className="text-sm font-medium">{complianceStatus.percentage}%</span>
          </div>
          <Progress value={complianceStatus.percentage} className={`h-2 ${complianceStatus.color}`} />
        </div>
        
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="by-regulatory-body">Regulatory Bodies</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>
          
          {/* Summary Tab */}
          <TabsContent value="summary" className="pt-4">
            <div className="grid gap-4">
              {regulatoryStatuses.map(status => {
                const requirement = requirements.find(r => r.id === status.requirementId);
                if (!requirement) return null;
                
                const statusInfo = statusDisplay[status.status as keyof typeof statusDisplay] || 
                  statusDisplay.pending;
                
                return (
                  <div 
                    key={status.id} 
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-md font-medium">{requirement.requirementName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{requirement.description}</p>
                      </div>
                      <Badge variant="outline" className={statusInfo.color}>
                        <span className="flex items-center">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center mr-4">
                        <FileCheck className="h-3 w-3 mr-1" />
                        {requirement.regulatoryBody} - {requirement.requirementCode}
                      </span>
                      
                      {status.approvalDate && (
                        <span className="flex items-center mr-4">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Approved: {format(new Date(status.approvalDate), "MM/dd/yyyy")}
                        </span>
                      )}
                      
                      {status.expirationDate && (
                        <span className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Expires: {format(new Date(status.expirationDate), "MM/dd/yyyy")}
                        </span>
                      )}
                    </div>
                    
                    {status.notes && (
                      <p className="text-xs italic mt-2 text-muted-foreground">{status.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
          
          {/* Regulatory Bodies Tab */}
          <TabsContent value="by-regulatory-body" className="pt-4">
            <div className="space-y-6">
              {Object.entries(groupedByBody).map(([body, bodyRequirements]) => (
                <div key={body} className="space-y-2">
                  <h3 className="text-md font-semibold border-b pb-2">{body}</h3>
                  
                  <div className="grid gap-3">
                    {bodyRequirements.map(req => {
                      const status = getStatusForRequirement(req.id);
                      const statusInfo = status 
                        ? statusDisplay[status.status as keyof typeof statusDisplay] || statusDisplay.pending
                        : statusDisplay.pending;
                      
                      return (
                        <div key={req.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <span className="font-medium">{req.requirementCode}</span>: {req.requirementName}
                          </div>
                          
                          <Badge variant="outline" className={statusInfo.color}>
                            <span className="flex items-center">
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Documentation Tab */}
          <TabsContent value="documentation" className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Required documentation for regulatory compliance. Click on a document to view or download.
              </p>
              
              <div className="grid gap-3">
                {regulatoryStatuses
                  .filter(status => status.documentIds && status.documentIds.length > 0)
                  .map(status => {
                    const requirement = requirements.find(r => r.id === status.requirementId);
                    if (!requirement) return null;
                    
                    return (
                      <div key={status.id} className="p-3 border rounded-md">
                        <h3 className="font-medium">{requirement.requirementName}</h3>
                        
                        <div className="mt-2 space-y-2">
                          {status.documentIds.map(docId => (
                            <div key={docId} className="flex items-center text-sm text-blue-600 cursor-pointer hover:underline">
                              <FileCheck className="h-4 w-4 mr-1" />
                              Document #{docId} 
                              {/* In a real-world scenario, you would fetch document details and display the actual name */}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Loading skeleton
const RegulatoryComplianceSkeleton = () => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle><Skeleton className="h-7 w-64" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        
        <Skeleton className="h-10 w-full mb-4" />
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              
              <div className="flex items-center mt-3">
                <Skeleton className="h-4 w-32 mr-3" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RegulatoryCompliance;