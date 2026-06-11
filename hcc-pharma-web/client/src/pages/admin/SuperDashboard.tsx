import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Package, 
  DollarSign, 
  TruckIcon,
  AlertTriangle,
  Calendar,
  Award,
  Coffee,
  Clock,
  MessageSquare,
  BookOpen,
  TrendingDown,
  Loader2
} from "lucide-react";

const navigation = [
  { label: "Super Dashboard", href: "/admin/super", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Dashboard", href: "/admin", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users className="h-4 w-4" /> },
  { label: "Vendors", href: "/admin/vendors", icon: <Building2 className="h-4 w-4" /> },
  { label: "Products", href: "/admin/products", icon: <Package className="h-4 w-4" /> },
];

export default function SuperDashboard() {
  const utils = trpc.useUtils();
  
  // Fetch all dashboard data
  const { data: salesMetrics, isLoading: loadingSales } = trpc.admin.getSalesMetrics.useQuery();
  const { data: employeesInOffice } = trpc.admin.getEmployeesInOffice.useQuery();
  const { data: employeesOut } = trpc.admin.getEmployeesOutOfOffice.useQuery();
  const { data: lowInventory } = trpc.admin.getLowInventoryAlerts.useQuery();
  const { data: batchStatus } = trpc.admin.getBatchStatus.useQuery();
  const { data: anniversaries } = trpc.admin.getUpcomingAnniversaries.useQuery();
  const { data: timeOffNeeded } = trpc.admin.getEmployeesNeedingTimeOff.useQuery();
  const { data: rawMaterialAlerts } = trpc.admin.getRawMaterialAlerts.useQuery();
  
  // Auto-refresh every 30 seconds
  useAutoRefresh(() => {
    utils.admin.getSalesMetrics.invalidate();
    utils.admin.getEmployeesInOffice.invalidate();
    utils.admin.getEmployeesOutOfOffice.invalidate();
    utils.admin.getLowInventoryAlerts.invalidate();
    utils.admin.getBatchStatus.invalidate();
  }, 30000);

  return (
    <PortalLayout title="Super-User Dashboard" navigation={navigation}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Super-User Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time operational intelligence for Radix Labs
          </p>
        </div>

        {/* Sales Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Quotes</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSales ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary">{salesMetrics?.quotesGenerated || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Generated today</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Received</CardTitle>
              <Package className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{salesMetrics?.ordersReceived || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">New orders today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipments</CardTitle>
              <TruckIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{salesMetrics?.shipmentsCompleted || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                ${salesMetrics?.expectedSales ? parseFloat(salesMetrics.expectedSales).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Projected for today</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Status & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Presence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Employee Presence
              </CardTitle>
              <CardDescription>Real-time office status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-green-900">In Office</p>
                    <p className="text-2xl font-bold text-green-700">{employeesInOffice?.length || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-700" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Out of Office</p>
                    <p className="text-2xl font-bold text-gray-700">{employeesOut?.length || 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-gray-700" />
                  </div>
                </div>

                {employeesInOffice && employeesInOffice.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Currently In:</p>
                    <div className="flex flex-wrap gap-2">
                      {employeesInOffice.slice(0, 6).map((emp: any) => (
                        <Badge key={emp.id} variant="secondary" className="bg-purple-100 text-purple-800">
                          {emp.employeeNumber}
                        </Badge>
                      ))}
                      {employeesInOffice.length > 6 && (
                        <Badge variant="outline">+{employeesInOffice.length - 6} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Inventory Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Inventory Alerts
              </CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {lowInventory && lowInventory.length > 0 ? (
                <div className="space-y-3">
                  {lowInventory.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">{item.productName || item.materialName}</p>
                        <p className="text-xs text-red-700">
                          Current: {item.quantity} {item.unitOfMeasure}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {item.type === 'finished_goods' ? 'FG' : 'RM'}
                      </Badge>
                    </div>
                  ))}
                  {lowInventory.length > 5 && (
                    <Button variant="outline" className="w-full" size="sm">
                      View All {lowInventory.length} Alerts
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All inventory levels normal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Production & Raw Materials Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Batch Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-secondary" />
                Production Batch Status
              </CardTitle>
              <CardDescription>Current manufacturing overview</CardDescription>
            </CardHeader>
            <CardContent>
              {batchStatus ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">Planned</p>
                    <p className="text-2xl font-bold text-blue-700">{batchStatus.planned || 0}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-900">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-700">{batchStatus.inProgress || 0}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900">Completed</p>
                    <p className="text-2xl font-bold text-green-700">{batchStatus.completed || 0}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-900">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{batchStatus.failed || 0}</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No batch data available</p>
              )}
            </CardContent>
          </Card>

          {/* Raw Material OSINT Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Raw Material Alerts (OSINT)
              </CardTitle>
              <CardDescription>Predictive market intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              {rawMaterialAlerts && rawMaterialAlerts.length > 0 ? (
                <div className="space-y-3">
                  {rawMaterialAlerts.slice(0, 4).map((alert: any) => (
                    <div key={alert.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900">{alert.materialName}</p>
                          <p className="text-xs text-amber-700 mt-1">{alert.alertType.replace('_', ' ')}</p>
                          {alert.priceChangePercent && (
                            <p className="text-xs text-amber-600 mt-1">
                              Expected: +{parseFloat(alert.priceChangePercent).toFixed(1)}% increase
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No material alerts at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* HR & Knowledge Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Anniversaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-foreground" />
                Anniversaries
              </CardTitle>
              <CardDescription>Upcoming milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {anniversaries && anniversaries.length > 0 ? (
                <div className="space-y-3">
                  {anniversaries.map((ann: any) => (
                    <div key={ann.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-900">
                        {ann.employeeName || `Employee #${ann.employeeId}`}
                      </p>
                      <p className="text-xs text-purple-700">
                        {ann.yearsOfService} years • {new Date(ann.anniversaryDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No upcoming anniversaries</p>
              )}
            </CardContent>
          </Card>

          {/* Time Off Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Time Off Needed
              </CardTitle>
              <CardDescription>Consecutive days worked</CardDescription>
            </CardHeader>
            <CardContent>
              {timeOffNeeded && timeOffNeeded.length > 0 ? (
                <div className="space-y-3">
                  {timeOffNeeded.map((emp: any) => (
                    <div key={emp.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">{emp.employeeNumber}</p>
                      <p className="text-xs text-blue-700">
                        {emp.consecutiveDaysWorked} consecutive days
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">All employees have adequate rest</p>
              )}
            </CardContent>
          </Card>

          {/* Sales Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Sales Trend (Last 7 Days)
              </CardTitle>
              <CardDescription>Daily sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { day: 'Mon', sales: 12000, orders: 8 },
                  { day: 'Tue', sales: 15000, orders: 12 },
                  { day: 'Wed', sales: 18000, orders: 15 },
                  { day: 'Thu', sales: 14000, orders: 10 },
                  { day: 'Fri', sales: 22000, orders: 18 },
                  { day: 'Sat', sales: 25000, orders: 20 },
                  { day: 'Sun', sales: parseFloat(salesMetrics?.expectedSales || '20000'), orders: salesMetrics?.ordersReceived || 8 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} name="Sales ($)" />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Inventory Status
              </CardTitle>
              <CardDescription>Stock levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Pharmaceuticals', inStock: 450, lowStock: 12 },
                  { category: 'Raw Materials', inStock: 280, lowStock: 8 },
                  { category: 'Packaging', inStock: 620, lowStock: 5 },
                  { category: 'Equipment', inStock: 95, lowStock: 2 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="category" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="inStock" fill="#10b981" name="In Stock" />
                  <Bar dataKey="lowStock" fill="#f59e0b" name="Low Stock" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Production Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Production Status
              </CardTitle>
              <CardDescription>Batch completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: batchStatus?.completed || 12, color: '#10b981' },
                      { name: 'In Progress', value: batchStatus?.inProgress || 5, color: '#3b82f6' },
                      { name: 'Planned', value: batchStatus?.planned || 3, color: '#f59e0b' },
                      { name: 'Failed', value: batchStatus?.failed || 1, color: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Completed', value: batchStatus?.completed || 12, color: '#10b981' },
                      { name: 'In Progress', value: batchStatus?.inProgress || 5, color: '#3b82f6' },
                      { name: 'Planned', value: batchStatus?.planned || 3, color: '#f59e0b' },
                      { name: 'Failed', value: batchStatus?.failed || 1, color: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Grievances
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Award className="h-4 w-4 mr-2" />
                Performance Reviews
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Time Tracking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
