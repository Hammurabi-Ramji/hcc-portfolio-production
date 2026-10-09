import { drizzle } from "drizzle-orm/mysql2";
import { products, customers, vendors } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  // Sample Products
  const sampleProducts = [
    {
      name: "Equine Antibiotic Injection",
      sku: "EQ-AB-001",
      description: "Broad-spectrum antibiotic for horses and large animals",
      category: "Antibiotics",
      ndc: "12345-678-90",
      unitPrice: "45.99",
      unitOfMeasure: "vial",
      storageConditions: "Store at 2-8°C",
      shelfLifeDays: 730,
      isActive: true,
    },
    {
      name: "Bovine Growth Hormone",
      sku: "BV-GH-002",
      description: "Growth hormone supplement for cattle",
      category: "Hormones",
      ndc: "12345-679-91",
      unitPrice: "89.50",
      unitOfMeasure: "dose",
      storageConditions: "Refrigerate",
      shelfLifeDays: 365,
      isActive: true,
    },
    {
      name: "Swine Vaccine - Multi-strain",
      sku: "SW-VAC-003",
      description: "Multi-strain vaccine for pigs",
      category: "Vaccines",
      ndc: "12345-680-92",
      unitPrice: "125.00",
      unitOfMeasure: "box",
      storageConditions: "Keep frozen",
      shelfLifeDays: 540,
      isActive: true,
    },
    {
      name: "Equine Joint Supplement",
      sku: "EQ-SUP-004",
      description: "Joint health supplement for horses",
      category: "Supplements",
      ndc: "12345-681-93",
      unitPrice: "67.25",
      unitOfMeasure: "bottle",
      storageConditions: "Room temperature",
      shelfLifeDays: 1095,
      isActive: true,
    },
    {
      name: "Cattle Dewormer",
      sku: "CT-DW-005",
      description: "Broad-spectrum dewormer for cattle",
      category: "Parasiticides",
      ndc: "12345-682-94",
      unitPrice: "32.50",
      unitOfMeasure: "liter",
      storageConditions: "Store at room temperature",
      shelfLifeDays: 1460,
      isActive: true,
    },
    {
      name: "Poultry Antibiotic Powder",
      sku: "PL-AB-006",
      description: "Water-soluble antibiotic for poultry",
      category: "Antibiotics",
      ndc: "12345-683-95",
      unitPrice: "28.75",
      unitOfMeasure: "kg",
      storageConditions: "Keep dry",
      shelfLifeDays: 730,
      isActive: true,
    },
  ];

  console.log("📦 Inserting products...");
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
  }

  // Sample Customers
  const sampleCustomers = [
    {
      name: "Green Valley Veterinary Clinic",
      email: "contact@greenvalleyvet.com",
      phone: "+1-555-0101",
      address: "123 Main Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "USA",
      customerType: "clinic",
      taxId: "12-3456789",
      isActive: true,
      userId: null,
    },
    {
      name: "Midwest Livestock Distributors",
      email: "sales@midwestlivestock.com",
      phone: "+1-555-0102",
      address: "456 Farm Road",
      city: "Des Moines",
      state: "IA",
      zipCode: "50309",
      country: "USA",
      customerType: "distributor",
      taxId: "98-7654321",
      isActive: true,
      userId: null,
    },
  ];

  console.log("👥 Inserting customers...");
  for (const customer of sampleCustomers) {
    await db.insert(customers).values(customer);
  }

  // Sample Vendors
  const sampleVendors = [
    {
      name: "Global Pharma Supplies Inc",
      email: "vendor@globalpharma.com",
      phone: "+1-555-0201",
      address: "789 Industrial Blvd",
      vendorType: "Raw Materials",
      tier: "platinum",
      performanceScore: "95.5",
      isActive: true,
      userId: null,
    },
    {
      name: "BioTech Components LLC",
      email: "sales@biotechcomp.com",
      phone: "+1-555-0202",
      address: "321 Science Park",
      vendorType: "Active Ingredients",
      tier: "gold",
      performanceScore: "88.2",
      isActive: true,
      userId: null,
    },
  ];

  console.log("🏢 Inserting vendors...");
  for (const vendor of sampleVendors) {
    await db.insert(vendors).values(vendor);
  }

  console.log("✅ Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
