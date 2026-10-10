import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";
import * as schemaExt from "./drizzle/schema-extensions.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema: { ...schema, ...schemaExt }, mode: "default" });

console.log("🌱 Starting comprehensive seed...");

// Seed Customers
const customers = [
  { name: "Midwest Veterinary Supply", email: "orders@midwestvet.com", phone: "555-0101", address: "123 Farm Road, Des Moines, IA 50309", contactPerson: "John Smith", status: "active" },
  { name: "Southern Animal Health", email: "purchasing@southernah.com", phone: "555-0102", address: "456 Ranch Ave, Austin, TX 78701", contactPerson: "Mary Johnson", status: "active" },
  { name: "Pacific Coast Equine", email: "orders@pacificequine.com", phone: "555-0103", address: "789 Ocean Blvd, San Diego, CA 92101", contactPerson: "Robert Lee", status: "active" },
  { name: "Northeast Dairy Farms Co-op", email: "supply@nedairy.com", phone: "555-0104", address: "321 Milk Way, Burlington, VT 05401", contactPerson: "Sarah Williams", status: "active" },
  { name: "Rocky Mountain Livestock", email: "procurement@rmlivest.com", phone: "555-0105", address: "654 Mountain Pass, Denver, CO 80202", contactPerson: "Michael Brown", status: "active" },
  { name: "Great Lakes Animal Hospital", email: "admin@glanimalhospital.com", phone: "555-0106", address: "987 Harbor Dr, Chicago, IL 60601", contactPerson: "Jennifer Davis", status: "active" },
  { name: "Sunbelt Cattle Ranch", email: "orders@sunbeltcattle.com", phone: "555-0107", address: "147 Desert Road, Phoenix, AZ 85001", contactPerson: "David Martinez", status: "active" },
  { name: "Atlantic Veterinary Distributors", email: "purchasing@atlanticvet.com", phone: "555-0108", address: "258 Coastal Hwy, Miami, FL 33101", contactPerson: "Lisa Anderson", status: "active" },
  { name: "Central Plains Feedlot", email: "supply@centralplains.com", phone: "555-0109", address: "369 Prairie Lane, Omaha, NE 68102", contactPerson: "James Wilson", status: "active" },
  { name: "Northwest Poultry Farms", email: "orders@nwpoultry.com", phone: "555-0110", address: "741 Forest Ave, Seattle, WA 98101", contactPerson: "Patricia Taylor", status: "active" },
];

console.log("Seeding customers...");
for (const customer of customers) {
  await db.insert(schema.customers).values(customer);
}
console.log(`✅ Seeded ${customers.length} customers`);

// Seed Vendors
const vendors = [
  { name: "ChemSource International", email: "sales@chemsource.com", phone: "555-0201", address: "1000 Chemical Parkway, Newark, NJ 07102", vendorType: "Raw Materials", tier: "platinum", performanceScore: "95.00" },
  { name: "BioPharm Ingredients Ltd", email: "orders@biopharm.com", phone: "555-0202", address: "2000 Pharma Drive, Boston, MA 02101", vendorType: "API Supplier", tier: "gold", performanceScore: "92.00" },
  { name: "Global API Suppliers", email: "supply@globalapi.com", phone: "555-0203", address: "3000 Industry Blvd, Houston, TX 77001", vendorType: "API Supplier", tier: "gold", performanceScore: "88.00" },
  { name: "Premium Excipients Co", email: "sales@premiumexcip.com", phone: "555-0204", address: "4000 Quality Lane, Philadelphia, PA 19101", vendorType: "Excipients", tier: "gold", performanceScore: "90.00" },
  { name: "Veterinary Raw Materials Inc", email: "orders@vetrawmat.com", phone: "555-0205", address: "5000 Supply Chain Dr, Atlanta, GA 30301", vendorType: "Raw Materials", tier: "silver", performanceScore: "87.00" },
  { name: "Pharmaceutical Packaging Solutions", email: "sales@pharmapack.com", phone: "555-0206", address: "6000 Container Way, Los Angeles, CA 90001", vendorType: "Packaging", tier: "platinum", performanceScore: "93.00" },
  { name: "Quality Control Supplies", email: "orders@qcsupplies.com", phone: "555-0207", address: "7000 Testing Blvd, Minneapolis, MN 55401", vendorType: "Testing Supplies", tier: "gold", performanceScore: "91.00" },
  { name: "Sterile Equipment Distributors", email: "sales@sterileequip.com", phone: "555-0208", address: "8000 Clean Room Dr, San Francisco, CA 94101", vendorType: "Equipment", tier: "gold", performanceScore: "89.00" },
];

console.log("Seeding vendors...");
for (const vendor of vendors) {
  await db.insert(schema.vendors).values(vendor);
}
console.log(`✅ Seeded ${vendors.length} vendors`);

