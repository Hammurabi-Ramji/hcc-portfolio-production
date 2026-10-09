import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);

async function seedPricingTiers() {
  const { products } = await import("./drizzle/schema.js");
  const { pricingTiers } = await import("./drizzle/schema-extensions.js");
  
  // Get all products
  const allProducts = await db.select().from(products);
  
  console.log(`Found ${allProducts.length} products`);
  
  // Define standard pricing tiers
  const tierDefinitions = [
    { minQuantity: 1, maxQuantity: 9, discountPercent: 0 },
    { minQuantity: 10, maxQuantity: 49, discountPercent: 5 },
    { minQuantity: 50, maxQuantity: 99, discountPercent: 10 },
    { minQuantity: 100, maxQuantity: null, discountPercent: 15 },
  ];
  
  // Add pricing tiers for each product
  for (const product of allProducts) {
    const basePrice = parseFloat(product.unitPrice);
    
    for (const tier of tierDefinitions) {
      const discountedPrice = basePrice * (1 - tier.discountPercent / 100);
      
      await db.insert(pricingTiers).values({
        productId: product.id,
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        discountPercentage: tier.discountPercent.toString(),
        discountedPrice: discountedPrice.toFixed(2),
        tierName: `${tier.minQuantity}-${tier.maxQuantity || '∞'} units`,
      });
      
      console.log(`Added pricing tier for ${product.name}: ${tier.minQuantity}-${tier.maxQuantity || '∞'} units @ ${tier.discountPercent}% off`);
    }
  }
  
  console.log("✅ Pricing tiers seeded successfully!");
}

seedPricingTiers().catch(console.error);
