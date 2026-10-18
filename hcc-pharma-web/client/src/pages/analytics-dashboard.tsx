import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from "lucide-react";

export default function AnalyticsDashboard() {
  const { data: orders } = trpc.orders.list.useQuery();
  const { data: inventory } = trpc.inventory.lots.useQuery();
  const { data: deviations } = trpc.deviations.list.useQuery();
  
  // Process data for charts
  const orderTrendData = useMemo(() => {
    if (!orders) return [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split("T")[0];
    });
    
    return last30Days.map((date) => ({
      date,
      orders: orders.filter((o: any) => new Date(o.createdAt).toISOString().startsWith(date)).length,
      amount: orders
        .filter((o: any) => new Date(o.createdAt).toISOString().startsWith(date))
        .reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0),
    }));
  }, [orders]);
  
  const inventoryByCategory = useMemo(() => {
    if (!inventory) return [];
    const grouped: Record<string, number> = {};
    inventory.forEach((item: any) => {
      grouped[item.productId] = (grouped[item.productId] || 0) + item.quantity;
    });
    return Object.entries(grouped).map(([product, quantity]) => ({
      name: `Product ${product}`,
      value: quantity,
    }));
  }, [inventory]);
  
  const deviationBySeverity = useMemo(() => {
    if (!deviations) return [];
    const grouped: Record<string, number> = {};
    deviations.forEach((dev: any) => {
      const severity = dev.severity || "unknown";
      grouped[severity] = (grouped[severity] || 0) + 1;
    });
    return Object.entries(grouped).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
    }));
  }, [deviations]);
  
  const COLORS = ["#1A5F7A", "#FF8C42", "#086D38", "#FFB84D", "#E74C3C"];
  
  const metrics = [
    {
      title: "Total Orders",
      value: orders?.length || 0,
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Inventory Items",
      value: inventory?.length || 0,
      icon: Package,
      color: "bg-green-100 text-green-800",
    },
    {
      title: "Open Deviations",
      value: deviations?.filter((d: any) => d.status === "open").length || 0,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
    },
    {
      title: "Total Revenue",
      value: `$${(orders?.reduce((sum: number, o: any) => sum + (parseFloat(o.totalAmount) || 0), 0) || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-800",
    },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Real-time business metrics and insights</p>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-[#1A5F7A]">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Order Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#1A5F7A"
                  dot={false}
                  name="Order Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#FF8C42" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Deviations by Severity */}
        <Card>
          <CardHeader>
            <CardTitle>Deviations by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviationBySeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#E74C3C" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
