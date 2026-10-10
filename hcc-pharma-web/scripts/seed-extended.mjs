import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedExtendedData() {
  console.log("🌱 Seeding extended data...");

  try {
    // Seed Employees
    console.log("Creating employees...");
    const employeeIds = [];
    
    const employees = [
      {
        userId: null,
        employeeNumber: "EMP001",
        department: "Manufacturing",
        position: "Production Manager",
        hireDate: new Date("2020-01-15"),
        status: "active",
        isInOffice: true,
        funFact: "Has worked in pharmaceutical manufacturing for 15 years",
        performanceScore: "95.5",
        consecutiveDaysWorked: 5,
      },
      {
        userId: null,
        employeeNumber: "EMP002",
        department: "Quality Control",
        position: "QC Analyst",
        hireDate: new Date("2021-06-01"),
        status: "active",
        isInOffice: true,
        funFact: "Certified in GMP and ISO 9001",
        performanceScore: "92.0",
        consecutiveDaysWorked: 3,
      },
      {
        userId: null,
        employeeNumber: "EMP003",
        department: "Warehouse",
        position: "Inventory Specialist",
        hireDate: new Date("2019-03-20"),
        status: "active",
        isInOffice: false,
        funFact: "Expert in FIFO/FEFO inventory management",
        performanceScore: "88.5",
        consecutiveDaysWorked: 12, // Needs time off!
      },
      {
        userId: null,
        employeeNumber: "EMP004",
        department: "Regulatory Affairs",
        position: "Regulatory Specialist",
        hireDate: new Date("2022-09-10"),
        status: "active",
        isInOffice: true,
        funFact: "Previously worked at FDA",
        performanceScore: "97.0",
        consecutiveDaysWorked: 4,
      },
    ];

    for (const emp of employees) {
      const result = await db.insert(schema.employees).values(emp);
      employeeIds.push(result[0].insertId);
    }

    console.log(`✅ Created ${employeeIds.length} employees`);

    // Seed Employee Anniversaries
    console.log("Creating employee anniversaries...");
    const anniversaries = [
      {
        employeeId: employeeIds[0],
        anniversaryType: "hire_date",
        anniversaryDate: new Date("2025-01-15"),
        yearsOfService: 5,
        description: "5 years with Radix Labs!",
        isPublic: true,
      },
      {
        employeeId: employeeIds[2],
        anniversaryType: "hire_date",
        anniversaryDate: new Date("2025-03-20"),
        yearsOfService: 6,
        description: "6 years of dedicated service",
        isPublic: true,
      },
    ];

    await db.insert(schema.employeeAnniversaries).values(anniversaries);
    console.log(`✅ Created ${anniversaries.length} anniversaries`);

    // Seed Sales Metrics
    console.log("Creating sales metrics...");
    const today = new Date().toISOString().split('T')[0];
    const salesMetric = {
      metricDate: today,
      quotesGenerated: 15,
      ordersReceived: 8,
      shipmentsCompleted: 12,
      receivingCompleted: 5,
      expectedSales: "45000.00",
      actualSales: "38500.00",
      expensesClearing: "12000.00",
    };

    await db.insert(schema.salesMetrics).values(salesMetric);
    console.log("✅ Created today's sales metrics");

    // Seed Raw Material Alerts
    console.log("Creating raw material alerts...");
    const alerts = [
      {
        materialName: "Ivermectin API",
        supplierName: "Global Pharma Supplies",
        alertType: "price_increase",
        severity: "high",
        currentPrice: "125.50",
        predictedPrice: "145.00",
        priceChangePercent: "15.5",
        description: "Industry reports indicate supply chain disruptions in India affecting ivermectin production. Expected 15% price increase within 30 days.",
        source: "Pharmaceutical Supply Chain Monitor",
        sourceUrl: "https://example.com/report",
        affectedProducts: JSON.stringify([1, 2]), // Product IDs
        recommendedAction: "Consider increasing inventory by 20% before price increase takes effect",
        status: "active",
      },
      {
        materialName: "Fenbendazole Powder",
        supplierName: "VetChem International",
        alertType: "shortage",
        severity: "critical",
        currentPrice: "89.00",
        predictedPrice: "110.00",
        priceChangePercent: "23.6",
        description: "Major supplier experiencing production delays. Shortage expected in 45-60 days.",
        source: "Industry Trade Association",
        sourceUrl: "https://example.com/shortage-alert",
        affectedProducts: JSON.stringify([3]),
        recommendedAction: "Secure alternative suppliers immediately and increase safety stock",
        status: "active",
      },
    ];

    await db.insert(schema.rawMaterialAlerts).values(alerts);
    console.log(`✅ Created ${alerts.length} raw material alerts`);

    // Seed Knowledge Articles
    console.log("Creating knowledge base articles...");
    const articles = [
      {
        title: "Daily Manufacturing Startup Procedures",
        department: "Manufacturing",
        position: "Production Manager",
        category: "daily_tasks",
        content: "Complete guide to starting up the manufacturing line each morning, including equipment checks, safety protocols, and documentation requirements.",
        estimatedTime: 45,
        difficulty: "intermediate",
        prerequisites: "GMP training, equipment operation certification",
        relatedArticles: JSON.stringify([]),
        authorId: 1,
        isPublished: true,
        views: 0,
      },
      {
        title: "Emergency Batch Failure Response",
        department: "Manufacturing",
        position: "Production Manager",
        category: "emergency_procedures",
        content: "Step-by-step procedures for handling batch failures, including containment, investigation, and reporting requirements.",
        estimatedTime: 30,
        difficulty: "advanced",
        prerequisites: "Deviation management training, QA procedures",
        relatedArticles: JSON.stringify([]),
        authorId: 1,
        isPublished: true,
        views: 0,
      },
      {
        title: "Inventory Cycle Count Procedures",
        department: "Warehouse",
        position: "Inventory Specialist",
        category: "daily_tasks",
        content: "Complete walkthrough of daily cycle counting procedures, including system access, physical counting, and reconciliation.",
        estimatedTime: 60,
        difficulty: "beginner",
        prerequisites: "Inventory system training",
        relatedArticles: JSON.stringify([]),
        authorId: 1,
        isPublished: true,
        views: 0,
      },
    ];

    for (const article of articles) {
      await db.insert(schema.knowledgeArticles).values(article);
    }

    console.log(`✅ Created ${articles.length} knowledge articles`);

    // Seed Documents
    console.log("Creating sample documents...");
    const documents = [
      {
        documentNumber: "SOP-001-v1.0",
        title: "Standard Operating Procedure - Batch Manufacturing",
        category: "sop",
        fileUrl: "https://example.com/docs/sop-001.pdf",
        fileType: "application/pdf",
        fileSize: 2048000,
        version: "1.0",
        isHallOfRecords: false,
        isPublic: false,
        uploadedBy: 1,
        approvedBy: 1,
        approvalDate: new Date(),
        expirationDate: null,
        tags: JSON.stringify(["manufacturing", "gmp", "batch-production"]),
      },
      {
        documentNumber: "SDS-IVER-001",
        title: "Safety Data Sheet - Ivermectin",
        category: "safety",
        fileUrl: "https://example.com/docs/sds-ivermectin.pdf",
        fileType: "application/pdf",
        fileSize: 512000,
        version: "3.2",
        isHallOfRecords: false,
        isPublic: true, // Public safety document
        uploadedBy: 1,
        approvedBy: 1,
        approvalDate: new Date(),
        expirationDate: null,
        tags: JSON.stringify(["safety", "sds", "ivermectin", "api"]),
      },
    ];

    await db.insert(schema.documents).values(documents);
    console.log(`✅ Created ${documents.length} documents`);

    console.log("\n🎉 Extended data seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding extended data:", error);
    throw error;
  }
}

seedExtendedData()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
