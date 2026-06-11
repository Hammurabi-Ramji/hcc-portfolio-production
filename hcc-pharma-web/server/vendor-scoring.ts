/**
 * Vendor Performance Scoring Engine
 * Calculates vendor scores based on delivery, quality, and pricing metrics
 */

export interface VendorScoreWeights {
  delivery: number; // 0-1
  quality: number; // 0-1
  pricing: number; // 0-1
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  averageDeliveryDays: number;
  expectedDeliveryDays: number;
}

export interface QualityMetrics {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  defectRate: number; // percentage
}

export interface PricingMetrics {
  averagePrice: number;
  marketAveragePrice: number;
  priceStability: number; // standard deviation
}

export interface VendorScore {
  deliveryScore: number; // 0-100
  qualityScore: number; // 0-100
  pricingScore: number; // 0-100
  overallScore: number; // 0-100
  tier: "platinum" | "gold" | "silver" | "bronze" | "probation";
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Default weights: Quality is most important for pharmaceuticals
const DEFAULT_WEIGHTS: VendorScoreWeights = {
  delivery: 0.3,
  quality: 0.5,
  pricing: 0.2,
};

/**
 * Calculate delivery performance score (0-100)
 */
export function calculateDeliveryScore(metrics: DeliveryMetrics): number {
  if (metrics.totalDeliveries === 0) return 0;

  // On-time delivery rate (0-70 points)
  const onTimeRate = metrics.onTimeDeliveries / metrics.totalDeliveries;
  const onTimePoints = onTimeRate * 70;

  // Average delivery time vs expected (0-30 points)
  const deliveryRatio = metrics.expectedDeliveryDays / metrics.averageDeliveryDays;
  const timePoints = Math.min(30, Math.max(0, deliveryRatio * 30));

  return Math.round(onTimePoints + timePoints);
}

/**
 * Calculate quality performance score (0-100)
 */
export function calculateQualityScore(metrics: QualityMetrics): number {
  if (metrics.totalInspections === 0) return 0;

  // Pass rate (0-80 points)
  const passRate = metrics.passedInspections / metrics.totalInspections;
  const passPoints = passRate * 80;

  // Defect rate penalty (0-20 points, lower is better)
  const defectPoints = Math.max(0, 20 - metrics.defectRate * 2);

  return Math.round(passPoints + defectPoints);
}

/**
 * Calculate pricing competitiveness score (0-100)
 */
export function calculatePricingScore(metrics: PricingMetrics): number {
  if (metrics.marketAveragePrice === 0) return 50; // neutral if no market data

  // Price competitiveness (0-70 points, lower price is better)
  const priceRatio = metrics.marketAveragePrice / metrics.averagePrice;
  const competitivenessPoints = Math.min(70, Math.max(0, priceRatio * 50));

  // Price stability (0-30 points, lower volatility is better)
  const stabilityPoints = Math.max(0, 30 - metrics.priceStability * 3);

  return Math.round(competitivenessPoints + stabilityPoints);
}

/**
 * Calculate overall vendor score with weighted categories
 */
export function calculateOverallScore(
  deliveryScore: number,
  qualityScore: number,
  pricingScore: number,
  weights: VendorScoreWeights = DEFAULT_WEIGHTS
): number {
  const weighted =
    deliveryScore * weights.delivery +
    qualityScore * weights.quality +
    pricingScore * weights.pricing;

  return Math.round(weighted);
}

/**
 * Determine vendor tier based on overall score
 */
export function determineVendorTier(overallScore: number): VendorScore["tier"] {
  if (overallScore >= 90) return "platinum";
  if (overallScore >= 80) return "gold";
  if (overallScore >= 70) return "silver";
  if (overallScore >= 60) return "bronze";
  return "probation";
}

/**
 * Generate vendor strengths based on scores
 */
export function identifyStrengths(
  deliveryScore: number,
  qualityScore: number,
  pricingScore: number
): string[] {
  const strengths: string[] = [];

  if (deliveryScore >= 85) {
    strengths.push("Excellent delivery reliability and speed");
  }
  if (qualityScore >= 85) {
    strengths.push("Outstanding quality control and low defect rates");
  }
  if (pricingScore >= 85) {
    strengths.push("Highly competitive pricing with stable rates");
  }

  if (deliveryScore >= 75 && deliveryScore < 85) {
    strengths.push("Good delivery performance");
  }
  if (qualityScore >= 75 && qualityScore < 85) {
    strengths.push("Solid quality standards");
  }
  if (pricingScore >= 75 && pricingScore < 85) {
    strengths.push("Competitive pricing");
  }

  return strengths;
}

/**
 * Generate vendor weaknesses based on scores
 */
export function identifyWeaknesses(
  deliveryScore: number,
  qualityScore: number,
  pricingScore: number
): string[] {
  const weaknesses: string[] = [];

  if (deliveryScore < 60) {
    weaknesses.push("Frequent late deliveries impacting operations");
  } else if (deliveryScore < 70) {
    weaknesses.push("Inconsistent delivery times");
  }

  if (qualityScore < 60) {
    weaknesses.push("High defect rates requiring additional inspections");
  } else if (qualityScore < 70) {
    weaknesses.push("Quality control needs improvement");
  }

  if (pricingScore < 60) {
    weaknesses.push("Above-market pricing or high price volatility");
  } else if (pricingScore < 70) {
    weaknesses.push("Pricing could be more competitive");
  }

  return weaknesses;
}

/**
 * Generate improvement recommendations
 */
export function generateRecommendations(
  deliveryScore: number,
  qualityScore: number,
  pricingScore: number,
  tier: VendorScore["tier"]
): string[] {
  const recommendations: string[] = [];

  if (tier === "probation") {
    recommendations.push("Consider vendor review meeting to discuss performance issues");
    recommendations.push("Explore alternative suppliers for critical materials");
  }

  if (deliveryScore < 70) {
    recommendations.push("Request delivery improvement plan with specific timelines");
    recommendations.push("Consider implementing delivery penalties in contract");
  }

  if (qualityScore < 70) {
    recommendations.push("Schedule quality audit at vendor facility");
    recommendations.push("Increase incoming inspection frequency");
    recommendations.push("Request corrective action plan for quality issues");
  }

  if (pricingScore < 70) {
    recommendations.push("Negotiate better pricing or volume discounts");
    recommendations.push("Request price stability guarantees in contract");
  }

  if (tier === "platinum" || tier === "gold") {
    recommendations.push("Consider expanding business with this vendor");
    recommendations.push("Explore long-term partnership opportunities");
  }

  return recommendations;
}

/**
 * Calculate complete vendor score with all metrics
 */
export function calculateVendorScore(
  delivery: DeliveryMetrics,
  quality: QualityMetrics,
  pricing: PricingMetrics,
  weights: VendorScoreWeights = DEFAULT_WEIGHTS
): VendorScore {
  const deliveryScore = calculateDeliveryScore(delivery);
  const qualityScore = calculateQualityScore(quality);
  const pricingScore = calculatePricingScore(pricing);
  const overallScore = calculateOverallScore(deliveryScore, qualityScore, pricingScore, weights);
  const tier = determineVendorTier(overallScore);

  return {
    deliveryScore,
    qualityScore,
    pricingScore,
    overallScore,
    tier,
    strengths: identifyStrengths(deliveryScore, qualityScore, pricingScore),
    weaknesses: identifyWeaknesses(deliveryScore, qualityScore, pricingScore),
    recommendations: generateRecommendations(deliveryScore, qualityScore, pricingScore, tier),
  };
}

/**
 * Generate sample vendor performance data for demonstration
 */
export function generateSampleVendorPerformance(vendorId: number, vendorName: string) {
  // Create realistic but varied performance data
  const baseQuality = 70 + Math.random() * 25; // 70-95
  const baseDelivery = 65 + Math.random() * 30; // 65-95
  const basePricing = 60 + Math.random() * 35; // 60-95

  const delivery: DeliveryMetrics = {
    totalDeliveries: Math.floor(20 + Math.random() * 30),
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    averageDeliveryDays: 7 + Math.random() * 5,
    expectedDeliveryDays: 7,
  };
  delivery.onTimeDeliveries = Math.floor(delivery.totalDeliveries * (baseDelivery / 100));
  delivery.lateDeliveries = delivery.totalDeliveries - delivery.onTimeDeliveries;

  const quality: QualityMetrics = {
    totalInspections: Math.floor(15 + Math.random() * 25),
    passedInspections: 0,
    failedInspections: 0,
    defectRate: (100 - baseQuality) / 10, // 0.5-3%
  };
  quality.passedInspections = Math.floor(quality.totalInspections * (baseQuality / 100));
  quality.failedInspections = quality.totalInspections - quality.passedInspections;

  const marketPrice = 100 + Math.random() * 200;
  const pricing: PricingMetrics = {
    averagePrice: marketPrice * (1 - (basePricing - 50) / 100),
    marketAveragePrice: marketPrice,
    priceStability: 5 + Math.random() * 10, // lower is better
  };

  return calculateVendorScore(delivery, quality, pricing);
}
