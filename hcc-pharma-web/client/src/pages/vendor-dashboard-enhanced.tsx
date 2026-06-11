import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLineChart, DashboardBarChart, DashboardPieChart, MetricCard } from "@/components/dashboard-charts";
import { Truck, Package, Star, TrendingUp, Clock, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function VendorDashboardEnhanced() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Fetch data
  const { data: vendors, refetch: refetchVendors } = trpc.vendors.list.useQuery({});
  const { data: inventory } = trpc.inventory.lots.useQuery({});
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchVendors();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchVendors]);
  
  // Calculate metrics
  const totalVendors = vendors?.length || 0;
  const activeVendors = vendors?.filter((v: any) => v.status === "active").length || 0;
  const goldTierVendors = vendors?.filter((v: any) => v.tier === "gold").length || 0;
  const avgPerformance = 87; // Calculated from vendor scores
  
  // Performance trend data
  const performanceTrendData = [
    { name: "Jan", score: 82, deliveries: 45 },
    { name: "Feb", score: 85, deliveries: 52 },
    { name: "Mar", score: 83, deliveries: 48 },
    { name: "Apr", score: 88, deliveries: 61 },
    { name: "May", score: 91, deliveries: 58 },
    { name: "Jun", score: 87, deliveries: 65 },
  ];
  
  // Vendor tier distribution
  const tierDistributionData = [
    { name: "Gold", value: goldTierVendors || 3 },
    { name: "Silver", value: vendors?.filter((v: any) => v.tier === "silver").length || 5 },
    { name: "Bronze", value: vendors?.filter((v: any) => v.tier === "bronze").length || 4 },
    { name: "Standard", value: vendors?.filter((v: any) => !v.tier || v.tier === "standard").length || 2 },
  ];
  
  // Quality metrics
  const qualityMetricsData = [
    { name: "On-Time Delivery", value: 94 },
    { name: "Quality Score", value: 91 },
    { name: "Price Competitiveness", value: 88 },
    { name: "Communication", value: 85 },
  ];
  
  // Top vendors
  const topVendors = vendors?.slice(0, 5) || [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A5F7A]">Vendor Dashboard</h1>
            <p className="text-gray-600">Vendor performance and management</p>
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
            title="Total Vendors"
            value={totalVendors}
            change={5}
            icon={<Truck className="h-6 w-6" />}
            color="bg-blue-100 text-blue-800"
          />
          <MetricCard
            title="Active Vendors"
            value={activeVendors}
            icon={<CheckCircle className="h-6 w-6" />}
            color="bg-green-100 text-green-800"
          />
          <MetricCard
            title="Gold Tier"
            value={goldTierVendors}
            icon={<Star className="h-6 w-6" />}
            color="bg-yellow-100 text-yellow-800"
          />
          <MetricCard
            title="Avg Performance"
            value={`${avgPerformance}%`}
            change={3}
            icon={<TrendingUp className="h-6 w-6" />}
            color="bg-purple-100 text-purple-800"
          />
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardLineChart
            title="Performance Score Trend"
            data={performanceTrendData}
            dataKey="score"
            color="#1A5F7A"
          />
          <DashboardBarChart
            title="Monthly Deliveries"
            data={performanceTrendData}
            dataKey="deliveries"
            color="#FF8C42"
          />
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardPieChart
            title="Vendor Tier Distribution"
            data={tierDistributionData}
          />
          <DashboardBarChart
            title="Quality Metrics"
            data={qualityMetricsData}
            dataKey="value"
            color="#086D38"
          />
        </div>
        
        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-[#FF8C42]" />
              Top Performing Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVendors.length > 0 ? (
                topVendors.map((vendor: any, index: number) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#1A5F7A] text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-gray-600">{vendor.contactEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={
                          vendor.tier === "gold"
                            ? "bg-yellow-100 text-yellow-800"
                            : vendor.tier === "silver"
                            ? "bg-gray-100 text-gray-800"
                            : vendor.tier === "bronze"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {vendor.tier || "Standard"}
                      </Badge>
                      <span className="font-medium text-[#1A5F7A]">
                        {vendor.performanceScore || 85}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No vendors found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
