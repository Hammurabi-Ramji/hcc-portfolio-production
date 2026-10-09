import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLineChart, DashboardBarChart, DashboardPieChart, MetricCard } from "@/components/dashboard-charts";
import { ShoppingCart, Package, FileText, TrendingUp, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CustomerDashboardEnhanced() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Fetch data
  const { data: orders, refetch: refetchOrders } = trpc.orders.list.useQuery();
  const { data: quotes } = trpc.quotes.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchOrders]);
  
  // Calculate metrics
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter((o: any) => o.status === "pending").length || 0;
  const completedOrders = orders?.filter((o: any) => o.status === "completed" || o.status === "delivered").length || 0;
  const totalSpent = orders?.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0) || 0;
  
  // Chart data - Order trends by month
  const orderTrendData = [
    { name: "Jan", orders: 12, revenue: 45000 },
    { name: "Feb", orders: 19, revenue: 52000 },
    { name: "Mar", orders: 15, revenue: 48000 },
    { name: "Apr", orders: 22, revenue: 61000 },
    { name: "May", orders: 28, revenue: 75000 },
    { name: "Jun", orders: 25, revenue: 68000 },
  ];
  
  // Order status distribution
  const orderStatusData = [
    { name: "Pending", value: pendingOrders || 5 },
    { name: "Processing", value: orders?.filter((o: any) => o.status === "processing").length || 8 },
    { name: "Shipped", value: orders?.filter((o: any) => o.status === "shipped").length || 12 },
    { name: "Delivered", value: completedOrders || 25 },
  ];
  
  // Product category distribution
  const productCategoryData = [
    { name: "Large Animal", value: 45 },
    { name: "Small Animal", value: 30 },
    { name: "Nutritional", value: 15 },
    { name: "Specialty", value: 10 },
  ];
  
  // Recent orders
  const recentOrders = orders?.slice(0, 5) || [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A5F7A]">Customer Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || "Customer"}</p>
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
            title="Total Orders"
            value={totalOrders}
            change={12}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="bg-blue-100 text-blue-800"
          />
          <MetricCard
            title="Pending Orders"
            value={pendingOrders}
            icon={<Clock className="h-6 w-6" />}
            color="bg-yellow-100 text-yellow-800"
          />
          <MetricCard
            title="Completed Orders"
            value={completedOrders}
            change={8}
            icon={<CheckCircle className="h-6 w-6" />}
            color="bg-green-100 text-green-800"
          />
          <MetricCard
            title="Total Spent"
            value={`$${totalSpent.toLocaleString()}`}
            change={15}
            icon={<TrendingUp className="h-6 w-6" />}
            color="bg-purple-100 text-purple-800"
          />
        </div>
        
        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardLineChart
            title="Order Trends"
            data={orderTrendData}
            dataKey="orders"
            color="#1A5F7A"
          />
          <DashboardBarChart
            title="Monthly Revenue"
            data={orderTrendData}
            dataKey="revenue"
            color="#FF8C42"
          />
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DashboardPieChart
            title="Order Status Distribution"
            data={orderStatusData}
          />
          <DashboardPieChart
            title="Product Categories"
            data={productCategoryData}
          />
        </div>
        
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-[#1A5F7A]" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-[#1A5F7A]">
                        ${parseFloat(order.totalAmount || 0).toLocaleString()}
                      </span>
                      <Badge
                        className={
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
