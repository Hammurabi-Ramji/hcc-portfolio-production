import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Award,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Clock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

/**
 * Vendor Performance Scorecard Dashboard
 * Displays automated vendor ratings based on delivery, quality, and pricing
 */
export default function VendorPerformance() {
  const { data: scorecards, isLoading } = trpc.vendors.getPerformanceScorecards.useQuery();
  const { data: topPerformers } = trpc.vendors.getTopPerformers.useQuery({ limit: 5 });
  const { data: underperformers } = trpc.vendors.getUnderperformers.useQuery({ limit: 5 });

  const navigation = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Vendor Performance", href: "/admin/vendor-performance" },
    { label: "Vendors", href: "/admin/vendors" },
    { label: "Products", href: "/admin/products" },
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "bg-purple-100 text-purple-800 border-purple-300";
      case "gold": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "silver": return "bg-gray-100 text-gray-800 border-gray-300";
      case "bronze": return "bg-orange-100 text-orange-800 border-orange-300";
      case "probation": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "platinum":
      case "gold":
        return <Award className="h-5 w-5" />;
      case "silver":
      case "bronze":
        return <CheckCircle2 className="h-5 w-5" />;
      case "probation":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <PortalLayout title="Vendor Performance" navigation={navigation}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendor scorecards...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Vendor Performance" navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Performance Scorecards</h1>
          <p className="text-gray-600 mt-1">
            Automated vendor ratings based on delivery, quality, and pricing metrics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold">{scorecards?.length || 0}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Performers</p>
                  <p className="text-2xl font-bold text-green-600">{topPerformers?.length || 0}</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Need Attention</p>
                  <p className="text-2xl font-bold text-red-600">{underperformers?.length || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {scorecards && scorecards.length > 0
                      ? Math.round(scorecards.reduce((sum, s) => sum + s.overallScore, 0) / scorecards.length)
                      : 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers & Underperformers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Award className="h-5 w-5" />
                Top Performers
              </CardTitle>
              <CardDescription>Vendors exceeding expectations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers && topPerformers.length > 0 ? (
                  topPerformers.map((vendor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-green-700">#{idx + 1}</div>
                        <div>
                          <div className="font-semibold">{vendor.vendorName}</div>
                          <div className="text-sm text-gray-600">
                            <Badge className={getTierColor(vendor.tier)} variant="outline">
                              {vendor.tier.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">{vendor.overallScore}</div>
                        <div className="text-xs text-gray-600">Overall Score</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No top performers yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Underperformers */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Need Attention
              </CardTitle>
              <CardDescription>Vendors requiring performance improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {underperformers && underperformers.length > 0 ? (
                  underperformers.map((vendor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                        <div>
                          <div className="font-semibold">{vendor.vendorName}</div>
                          <div className="text-sm text-gray-600">
                            <Badge className={getTierColor(vendor.tier)} variant="outline">
                              {vendor.tier.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-700">{vendor.overallScore}</div>
                        <div className="text-xs text-gray-600">Overall Score</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">All vendors performing well</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Scorecards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Detailed Vendor Scorecards</h2>
          
          {scorecards && scorecards.length > 0 ? (
            scorecards.map((scorecard) => {
              // Prepare radar chart data
              const radarData = [
                { metric: "Delivery", score: scorecard.deliveryScore, fullMark: 100 },
                { metric: "Quality", score: scorecard.qualityScore, fullMark: 100 },
                { metric: "Pricing", score: scorecard.pricingScore, fullMark: 100 },
              ];

              return (
                <Card key={scorecard.vendorId} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTierIcon(scorecard.tier)}
                        <div>
                          <CardTitle>{scorecard.vendorName}</CardTitle>
                          <CardDescription className="mt-1">
                            <Badge className={getTierColor(scorecard.tier)} variant="outline">
                              {scorecard.tier.toUpperCase()} TIER
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-purple-600">{scorecard.overallScore}</div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Radar Chart */}
                      <div>
                        <h3 className="font-semibold mb-4 text-center">Performance Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar
                              name="Score"
                              dataKey="score"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.6}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Score Details */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Delivery Performance</span>
                            </div>
                            <span className="text-xl font-bold">{scorecard.deliveryScore}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${scorecard.deliveryScore}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Quality Performance</span>
                            </div>
                            <span className="text-xl font-bold">{scorecard.qualityScore}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${scorecard.qualityScore}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium">Pricing Competitiveness</span>
                            </div>
                            <span className="text-xl font-bold">{scorecard.pricingScore}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-600 h-2 rounded-full transition-all"
                              style={{ width: `${scorecard.pricingScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {scorecard.strengths && scorecard.strengths.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {scorecard.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scorecard.weaknesses && scorecard.weaknesses.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Areas for Improvement
                          </h4>
                          <ul className="space-y-1">
                            {scorecard.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                <span className="text-red-600 mt-0.5">•</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    {scorecard.recommendations && scorecard.recommendations.length > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg mt-4">
                        <h4 className="font-semibold text-purple-800 mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {scorecard.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                              <span className="text-purple-600 mt-0.5">→</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No vendor performance data available yet.</p>
                  <p className="text-sm mt-2">Scorecards will appear as vendors complete deliveries and quality inspections.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Scoring Methodology */}
        <Card className="border-gray-300">
          <CardHeader>
            <CardTitle>Scoring Methodology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              Vendor performance scores are calculated using a weighted algorithm that evaluates three key categories:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-semibold text-blue-800 mb-1">Delivery (30%)</h4>
                <p className="text-xs">On-time delivery rate, average delivery time vs expected</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <h4 className="font-semibold text-green-800 mb-1">Quality (50%)</h4>
                <p className="text-xs">Inspection pass rate, defect rate, compliance with specifications</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-semibold text-yellow-800 mb-1">Pricing (20%)</h4>
                <p className="text-xs">Price competitiveness vs market average, price stability</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Tier Classifications:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className={getTierColor("platinum")}>Platinum (90-100)</Badge>
                <Badge className={getTierColor("gold")}>Gold (80-89)</Badge>
                <Badge className={getTierColor("silver")}>Silver (70-79)</Badge>
                <Badge className={getTierColor("bronze")}>Bronze (60-69)</Badge>
                <Badge className={getTierColor("probation")}>Probation (&lt;60)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
