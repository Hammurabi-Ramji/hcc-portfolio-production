import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLineChart, DashboardBarChart, DashboardPieChart, MetricCard } from "@/components/dashboard-charts";
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, RefreshCw, ClipboardList } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function RegulatoryDashboardEnhanced() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Fetch data
  const { data: deviations, refetch: refetchDeviations } = trpc.deviations.list.useQuery({});
  const { data: qualityTests } = trpc.manufacturing.qualityTests.useQuery({ batchId: 0 });
  const { data: auditTrail } = trpc.audit.list.useQuery({});
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchDeviations();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchDeviations]);
  
  // Calculate metrics
  const totalDeviations = deviations?.length || 0;
  const openDeviations = deviations?.filter((d: any) => d.status === "open" || d.status === "investigating").length || 0;
  const closedDeviations = deviations?.filter((d: any) => d.status === "closed").length || 0;
  const complianceRate = totalDeviations > 0 ? Math.round((closedDeviations / totalDeviations) * 100) : 100;
  
  // Compliance trend data
  const complianceTrendData = [
    { name: "Jan", rate: 94, deviations: 8 },
    { name: "Feb", rate: 96, deviations: 5 },
    { name: "Mar", rate: 92, deviations: 12 },
    { name: "Apr", rate: 97, deviations: 4 },
    { name: "May", rate: 98, deviations: 3 },
    { name: "Jun", rate: 95, deviations: 7 },
  ];
  
  // Deviation status distribution
  const deviationStatusData = [
    { name: "Open", value: openDeviations || 5 },
    { name: "Investigating", value: deviations?.filter((d: any) => d.status === "investigating").length || 3 },
    { name: "Resolved", value: deviations?.filter((d: any) => d.status === "resolved").length || 8 },
    { name: "Closed", value: closedDeviations || 15 },
  ];
  
  // Quality test results
  const qualityResultsData = [
    { name: "Passed", value: qualityTests?.filter((t: any) => t.result === "passed").length || 85 },
    { name: "Failed", value: qualityTests?.filter((t: any) => t.result === "failed").length || 5 },
    { name: "Pending", value: qualityTests?.filter((t: any) => t.result === "pending").length || 10 },
  ];
  
  // Recent audit entries
  const recentAuditEntries = auditTrail?.slice(0, 5) || [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A5F7A]">Regulatory Dashboard</h1>
            <p className="text-gray-600">Compliance monitoring and audit trail</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-[#1A5F7A]" : ""}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
            </Button>
          </div>
        </div>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Compliance Rate"
            value={`${complianceRate}%`}
            change={2}
            icon={<Shield className="h-6 w-6" />}
            color="bg-green-100 text-green-800"
          />
          <MetricCard
            title="Open Deviations"
            value={openDeviations}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="bg-red-100 text-red-800"
          />
          <MetricCard
            title="Closed Deviations"
            value={closedDeviations}
            change={15}
            icon={<CheckCircle className="h-6 w-6" />}
            color="bg-blue-100 text-blue-800"
          />
          <MetricCard
            title="Audit Entries"
            value={auditTrail?.length || 0}
            icon={<FileText className="h-6 w-6" />}
            color="bg-purple-100 text-purple-800"
          />
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardLineChart
            title="Compliance Rate Trend"
            data={complianceTrendData}
            dataKey="rate"
            color="#086D38"
          />
          <DashboardBarChart
            title="Monthly Deviations"
            data={complianceTrendData}
            dataKey="deviations"
            color="#E74C3C"
          />
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardPieChart
            title="Deviation Status"
            data={deviationStatusData}
          />
          <DashboardPieChart
            title="Quality Test Results"
            data={qualityResultsData}
          />
        </div>
        
        {/* Recent Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#1A5F7A]" />
              Recent Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAuditEntries.length > 0 ? (
                recentAuditEntries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-sm text-gray-600">
                        {entry.entityType} - {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        User: {entry.userId || "System"}
                      </span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {entry.entityType}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No audit entries found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