// Seed Employees
const employees = [
  { name: "Alice Johnson", email: "alice.johnson@radixlabs.com", department: "Quality Control", position: "QC Manager", hireDate: "2018-03-15", isInOffice: true, consecutiveDaysWorked: 5 },
  { name: "Bob Williams", email: "bob.williams@radixlabs.com", department: "Manufacturing", position: "Production Supervisor", hireDate: "2019-07-22", isInOffice: true, consecutiveDaysWorked: 3 },
  { name: "Carol Martinez", email: "carol.martinez@radixlabs.com", department: "Regulatory Affairs", position: "Regulatory Specialist", hireDate: "2020-01-10", isInOffice: false, consecutiveDaysWorked: 0 },
  { name: "David Lee", email: "david.lee@radixlabs.com", department: "Research & Development", position: "Senior Scientist", hireDate: "2017-11-05", isInOffice: true, consecutiveDaysWorked: 12 },
];

console.log("Seeding employees...");
for (const employee of employees) {
  await db.insert(schema.employees).values(employee);
}
console.log(`✅ Seeded ${employees.length} employees`);

// Seed Orders (30+)
console.log("Seeding orders...");
const orderStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
const orderCount = 35;
for (let i = 1; i <= orderCount; i++) {
  const customerId = Math.floor(Math.random() * customers.length) + 1;
  const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
  const totalAmount = (Math.random() * 5000 + 500).toFixed(2);
  const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
  
  await db.insert(schema.orders).values({
    orderNumber: `ORD-${Date.now()}-${i.toString().padStart(4, '0')}`,
    customerId,
    status,
    totalAmount,
    orderDate,
    trackingNumber: status === "shipped" || status === "delivered" ? `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
  });
}
console.log(`✅ Seeded ${orderCount} orders`);

// Seed Inventory Lots (50+)
console.log("Seeding inventory lots...");
const productIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const lotCount = 55;
for (let i = 1; i <= lotCount; i++) {
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  const quantity = Math.floor(Math.random() * 500) + 50;
  const lotNumber = `LOT-${new Date().getFullYear()}-${i.toString().padStart(4, '0')}`;
  const expirationDate = new Date(Date.now() + Math.random() * 730 * 24 * 60 * 60 * 1000);
  
  await db.insert(schema.inventory).values({
    productId,
    lotNumber,
    quantity,
    expirationDate,
    location: `Warehouse-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 20) + 1}`,
    status: quantity > 100 ? "in_stock" : quantity > 20 ? "low_stock" : "out_of_stock",
  });
}
console.log(`✅ Seeded ${lotCount} inventory lots`);

// Seed Manufacturing Batches (20+)
console.log("Seeding manufacturing batches...");
const batchStatuses = ["planning", "in_progress", "completed", "released", "quarantine"];
const batchCount = 25;
for (let i = 1; i <= batchCount; i++) {
  const productId = productIds[Math.floor(Math.random() * productIds.length)];
  const status = batchStatuses[Math.floor(Math.random() * batchStatuses.length)];
  const quantity = Math.floor(Math.random() * 1000) + 100;
  const batchNumber = `BATCH-${new Date().getFullYear()}-${i.toString().padStart(5, '0')}`;
  const startDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
  
  await db.insert(schema.manufacturingBatches).values({
    batchNumber,
    productId,
    quantity,
    status,
    startDate,
    completionDate: status === "completed" || status === "released" ? new Date(startDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000) : null,
  });
}
console.log(`✅ Seeded ${batchCount} manufacturing batches`);

// Seed Quality Tests (30+)
console.log("Seeding quality tests...");
const testTypes = ["potency", "purity", "sterility", "endotoxin", "particulate_matter"];
const testResults = ["pass", "fail", "pending", "retest"];
const testCount = 35;
for (let i = 1; i <= testCount; i++) {
  const batchId = Math.floor(Math.random() * batchCount) + 1;
  const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
  const result = testResults[Math.floor(Math.random() * testResults.length)];
  const testDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  
  await db.insert(schema.qualityTests).values({
    batchId,
    testType,
    testDate,
    result,
    testedBy: Math.floor(Math.random() * employees.length) + 1,
    notes: result === "fail" ? "Out of specification - investigation required" : result === "pass" ? "All parameters within specification" : "Testing in progress",
  });
}
console.log(`✅ Seeded ${testCount} quality tests`);

// Seed Deviations (15+)
console.log("Seeding deviations...");
const deviationTypes = ["process", "equipment", "material", "documentation", "environmental"];
const severities = ["minor", "major", "critical"];
const deviationCount = 18;
for (let i = 1; i <= deviationCount; i++) {
  const type = deviationTypes[Math.floor(Math.random() * deviationTypes.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const status = Math.random() > 0.3 ? "closed" : "open";
  
  await db.insert(schema.deviations).values({
    deviationNumber: `DEV-${new Date().getFullYear()}-${i.toString().padStart(4, '0')}`,
    type,
    severity,
    description: `${type.charAt(0).toUpperCase() + type.slice(1)} deviation requiring investigation`,
    status,
    reportedBy: Math.floor(Math.random() * employees.length) + 1,
    reportedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
  });
}
console.log(`✅ Seeded ${deviationCount} deviations`);

// Seed Audit Trail (100+)
console.log("Seeding audit trail...");
const actions = ["create", "update", "delete", "approve", "reject"];
const entities = ["order", "batch", "product", "customer", "vendor", "inventory"];
const auditCount = 120;
for (let i = 1; i <= auditCount; i++) {
  const action = actions[Math.floor(Math.random() * actions.length)];
  const entity = entities[Math.floor(Math.random() * entities.length)];
  const userId = Math.floor(Math.random() * 3) + 1;
  
  await db.insert(schema.auditTrail).values({
    userId,
    action,
    entity,
    entityId: Math.floor(Math.random() * 50) + 1,
    changes: JSON.stringify({ field: "status", oldValue: "pending", newValue: "approved" }),
    timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
  });
}
console.log(`✅ Seeded ${auditCount} audit trail entries`);

// Seed Grievances (10+)
console.log("Seeding grievances...");
const grievanceTypes = ["workplace_safety", "harassment", "discrimination", "compensation", "working_conditions"];
const grievanceStatuses = ["submitted", "under_review", "resolved", "closed"];
const grievanceCount = 12;
for (let i = 1; i <= grievanceCount; i++) {
  const isAnonymous = Math.random() > 0.5;
  const type = grievanceTypes[Math.floor(Math.random() * grievanceTypes.length)];
  const status = grievanceStatuses[Math.floor(Math.random() * grievanceStatuses.length)];
  
  await db.insert(schema.grievances).values({
    employeeId: isAnonymous ? null : Math.floor(Math.random() * employees.length) + 1,
    type,
    description: `Grievance regarding ${type.replace(/_/g, ' ')}`,
    status,
    isAnonymous,
    submittedDate: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000),
  });
}
console.log(`✅ Seeded ${grievanceCount} grievances`);

// Seed Knowledge Articles (3+)
console.log("Seeding knowledge articles...");
const articles = [
  { title: "Standard Operating Procedure: Batch Release", department: "Quality Control", content: "Detailed procedure for batch release approval...", isPublished: true, authorId: 1 },
  { title: "Equipment Cleaning Validation Protocol", department: "Manufacturing", content: "Step-by-step cleaning validation procedures...", isPublished: true, authorId: 2 },
  { title: "Regulatory Submission Guidelines", department: "Regulatory Affairs", content: "Guidelines for FDA submission preparation...", isPublished: true, authorId: 3 },
];

for (const article of articles) {
  await db.insert(schema.knowledgeArticles).values(article);
}
console.log(`✅ Seeded ${articles.length} knowledge articles`);

// Seed Time Entries (20+)
console.log("Seeding time entries...");
const timeEntryCount = 25;
for (let i = 1; i <= timeEntryCount; i++) {
  const employeeId = Math.floor(Math.random() * employees.length) + 1;
  const clockIn = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const clockOut = new Date(clockIn.getTime() + (8 + Math.random() * 2) * 60 * 60 * 1000);
  
  await db.insert(schema.timeEntries).values({
    employeeId,
    clockIn,
    clockOut,
    verificationMethod: Math.random() > 0.7 ? "facial_recognition" : "manual",
    faceMatchConfidence: Math.random() > 0.7 ? (95 + Math.random() * 5).toFixed(2) : null,
  });
}
console.log(`✅ Seeded ${timeEntryCount} time entries`);

// Seed Raw Material Alerts (2+)
console.log("Seeding raw material alerts...");
await db.insert(schema.rawMaterialAlerts).values({
  materialName: "Calcium Gluconate API",
  alertType: "price_increase",
  severity: "high",
  message: "Significant price increase detected - up 25% in last 30 days",
  status: "active",
  detectedDate: new Date(),
});

await db.insert(schema.rawMaterialAlerts).values({
  materialName: "Oxytetracycline HCl",
  alertType: "shortage",
  severity: "critical",
  message: "Supply chain disruption - major supplier experiencing production delays",
  status: "active",
  detectedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
});
console.log("✅ Seeded 2 raw material alerts");

// Seed Sales Metrics
console.log("Seeding sales metrics...");
const today = new Date().toISOString().split('T')[0];
await db.insert(schema.salesMetrics).values({
  metricDate: today,
  totalRevenue: "125000.00",
  totalOrders: 45,
  averageOrderValue: "2777.78",
  newCustomers: 3,
});
console.log("✅ Seeded sales metrics for today");

console.log("\n🎉 Comprehensive seed completed successfully!");
console.log("Summary:");
console.log(`- ${customers.length} customers`);
console.log(`- ${vendors.length} vendors`);
console.log(`- ${employees.length} employees`);
console.log(`- ${orderCount} orders`);
console.log(`- ${lotCount} inventory lots`);
console.log(`- ${batchCount} manufacturing batches`);
console.log(`- ${testCount} quality tests`);
console.log(`- ${deviationCount} deviations`);
console.log(`- ${auditCount} audit trail entries`);
console.log(`- ${grievanceCount} grievances`);
console.log(`- ${articles.length} knowledge articles`);
console.log(`- ${timeEntryCount} time entries`);
console.log("- 2 raw material alerts");
console.log("- Sales metrics for today");

await connection.end();
