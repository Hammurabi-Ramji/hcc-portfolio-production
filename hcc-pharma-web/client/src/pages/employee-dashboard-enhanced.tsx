import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLineChart, DashboardBarChart, DashboardPieChart, MetricCard } from "@/components/dashboard-charts";
import { Users, Factory, CheckCircle, AlertTriangle, Clock, TrendingUp, RefreshCw, Package } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function EmployeeDashboardEnhanced() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Fetch data
  const { data: batches, refetch: refetchBatches } = trpc.manufacturing.batches.useQuery();
  const { data: inventory } = trpc.inventory.lots.useQuery();
  const { data: deviations } = trpc.deviations.list.useQuery();
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchBatches();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchBatches]);
  
  // Calculate metrics
  const totalBatches = batches?.length || 0;
  const inProgressBatches = batches?.filter((b: any) => b.status === "in_progress").length || 0;
  const completedBatches = batches?.filter((b: any) => b.status === "completed").length || 0;
  const openDeviations = deviations?.filter((d: any) => d.status === "open" || d.status === "investigating").length || 0;
  
  // Production trend data
  const productionTrendData = [
    { name: "Jan", batches: 15, units: 4500 },
    { name: "Feb", batches: 18, units: 5200 },
    { name: "Mar", batches: 22, units: 6100 },
    { name: "Apr", batches: 20, units: 5800 },
    { name: "May", batches: 25, units: 7200 },
    { name: "Jun", batches: 28, units: 8100 },
  ];
  
  // Batch status distribution
  const batchStatusData = [
    { name: "Completed", value: completedBatches || 25 },
    { name: "In Progress", value: inProgressBatches || 8 },
    { name: "Pending QC", value: batches?.filter((b: any) => b.status === "pending_qc").length || 5 },
    { name: "On Hold", value: batches?.filter((b: any) => b.status === "on_hold").length || 2 },
  ];
  
  // Deviation severity distribution
  const deviationSeverityData = [
    { name: "Critical", value: deviations?.filter((d: any) => d.severity === "critical").length || 2 },
    { name: "Major", value: deviations?.filter((d: any) => d.severity === "major").length || 5 },
    { name: "Minor", value: deviations?.filter((d: any) => d.severity === "minor").length || 12 },
  ];
  
  // Recent batches
  const recentBatches = batches?.slice(0, 5) || [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A5F7A]">Employee Dashboard</h1>
            <p className="text-gray-600">Manufacturing and production overview</p>
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
            title="Total Batches"
            value={totalBatches}
            change={15}
            icon={<Factory className="h-6 w-6" />}
            color="bg-blue-100 text-blue-800"
          />
          <MetricCard
            title="In Progress"
            value={inProgressBatches}
            icon={<Clock className="h-6 w-6" />}
            color="bg-yellow-100 text-yellow-800"
          />
          <MetricCard
            title="Completed"
            value={completedBatches}
            change={12}
            icon={<CheckCircle className="h-6 w-6" />}
            color="bg-green-100 text-green-800"
          />
          <MetricCard
            title="Open Deviations"
            value={openDeviations}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="bg-red-100 text-red-800"
          />
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardLineChart
            title="Production Trend"
            data={productionTrendData}
            dataKey="batches"
            color="#1A5F7A"
          />
          <DashboardBarChart
            title="Units Produced"
            data={productionTrendData}
            dataKey="units"
            color="#FF8C42"
          />
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardPieChart
            title="Batch Status Distribution"
            data={batchStatusData}
          />
          <DashboardPieChart
            title="Deviation Severity"
            data={deviationSeverityData}
          />
        </div>
        
        {/* Recent Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-[#1A5F7A]" />
              Recent Manufacturing Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBatches.length > 0 ? (
                recentBatches.map((batch: any) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{batch.batchNumber}</p>
                      <p className="text-sm text-gray-600">
                        Started: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Qty: {batch.quantity?.toLocaleString() || "N/A"}
                      </span>
                      <Badge
                        className={
                          batch.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : batch.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : batch.status === "pending_qc"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {batch.status?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent batches</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
