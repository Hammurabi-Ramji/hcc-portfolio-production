import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  BarChart3,
  Globe,
  Package,
  DollarSign
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * OSINT Raw Material Monitoring Dashboard
 * Displays predictive price forecasts and shortage alerts using Open Source Intelligence
 */
export default function OSINTMonitoring() {
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: report, refetch, isLoading } = trpc.osint.generateReport.useQuery();
  const { data: materials } = trpc.osint.getMonitoredMaterials.useQuery();

  const navigation = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "OSINT Monitoring", href: "/admin/osint" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Vendors", href: "/admin/vendors" },
    { label: "Products", href: "/admin/products" },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing": return <TrendingUp className="h-4 w-4 text-red-600" />;
      case "decreasing": return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  // Prepare chart data
  const priceChartData = report?.priceForecasts.slice(0, 6).map(f => ({
    name: f.materialName.substring(0, 20) + "...",
    current: f.currentPrice,
    predicted: f.predictedPrice,
  })) || [];

  if (isLoading) {
    return (
      <PortalLayout title="OSINT Monitoring" navigation={navigation}>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-lg">Generating OSINT report...</span>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="OSINT Monitoring" navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OSINT Raw Material Monitoring</h1>
            <p className="text-gray-600 mt-1">
              Predictive intelligence on pharmaceutical ingredient prices and supply chain risks
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Report
          </Button>
        </div>

        {/* Report Metadata */}
        {report && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm text-gray-600">Report Generated</div>
                    <div className="font-semibold">{new Date(report.generatedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm text-gray-600">Materials Monitored</div>
                    <div className="font-semibold">{materials?.length || 0}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-sm text-gray-600">Active Alerts</div>
                    <div className="font-semibold text-red-600">{report.shortageAlerts.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shortage Alerts */}
        {report && report.shortageAlerts.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Critical Shortage Alerts
              </CardTitle>
              <CardDescription>Immediate action required to prevent supply disruptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.shortageAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{alert.materialName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Risk Score: {alert.riskScore}/100
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Estimated Impact</div>
                        <div className="font-semibold">{new Date(alert.estimatedImpactDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="text-sm font-medium text-gray-700">Root Causes:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {alert.causes.map((cause, i) => (
                          <li key={i} className="text-sm text-gray-700">{cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="text-sm font-medium text-gray-700">Recommended Actions:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {alert.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Alternative Suppliers:</div>
                      <div className="flex flex-wrap gap-2">
                        {alert.alternativeSuppliers.map((supplier, i) => (
                          <Badge key={i} variant="outline" className="bg-white">
                            {supplier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Forecasts */}
        {report && report.priceForecasts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                30-Day Price Forecasts
              </CardTitle>
              <CardDescription>Predictive pricing based on market intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#8b5cf6" name="Current Price" />
                    <Bar dataKey="predicted" fill="#10b981" name="Predicted Price" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.priceForecasts.map((forecast, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{forecast.materialName}</h3>
                      {getTrendIcon(forecast.trend)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-600">Current Price</div>
                        <div className="text-lg font-bold text-gray-900">
                          ${forecast.currentPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Predicted (30d)</div>
                        <div className={`text-lg font-bold ${
                          forecast.priceChange > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${forecast.predictedPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={forecast.priceChange > 0 ? "destructive" : "default"}>
                        {forecast.priceChange > 0 ? '+' : ''}{forecast.priceChangePercent.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-600">
                        Confidence: {(forecast.confidenceLevel * 100).toFixed(0)}%
                      </span>
                    </div>

                    {forecast.factors.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700">Key Factors:</div>
                        {forecast.factors.map((factor, i) => (
                          <div key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-purple-600">•</span>
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Insights */}
        {report && report.marketInsights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.marketInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.riskFactors.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Sources Info */}
        <Card className="border-gray-300">
          <CardHeader>
            <CardTitle className="text-lg">About OSINT Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              This system uses <strong>Open Source Intelligence (OSINT)</strong> to monitor pharmaceutical raw material markets and predict price changes and supply shortages before they impact your operations.
            </p>
            <div>
              <strong>Data Sources:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Commodity exchanges (CME, LME)</li>
                <li>Industry news and trade publications</li>
                <li>Government databases and regulatory filings</li>
                <li>Weather and climate data</li>
                <li>Shipping and logistics tracking</li>
                <li>Social media sentiment analysis</li>
              </ul>
            </div>
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Current implementation uses simulated data for demonstration. In production, this would integrate with real-time data feeds from multiple OSINT sources.
            </p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
