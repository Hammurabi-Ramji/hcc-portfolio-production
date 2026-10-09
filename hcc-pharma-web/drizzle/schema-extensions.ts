import { mysqlTable, int, varchar, text, timestamp, date, decimal, boolean, mysqlEnum, index } from "drizzle-orm/mysql-core";
import { users, customers } from "./schema";

/**
 * Extended schema for advanced HR, time tracking, grievances, and knowledge management
 */

// Employee Extended Information
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  employeeNumber: varchar("employeeNumber", { length: 50 }).notNull().unique(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  hireDate: date("hireDate"),
  status: mysqlEnum("status", ["active", "on_leave", "terminated"]).default("active").notNull(),
  isInOffice: boolean("isInOffice").default(false),
  photoUrl: text("photoUrl"), // Facial recognition photo
  funFact: text("funFact"),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }),
  consecutiveDaysWorked: int("consecutiveDaysWorked").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Time Tracking with Facial Recognition
export const timeEntries = mysqlTable("timeEntries", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  clockIn: timestamp("clockIn").notNull(),
  clockOut: timestamp("clockOut"),
  verificationMethod: mysqlEnum("verificationMethod", ["facial_recognition", "manual", "badge"]).notNull(),
  faceMatchConfidence: decimal("faceMatchConfidence", { precision: 5, scale: 2 }),
  location: varchar("location", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Anonymous Grievance System
export const grievances = mysqlTable("grievances", {
  id: int("id").autoincrement().primaryKey(),
  grievanceNumber: varchar("grievanceNumber", { length: 50 }).notNull().unique(),
  category: mysqlEnum("category", ["workplace_safety", "harassment", "discrimination", "policy_violation", "other"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description").notNull(),
  desiredOutcome: text("desiredOutcome"),
  status: mysqlEnum("status", ["submitted", "under_review", "investigating", "resolved", "closed"]).default("submitted").notNull(),
  resolutionNotes: text("resolutionNotes"),
  resolutionDate: timestamp("resolutionDate"),
  isAnonymous: boolean("isAnonymous").default(true).notNull(),
  submittedBy: int("submittedBy"), // Nullable for anonymous submissions
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Knowledge Base - "Hit by a Bus" System
export const knowledgeArticles = mysqlTable("knowledgeArticles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["daily_tasks", "emergency_procedures", "system_access", "contacts", "troubleshooting"]).notNull(),
  content: text("content").notNull(),
  estimatedTime: int("estimatedTime"), // Minutes to complete
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  prerequisites: text("prerequisites"),
  relatedArticles: text("relatedArticles"), // JSON array of article IDs
  authorId: int("authorId").notNull(),
  isPublished: boolean("isPublished").default(false),
  views: int("views").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Knowledge Article Steps
export const knowledgeSteps = mysqlTable("knowledgeSteps", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull().references(() => knowledgeArticles.id),
  stepNumber: int("stepNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  tips: text("tips"),
  warnings: text("warnings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Employee Anniversaries
export const employeeAnniversaries = mysqlTable("employeeAnniversaries", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  anniversaryType: mysqlEnum("anniversaryType", ["hire_date", "promotion", "achievement"]).notNull(),
  anniversaryDate: date("anniversaryDate").notNull(),
  yearsOfService: int("yearsOfService"),
  description: text("description"),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Raw Material Monitoring (OSINT)
export const rawMaterialAlerts = mysqlTable("rawMaterialAlerts", {
  id: int("id").autoincrement().primaryKey(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  supplierName: varchar("supplierName", { length: 255 }),
  alertType: mysqlEnum("alertType", ["price_increase", "shortage", "quality_issue", "regulatory_change"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  currentPrice: decimal("currentPrice", { precision: 10, scale: 2 }),
  predictedPrice: decimal("predictedPrice", { precision: 10, scale: 2 }),
  priceChangePercent: decimal("priceChangePercent", { precision: 5, scale: 2 }),
  description: text("description").notNull(),
  source: varchar("source", { length: 255 }),
  sourceUrl: text("sourceUrl"),
  affectedProducts: text("affectedProducts"), // JSON array of product IDs
  recommendedAction: text("recommendedAction"),
  status: mysqlEnum("status", ["active", "monitoring", "resolved"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Document Management with Hall of Records
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  documentNumber: varchar("documentNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["sop", "batch_record", "quality_report", "compliance", "training", "safety", "other"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 50 }),
  fileSize: int("fileSize"), // Bytes
  version: varchar("version", { length: 50 }).notNull(),
  isHallOfRecords: boolean("isHallOfRecords").default(false), // Time-protected documents
  isPublic: boolean("isPublic").default(false),
  uploadedBy: int("uploadedBy").notNull(),
  approvedBy: int("approvedBy"),
  approvalDate: timestamp("approvalDate"),
  expirationDate: date("expirationDate"),
  tags: text("tags"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Document Change History
export const documentChanges = mysqlTable("documentChanges", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull().references(() => documents.id),
  changeType: mysqlEnum("changeType", ["created", "amended", "corrected", "modified", "approved"]).notNull(),
  changeDescription: text("changeDescription").notNull(),
  previousVersion: varchar("previousVersion", { length: 50 }),
  newVersion: varchar("newVersion", { length: 50 }),
  changedBy: int("changedBy").notNull(),
  changeOrderNumber: varchar("changeOrderNumber", { length: 100 }),
  justification: text("justification"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Sales Metrics (for dashboard)
export const salesMetrics = mysqlTable("salesMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricDate: date("metricDate").notNull(),
  quotesGenerated: int("quotesGenerated").default(0),
  ordersReceived: int("ordersReceived").default(0),
  shipmentsCompleted: int("shipmentsCompleted").default(0),
  receivingCompleted: int("receivingCompleted").default(0),
  expectedSales: decimal("expectedSales", { precision: 12, scale: 2 }),
  actualSales: decimal("actualSales", { precision: 12, scale: 2 }),
  expensesClearing: decimal("expensesClearing", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
export type Grievance = typeof grievances.$inferSelect;
export type InsertGrievance = typeof grievances.$inferInsert;
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;
export type RawMaterialAlert = typeof rawMaterialAlerts.$inferSelect;
export type InsertRawMaterialAlert = typeof rawMaterialAlerts.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Shopping Cart
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  notes: text("notes"), // Special instructions or notes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userProductIdx: index("user_product_idx").on(table.userId, table.productId),
}));

// Quote Requests
export const quoteRequests = mysqlTable("quoteRequests", {
  id: int("id").autoincrement().primaryKey(),
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  customerId: int("customerId").references(() => customers.id),
  status: mysqlEnum("status", ["pending", "reviewed", "quoted", "accepted", "declined", "expired"]).default("pending").notNull(),
  items: text("items").notNull(), // JSON array of {productId, quantity, notes}
  totalEstimate: decimal("totalEstimate", { precision: 12, scale: 2 }),
  notes: text("notes"),
  deliveryAddress: text("deliveryAddress"),
  requestedDeliveryDate: date("requestedDeliveryDate"),
  quotedBy: int("quotedBy"), // Admin user who provided quote
  quotedAt: timestamp("quotedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  quoteNumberIdx: index("quote_number_idx").on(table.quoteNumber),
  userIdx: index("user_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

// ============ PRICING TIERS ============

export const pricingTiers = mysqlTable("pricingTiers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  minQuantity: int("minQuantity").notNull(),
  maxQuantity: int("maxQuantity"),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).notNull(),
  discountedPrice: decimal("discountedPrice", { precision: 10, scale: 2 }),
  tierName: varchar("tierName", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = typeof pricingTiers.$inferInsert;
