/**
 * OSINT Raw Material Monitoring Service
 * Monitors commodity prices, supply chain disruptions, and predicts shortages
 * using Open Source Intelligence from multiple data sources
 */

export interface RawMaterial {
  id: number;
  name: string;
  category: string;
  currentPrice: number;
  unit: string;
}

export interface PriceDataPoint {
  date: Date;
  price: number;
  source: string;
}

export interface PriceForecast {
  materialId: number;
  materialName: string;
  currentPrice: number;
  predictedPrice: number;
  confidenceLevel: number;
  priceChange: number;
  priceChangePercent: number;
  trend: "increasing" | "decreasing" | "stable";
  forecastDate: Date;
  factors: string[];
}

export interface ShortageAlert {
  materialId: number;
  materialName: string;
  severity: "low" | "medium" | "high" | "critical";
  riskScore: number;
  estimatedImpactDate: Date;
  affectedRegions: string[];
  causes: string[];
  recommendations: string[];
  alternativeSuppliers: string[];
}

export interface OSINTReport {
  generatedAt: Date;
  priceForecasts: PriceForecast[];
  shortageAlerts: ShortageAlert[];
  marketInsights: string[];
  riskFactors: string[];
}

/**
 * Pharmaceutical raw materials to monitor
 */
const MONITORED_MATERIALS = [
  { name: "Active Pharmaceutical Ingredient (API) - Penicillin", category: "Antibiotics", unit: "kg" },
  { name: "Lactose Monohydrate", category: "Excipients", unit: "kg" },
  { name: "Microcrystalline Cellulose", category: "Excipients", unit: "kg" },
  { name: "Magnesium Stearate", category: "Lubricants", unit: "kg" },
  { name: "Gelatin (Bovine)", category: "Capsule Materials", unit: "kg" },
  { name: "Titanium Dioxide", category: "Colorants", unit: "kg" },
  { name: "Polyethylene Glycol (PEG)", category: "Polymers", unit: "kg" },
  { name: "Corn Starch", category: "Binders", unit: "kg" },
];

/**
 * Simulate OSINT data collection from multiple sources
 * In production, this would scrape real data from:
 * - Commodity exchanges (CME, LME)
 * - Industry news sites
 * - Government databases
 * - Weather APIs
 * - Shipping/logistics data
 */
async function collectOSINTData(materialName: string): Promise<PriceDataPoint[]> {
  // Simulate historical price data
  const basePrice = Math.random() * 100 + 50;
  const dataPoints: PriceDataPoint[] = [];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some realistic price volatility
    const volatility = (Math.random() - 0.5) * 10;
    const trend = i < 15 ? 1.02 : 1.0; // Recent upward trend
    const price = basePrice * Math.pow(trend, 30 - i) + volatility;
    
    dataPoints.push({
      date,
      price: Math.max(price, 10),
      source: i % 3 === 0 ? "CME" : i % 3 === 1 ? "Industry Report" : "Supplier Quote",
    });
  }
  
  return dataPoints;
}

/**
 * Analyze price trends and predict future prices
 */
function predictPrice(historicalData: PriceDataPoint[]): PriceForecast {
  if (historicalData.length === 0) {
    throw new Error("No historical data available");
  }

  const recentData = historicalData.slice(-7); // Last 7 days
  const currentPrice = recentData[recentData.length - 1]!.price;
  const weekAgoPrice = recentData[0]!.price;
  
  // Simple linear regression for prediction
  const avgChange = (currentPrice - weekAgoPrice) / 7;
  const predictedPrice = currentPrice + (avgChange * 30); // 30-day forecast
  
  const priceChange = predictedPrice - currentPrice;
  const priceChangePercent = (priceChange / currentPrice) * 100;
  
  // Determine trend
  let trend: "increasing" | "decreasing" | "stable";
  if (Math.abs(priceChangePercent) < 2) {
    trend = "stable";
  } else if (priceChangePercent > 0) {
    trend = "increasing";
  } else {
    trend = "decreasing";
  }
  
  // Calculate confidence based on price volatility
  const volatility = calculateVolatility(recentData);
  const confidenceLevel = Math.max(0.5, Math.min(0.95, 1 - (volatility / 100)));
  
  // Identify factors affecting price
  const factors: string[] = [];
  if (priceChangePercent > 5) {
    factors.push("Strong upward momentum detected");
    factors.push("Increased demand from pharmaceutical manufacturers");
  } else if (priceChangePercent < -5) {
    factors.push("Price correction underway");
    factors.push("Oversupply in the market");
  }
  
  if (volatility > 15) {
    factors.push("High market volatility");
  }
  
  const forecastDate = new Date();
  forecastDate.setDate(forecastDate.getDate() + 30);
  
  return {
    materialId: 0,
    materialName: historicalData[0]?.source || "Unknown",
    currentPrice,
    predictedPrice,
    confidenceLevel,
    priceChange,
    priceChangePercent,
    trend,
    forecastDate,
    factors,
  };
}

/**
 * Calculate price volatility
 */
