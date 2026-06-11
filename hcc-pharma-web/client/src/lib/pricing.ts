export interface PricingTierLike {
  minQuantity: number;
  maxQuantity: number | null;
  discountPercentage: string | number;
  discountedPrice: string | number | null;
  tierName?: string | null;
}

export interface PricingBreakdown<TTier extends PricingTierLike = PricingTierLike> {
  quantity: number;
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  discountPercentage: number;
  lineSubtotal: number;
  lineTotal: number;
  savingsAmount: number;
  applicableTier: TTier | null;
}

export function parsePriceValue(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function getApplicablePricingTier<TTier extends PricingTierLike>(
  quantity: number,
  tiers: TTier[] | null | undefined,
): TTier | null {
  if (!tiers?.length) {
    return null;
  }

  return (
    tiers.find((tier) => quantity >= tier.minQuantity && (tier.maxQuantity == null || quantity <= tier.maxQuantity)) ?? null
  );
}

export function getPricingBreakdown<TTier extends PricingTierLike>(
  baseUnitPriceValue: string | number | null | undefined,
  quantity: number,
  tiers: TTier[] | null | undefined,
): PricingBreakdown<TTier> {
  const safeQuantity = Math.max(1, quantity || 1);
  const baseUnitPrice = parsePriceValue(baseUnitPriceValue);
  const applicableTier = getApplicablePricingTier(safeQuantity, tiers);
  const tierUnitPrice = parsePriceValue(applicableTier?.discountedPrice);
  const effectiveUnitPrice = tierUnitPrice > 0 ? tierUnitPrice : baseUnitPrice;
  const discountPercentage = parsePriceValue(applicableTier?.discountPercentage);
  const lineSubtotal = baseUnitPrice * safeQuantity;
  const lineTotal = effectiveUnitPrice * safeQuantity;

  return {
    quantity: safeQuantity,
    baseUnitPrice,
    effectiveUnitPrice,
    discountPercentage,
    lineSubtotal,
    lineTotal,
    savingsAmount: Math.max(0, lineSubtotal - lineTotal),
    applicableTier,
  };
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatTierRange(tier: PricingTierLike): string {
  return tier.maxQuantity == null ? `${tier.minQuantity}+` : `${tier.minQuantity}-${tier.maxQuantity}`;
}
