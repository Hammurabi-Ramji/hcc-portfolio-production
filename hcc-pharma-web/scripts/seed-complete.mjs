/**
 * COMPREHENSIVE SEED DATA SCRIPT
 * Populates all tables with realistic pharmaceutical data
 */

import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("🌱 Starting comprehensive database seeding...\n");

// ============ PRODUCTS ============
console.log("📦 Seeding products...");

const products = [
  // Antibiotics
  { name: "Penicillin G Procaine Injectable", sku: "PEN-001", description: "Long-acting penicillin for bacterial infections in cattle and swine", category: "Antibiotic", ndc: "11444-0001-01", unitPrice: "45.99", unitOfMeasure: "100mL vial", storageConditions: "Refrigerate 2-8°C", shelfLifeDays: 730, isActive: true },
  { name: "Oxytetracycline HCl Injectable", sku: "OXY-002", description: "Broad-spectrum antibiotic for respiratory and soft tissue infections", category: "Antibiotic", ndc: "11444-0002-01", unitPrice: "52.50", unitOfMeasure: "250mL vial", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  { name: "Ceftiofur Sodium Injectable", sku: "CEF-003", description: "Third-generation cephalosporin for bovine respiratory disease", category: "Antibiotic", ndc: "11444-0003-01", unitPrice: "89.99", unitOfMeasure: "50mL vial", storageConditions: "Refrigerate 2-8°C", shelfLifeDays: 545, isActive: true },
  
  // Anti-inflammatories
  { name: "Flunixin Meglumine Injectable", sku: "FLU-004", description: "NSAID for pain and inflammation in horses and cattle", category: "Anti-inflammatory", ndc: "11444-0004-01", unitPrice: "38.75", unitOfMeasure: "100mL vial", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  { name: "Dexamethasone Injectable", sku: "DEX-005", description: "Corticosteroid for inflammatory conditions", category: "Anti-inflammatory", ndc: "11444-0005-01", unitPrice: "28.50", unitOfMeasure: "100mL vial", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  
  // Vaccines
  { name: "Clostridial 7-Way Vaccine", sku: "VAC-006", description: "Protection against 7 clostridial diseases in cattle and sheep", category: "Vaccine", ndc: "11444-0006-01", unitPrice: "125.00", unitOfMeasure: "10-dose vial", storageConditions: "Refrigerate 2-8°C, do not freeze", shelfLifeDays: 365, isActive: true },
  { name: "Rabies Vaccine", sku: "VAC-007", description: "Killed virus vaccine for rabies prevention", category: "Vaccine", ndc: "11444-0007-01", unitPrice: "95.00", unitOfMeasure: "single dose", storageConditions: "Refrigerate 2-8°C", shelfLifeDays: 365, isActive: true },
  { name: "Equine Influenza-Rhinopneumonitis Vaccine", sku: "VAC-008", description: "Modified live virus vaccine for horses", category: "Vaccine", ndc: "11444-0008-01", unitPrice: "110.00", unitOfMeasure: "10-dose vial", storageConditions: "Refrigerate 2-8°C", shelfLifeDays: 365, isActive: true },
  
  // Parasiticides
  { name: "Ivermectin Pour-On", sku: "PAR-009", description: "Broad-spectrum parasiticide for cattle", category: "Parasiticide", ndc: "11444-0009-01", unitPrice: "78.00", unitOfMeasure: "1L bottle", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  { name: "Fenbendazole Oral Suspension", sku: "PAR-010", description: "Anthelmintic for gastrointestinal parasites", category: "Parasiticide", ndc: "11444-0010-01", unitPrice: "65.50", unitOfMeasure: "1L bottle", storageConditions: "Room temperature", shelfLifeDays: 730, isActive: true },
  { name: "Moxidectin Injectable", sku: "PAR-011", description: "Long-acting parasiticide for cattle", category: "Parasiticide", ndc: "11444-0011-01", unitPrice: "92.00", unitOfMeasure: "500mL vial", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  
  // Nutritional/Metabolic
  { name: "Calcium Borogluconate Injectable", sku: "NUT-012", description: "Treatment for milk fever in dairy cattle", category: "Nutritional", ndc: "11444-0012-01", unitPrice: "42.00", unitOfMeasure: "500mL bottle", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  { name: "Vitamin B Complex Injectable", sku: "NUT-013", description: "Thiamine and B-vitamin supplement", category: "Nutritional", ndc: "11444-0013-01", unitPrice: "35.00", unitOfMeasure: "100mL vial", storageConditions: "Room temperature", shelfLifeDays: 730, isActive: true },
  { name: "Selenium-Vitamin E Injectable", sku: "NUT-014", description: "Prevention and treatment of selenium deficiency", category: "Nutritional", ndc: "11444-0014-01", unitPrice: "48.00", unitOfMeasure: "100mL vial", storageConditions: "Room temperature", shelfLifeDays: 730, isActive: true },
  
  // Anesthetics/Sedatives
  { name: "Xylazine HCl Injectable", sku: "SED-015", description: "Sedative and analgesic for large animals", category: "Sedative", ndc: "11444-0015-01", unitPrice: "68.00", unitOfMeasure: "50mL vial", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  { name: "Detomidine Injectable", sku: "SED-016", description: "Alpha-2 agonist sedative for horses", category: "Sedative", ndc: "11444-0016-01", unitPrice: "125.00", unitOfMeasure: "20mL vial", storageConditions: "Room temperature", shelfLifeDays: 730, isActive: true },
  
  // Hormones
  { name: "Oxytocin Injectable", sku: "HOR-017", description: "Uterine stimulant for obstetrical use", category: "Hormone", ndc: "11444-0017-01", unitPrice: "32.00", unitOfMeasure: "100mL vial", storageConditions: "Refrigerate 2-8°C", shelfLifeDays: 730, isActive: true },
  { name: "Prostaglandin F2α Injectable", sku: "HOR-018", description: "Reproductive management in cattle", category: "Hormone", ndc: "11444-0018-01", unitPrice: "85.00", unitOfMeasure: "30mL vial", storageConditions: "Refrigerate 2-8°C", shelfLifeDays: 545, isActive: true },
  
  // Topical/Wound Care
  { name: "Nitrofurazone Ointment", sku: "TOP-019", description: "Antibacterial wound dressing", category: "Topical", ndc: "11444-0019-01", unitPrice: "18.50", unitOfMeasure: "454g jar", storageConditions: "Room temperature", shelfLifeDays: 1095, isActive: true },
  { name: "Silver Sulfadiazine Cream", sku: "TOP-020", description: "Topical antimicrobial for burns and wounds", category: "Topical", ndc: "11444-0020-01", unitPrice: "24.00", unitOfMeasure: "400g jar", storageConditions: "Room temperature", shelfLifeDays: 730, isActive: true },
];

for (const product of products) {
  await db.insert(schema.products).values(product);
}

console.log(`✅ Seeded ${products.length} products\n`);

// ============ CUSTOMERS ============
console.log("👥 Seeding customers...");

const customers = [
  { name: "Green Valley Ranch", email: "purchasing@greenvalleyranch.com", phone: "555-0101", address: "1234 Ranch Road, Bozeman, MT 59715", customerType: "farm", taxId: "12-3456789", creditLimit: "50000.00", isActive: true },
  { name: "Sunrise Dairy Farm", email: "orders@sunrisedairy.com", phone: "555-0102", address: "5678 Dairy Lane, Madison, WI 53703", customerType: "farm", taxId: "23-4567890", creditLimit: "75000.00", isActive: true },
  { name: "Midwest Veterinary Clinic", email: "supplies@midwestvet.com", phone: "555-0103", address: "910 Main Street, Des Moines, IA 50309", customerType: "clinic", taxId: "34-5678901", creditLimit: "100000.00", isActive: true },
  { name: "Triple Creek Equestrian Center", email: "admin@triplecreek.com", phone: "555-0104", address: "2468 Horse Trail, Lexington, KY 40502", customerType: "farm", taxId: "45-6789012", creditLimit: "60000.00", isActive: true },
  { name: "Big Sky Cattle Company", email: "orders@bigskycattle.com", phone: "555-0105", address: "1357 Cattle Drive, Amarillo, TX 79101", customerType: "farm", taxId: "56-7890123", creditLimit: "80000.00", isActive: true },
  { name: "Heartland Swine Operations", email: "purchasing@heartlandswine.com", phone: "555-0106", address: "2460 Hog Farm Road, Sioux Falls, SD 57104", customerType: "farm", taxId: "67-8901234", creditLimit: "65000.00", isActive: true },
  { name: "Mountain View Veterinary Hospital", email: "supplies@mountainviewvet.com", phone: "555-0107", address: "3690 Summit Drive, Denver, CO 80202", customerType: "veterinarian", taxId: "78-9012345", creditLimit: "120000.00", isActive: true },
  { name: "Prairie Sheep Ranch", email: "orders@prairiesheep.com", phone: "555-0108", address: "1470 Wool Road, Casper, WY 82601", customerType: "farm", taxId: "89-0123456", creditLimit: "45000.00", isActive: true },
  { name: "Coastal Livestock Distributors", email: "purchasing@coastallivestock.com", phone: "555-0109", address: "7890 Harbor Blvd, Portland, OR 97201", customerType: "distributor", taxId: "90-1234567", creditLimit: "150000.00", isActive: true },
  { name: "Heritage Farm Supply", email: "orders@heritagefarm.com", phone: "555-0110", address: "4560 Country Road, Nashville, TN 37201", customerType: "other", taxId: "01-2345678", creditLimit: "90000.00", isActive: true },
];

const customerIds = [];
for (const customer of customers) {
  const result = await db.insert(schema.customers).values(customer);
  customerIds.push(Number(result.insertId));
}

console.log(`✅ Seeded ${customers.length} customers\n`);

// ============ VENDORS ============
console.log("🏭 Seeding vendors...");

const vendors = [
  { name: "API Manufacturing Inc", email: "sales@apimanufacturing.com", phone: "555-0201", address: "100 Industrial Parkway, Newark, NJ 07102", vendorType: "API Supplier", tier: "platinum", performanceScore: "95.00", isActive: true },
  { name: "BioPharm Ingredients Ltd", email: "orders@biopharming.com", phone: "555-0202", address: "200 Science Drive, Cambridge, MA 02138", vendorType: "Raw Material", tier: "gold", performanceScore: "88.00", isActive: true },
  { name: "Global Excipients Corp", email: "sales@globalexcipients.com", phone: "555-0203", address: "300 Chemical Way, Houston, TX 77002", vendorType: "Excipient Supplier", tier: "gold", performanceScore: "85.00", isActive: true },
  { name: "Premium Packaging Solutions", email: "orders@premiumpackaging.com", phone: "555-0204", address: "400 Box Street, Chicago, IL 60601", vendorType: "Packaging", tier: "silver", performanceScore: "78.00", isActive: true },
  { name: "Quality Lab Equipment Co", email: "sales@qualitylab.com", phone: "555-0205", address: "500 Lab Lane, San Diego, CA 92101", vendorType: "Equipment", tier: "gold", performanceScore: "82.00", isActive: true },
  { name: "Sterile Solutions Inc", email: "orders@sterilesolutions.com", phone: "555-0206", address: "600 Clean Room Blvd, Research Triangle, NC 27709", vendorType: "Contract Manufacturing", tier: "platinum", performanceScore: "92.00", isActive: true },
  { name: "Bulk Chemical Distributors", email: "sales@bulkchem.com", phone: "555-0207", address: "700 Tanker Road, Baton Rouge, LA 70801", vendorType: "Chemical Supplier", tier: "bronze", performanceScore: "68.00", isActive: true },
  { name: "Precision Glass Vials LLC", email: "orders@precisionglass.com", phone: "555-0208", address: "800 Glass Works Ave, Pittsburgh, PA 15201", vendorType: "Packaging", tier: "silver", performanceScore: "75.00", isActive: true },
];

const vendorIds = [];
for (const vendor of vendors) {
  const result = await db.insert(schema.vendors).values(vendor);
  vendorIds.push(Number(result.insertId));
}

console.log(`✅ Seeded ${vendors.length} vendors\n`);

// ============ EMPLOYEES ============
console.log("👷 Seeding employees...");

const employees = [
  { userId: 1, department: "Quality Assurance", position: "QA Manager", hireDate: new Date("2018-03-15"), isActive: true, performanceRating: "5.00", consecutiveDaysWorked: 3, facialRecognitionPhoto: null },
  { userId: null, department: "Manufacturing", position: "Production Supervisor", hireDate: new Date("2019-06-01"), isActive: true, performanceRating: "4.50", consecutiveDaysWorked: 5, facialRecognitionPhoto: null },
  { userId: null, department: "Quality Control", position: "QC Analyst", hireDate: new Date("2020-01-10"), isActive: true, performanceRating: "4.80", consecutiveDaysWorked: 4, facialRecognitionPhoto: null },
  { userId: null, department: "Manufacturing", position: "Batch Technician", hireDate: new Date("2020-08-20"), isActive: true, performanceRating: "4.20", consecutiveDaysWorked: 12, facialRecognitionPhoto: null },
  { userId: null, department: "Warehouse", position: "Inventory Specialist", hireDate: new Date("2021-02-15"), isActive: true, performanceRating: "4.60", consecutiveDaysWorked: 6, facialRecognitionPhoto: null },
  { userId: null, department: "Regulatory Affairs", position: "Regulatory Specialist", hireDate: new Date("2019-11-01"), isActive: true, performanceRating: "4.90", consecutiveDaysWorked: 2, facialRecognitionPhoto: null },
  { userId: null, department: "Quality Assurance", position: "QA Specialist", hireDate: new Date("2021-05-10"), isActive: true, performanceRating: "4.40", consecutiveDaysWorked: 7, facialRecognitionPhoto: null },
  { userId: null, department: "Manufacturing", position: "Batch Operator", hireDate: new Date("2022-01-15"), isActive: true, performanceRating: "4.00", consecutiveDaysWorked: 3, facialRecognitionPhoto: null },
  { userId: null, department: "Warehouse", position: "Shipping Coordinator", hireDate: new Date("2020-09-01"), isActive: true, performanceRating: "4.70", consecutiveDaysWorked: 4, facialRecognitionPhoto: null },
  { userId: null, department: "Quality Control", position: "Lab Technician", hireDate: new Date("2021-07-20"), isActive: true, performanceRating: "4.30", consecutiveDaysWorked: 5, facialRecognitionPhoto: null },
  { userId: null, department: "Maintenance", position: "Equipment Technician", hireDate: new Date("2019-04-10"), isActive: true, performanceRating: "4.50", consecutiveDaysWorked: 8, facialRecognitionPhoto: null },
  { userId: null, department: "Purchasing", position: "Procurement Specialist", hireDate: new Date("2020-12-01"), isActive: true, performanceRating: "4.60", consecutiveDaysWorked: 3, facialRecognitionPhoto: null },
  { userId: null, department: "R&D", position: "Formulation Scientist", hireDate: new Date("2018-09-15"), isActive: true, performanceRating: "4.90", consecutiveDaysWorked: 2, facialRecognitionPhoto: null },
  { userId: null, department: "Customer Service", position: "Customer Service Rep", hireDate: new Date("2021-03-10"), isActive: true, performanceRating: "4.40", consecutiveDaysWorked: 6, facialRecognitionPhoto: null },
  { userId: null, department: "Sales", position: "Territory Manager", hireDate: new Date("2019-08-01"), isActive: true, performanceRating: "4.80", consecutiveDaysWorked: 4, facialRecognitionPhoto: null },
];

const employeeIds = [];
for (const employee of employees) {
  const result = await db.insert(schema.employees).values(employee);
  employeeIds.push(Number(result.insertId));
}

console.log(`✅ Seeded ${employees.length} employees\n`);

console.log("✨ Phase 1 complete! Run seed-complete-part2.mjs for orders and inventory...\n");