function calculateVolatility(data: PriceDataPoint[]): number {
  if (data.length < 2) return 0;
  
  const prices = data.map(d => d.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  return (stdDev / mean) * 100; // Coefficient of variation as percentage
}

/**
 * Detect potential shortages using OSINT signals
 */
function detectShortages(
  materialName: string,
  priceData: PriceDataPoint[],
  forecast: PriceForecast
): ShortageAlert | null {
  // Shortage indicators:
  // 1. Rapid price increase (>15% in 30 days)
  // 2. High volatility
  // 3. News sentiment (simulated)
  // 4. Supply chain disruptions (simulated)
  
  const rapidPriceIncrease = forecast.priceChangePercent > 15;
  const highVolatility = calculateVolatility(priceData) > 20;
  
  // Simulate OSINT signals
  const supplyChainDisruption = Math.random() > 0.7;
  const geopoliticalRisk = Math.random() > 0.8;
  
  if (!rapidPriceIncrease && !highVolatility && !supplyChainDisruption) {
    return null; // No shortage risk detected
  }
  
  // Calculate risk score
  let riskScore = 0;
  if (rapidPriceIncrease) riskScore += 30;
  if (highVolatility) riskScore += 25;
  if (supplyChainDisruption) riskScore += 25;
  if (geopoliticalRisk) riskScore += 20;
  
  // Determine severity
  let severity: "low" | "medium" | "high" | "critical";
  if (riskScore >= 70) severity = "critical";
  else if (riskScore >= 50) severity = "high";
  else if (riskScore >= 30) severity = "medium";
  else severity = "low";
  
  // Identify causes
  const causes: string[] = [];
  if (rapidPriceIncrease) causes.push("Rapid price escalation detected");
  if (highVolatility) causes.push("Unusual market volatility");
  if (supplyChainDisruption) causes.push("Supply chain disruptions reported");
  if (geopoliticalRisk) causes.push("Geopolitical tensions affecting supply");
  
  // Generate recommendations
  const recommendations: string[] = [
    "Increase safety stock levels by 50%",
    "Secure long-term contracts with current suppliers",
    "Identify and qualify alternative suppliers",
    "Consider bulk purchasing before price spike",
  ];
  
  if (severity === "critical") {
    recommendations.unshift("URGENT: Expedite orders immediately");
  }
  
  // Alternative suppliers (simulated)
  const alternativeSuppliers = [
    "Global PharmaChem Ltd. (India)",
    "EuroAPI Solutions (Germany)",
    "Pacific Ingredients Co. (China)",
  ];
  
  const estimatedImpactDate = new Date();
  estimatedImpactDate.setDate(estimatedImpactDate.getDate() + Math.floor(30 + Math.random() * 30));
  
  return {
    materialId: 0,
    materialName,
    severity,
    riskScore,
    estimatedImpactDate,
    affectedRegions: ["North America", "Europe"],
    causes,
    recommendations,
    alternativeSuppliers,
  };
}

/**
 * Generate comprehensive OSINT report
 */
export async function generateOSINTReport(): Promise<OSINTReport> {
  console.log("[OSINT] Generating comprehensive market intelligence report...");
  
  const priceForecasts: PriceForecast[] = [];
  const shortageAlerts: ShortageAlert[] = [];
  
  // Analyze each monitored material
  for (const material of MONITORED_MATERIALS) {
    try {
      // Collect OSINT data
      const historicalData = await collectOSINTData(material.name);
      
      // Generate price forecast
      const forecast = predictPrice(historicalData);
      forecast.materialName = material.name;
      priceForecasts.push(forecast);
      
      // Detect potential shortages
      const shortageAlert = detectShortages(material.name, historicalData, forecast);
      if (shortageAlert) {
        shortageAlert.materialName = material.name;
        shortageAlerts.push(shortageAlert);
      }
    } catch (error) {
      console.error(`[OSINT] Error analyzing ${material.name}:`, error);
    }
  }
  
  // Generate market insights
  const marketInsights = [
    "Global pharmaceutical ingredient prices trending upward by 8% on average",
    "Supply chain stabilization expected in Q2 2025",
    "Increased demand from emerging markets driving price growth",
    "Alternative sourcing from India and China recommended for cost optimization",
  ];
  
  // Identify risk factors
  const riskFactors = [
    "Geopolitical tensions affecting API supply from China",
    "Energy costs impacting manufacturing in Europe",
    "Regulatory changes in India affecting export capacity",
    "Weather-related disruptions to agricultural raw materials",
  ];
  
  console.log(`[OSINT] Report generated: ${priceForecasts.length} forecasts, ${shortageAlerts.length} shortage alerts`);
  
  return {
    generatedAt: new Date(),
    priceForecasts,
    shortageAlerts,
    marketInsights,
    riskFactors,
  };
}

/**
 * Get price forecast for specific material
 */
export async function getMaterialForecast(materialName: string): Promise<PriceForecast> {
  const historicalData = await collectOSINTData(materialName);
  const forecast = predictPrice(historicalData);
  forecast.materialName = materialName;
  return forecast;
}

/**
 * Check for shortage alerts for specific material
 */
export async function checkMaterialShortage(materialName: string): Promise<ShortageAlert | null> {
  const historicalData = await collectOSINTData(materialName);
  const forecast = await getMaterialForecast(materialName);
  return detectShortages(materialName, historicalData, forecast);
}

/**
 * Get list of monitored materials
 */
export function getMonitoredMaterials() {
  return MONITORED_MATERIALS;
}
