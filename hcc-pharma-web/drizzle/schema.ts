import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, boolean, index } from "drizzle-orm/mysql-core";

/**
 * RADIX LABS - Complete Pharmaceutical Management Database Schema
 * Designed for GMP compliance, 21 CFR Part 11, and large animal pharmaceuticals
 */

// ============ USERS & AUTHENTICATION ============

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "customer", "vendor", "employee", "regulatory"]).default("customer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Extended tables for advanced features
export * from "./schema-extensions";

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("USA").notNull(),
  customerType: mysqlEnum("customerType", ["veterinarian", "distributor", "clinic", "farm", "other"]).default("veterinarian").notNull(),
  taxId: varchar("taxId", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ============ VENDORS ============

export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  vendorType: varchar("vendorType", { length: 100 }).notNull(),
  tier: mysqlEnum("tier", ["platinum", "gold", "silver", "bronze"]).default("bronze").notNull(),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// ============ PRODUCTS ============

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  ndc: varchar("ndc", { length: 50 }),
  productNumber: varchar("productNumber", { length: 100 }),
  size: varchar("size", { length: 100 }),
  specifications: text("specifications"),
  activeIngredients: text("activeIngredients"),
  dosageForm: varchar("dosageForm", { length: 100 }),
  strength: varchar("strength", { length: 100 }),
  imageUrl: text("imageUrl"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  unitOfMeasure: varchar("unitOfMeasure", { length: 50 }).default("unit").notNull(),
  storageConditions: text("storageConditions"),
  shelfLifeDays: int("shelfLifeDays"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  skuIdx: index("sku_idx").on(table.sku),
  categoryIdx: index("category_idx").on(table.category),
}));

export const contactInquiries = mysqlTable("contactInquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  inquiryType: mysqlEnum("inquiryType", ["general", "quote", "support", "partnership", "regulatory"]).default("general").notNull(),
  status: mysqlEnum("status", ["new", "in_progress", "resolved", "closed"]).default("new").notNull(),
  assignedTo: int("assignedTo").references(() => users.id),
  responseNotes: text("responseNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  statusIdx: index("status_idx").on(table.status),
}));

export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = typeof contactInquiries.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ============ ORDERS ============

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  shippingAddress: text("shippingAddress"),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderNumberIdx: index("order_number_idx").on(table.orderNumber),
  customerIdx: index("customer_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ============ ORDER ITEMS ============

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_idx").on(table.orderId),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ============ INVENTORY LOTS ============

export const inventoryLots = mysqlTable("inventoryLots", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  lotNumber: varchar("lotNumber", { length: 100 }).notNull().unique(),
  quantityAvailable: int("quantityAvailable").notNull().default(0),
  quantityAllocated: int("quantityAllocated").notNull().default(0),
  quantityOnHold: int("quantityOnHold").notNull().default(0),
  expirationDate: timestamp("expirationDate").notNull(),
  manufacturingDate: timestamp("manufacturingDate").notNull(),
  storageLocation: varchar("storageLocation", { length: 100 }),
  status: mysqlEnum("status", ["available", "allocated", "quarantined", "expired"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  lotNumberIdx: index("lot_number_idx").on(table.lotNumber),
  productIdx: index("product_idx").on(table.productId),
  expirationIdx: index("expiration_idx").on(table.expirationDate),
}));

export type InventoryLot = typeof inventoryLots.$inferSelect;
export type InsertInventoryLot = typeof inventoryLots.$inferInsert;

// ============ MANUFACTURING BATCHES ============

export const manufacturingBatches = mysqlTable("manufacturingBatches", {
  id: int("id").autoincrement().primaryKey(),
  batchNumber: varchar("batchNumber", { length: 100 }).notNull().unique(),
  productId: int("productId").notNull().references(() => products.id),
  quantityProduced: int("quantityProduced").notNull(),
  startDate: timestamp("startDate").notNull(),
  completionDate: timestamp("completionDate"),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "failed"]).default("planned").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  batchNumberIdx: index("batch_number_idx").on(table.batchNumber),
}));

export type ManufacturingBatch = typeof manufacturingBatches.$inferSelect;
export type InsertManufacturingBatch = typeof manufacturingBatches.$inferInsert;

// ============ QUALITY TESTS ============

export const qualityTests = mysqlTable("qualityTests", {
  id: int("id").autoincrement().primaryKey(),
  batchId: int("batchId").notNull().references(() => manufacturingBatches.id),
  testType: varchar("testType", { length: 100 }).notNull(),
  testDate: timestamp("testDate").defaultNow().notNull(),
  result: mysqlEnum("result", ["pass", "fail", "pending"]).default("pending").notNull(),
  testedBy: int("testedBy").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  batchIdx: index("batch_idx").on(table.batchId),
}));

export type QualityTest = typeof qualityTests.$inferSelect;
export type InsertQualityTest = typeof qualityTests.$inferInsert;

// ============ DEVIATIONS ============

export const deviations = mysqlTable("deviations", {
  id: int("id").autoincrement().primaryKey(),
  deviationNumber: varchar("deviationNumber", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: mysqlEnum("severity", ["critical", "major", "minor"]).notNull(),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "closed"]).default("open").notNull(),
  reportedBy: int("reportedBy").notNull().references(() => users.id),
  reportedDate: timestamp("reportedDate").defaultNow().notNull(),
  affectedBatch: varchar("affectedBatch", { length: 100 }),
  rootCause: text("rootCause"),
  correctiveAction: text("correctiveAction"),
  closedDate: timestamp("closedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  deviationNumberIdx: index("deviation_number_idx").on(table.deviationNumber),
  statusIdx: index("status_idx").on(table.status),
}));

export type Deviation = typeof deviations.$inferSelect;
export type InsertDeviation = typeof deviations.$inferInsert;

// ============ AUDIT TRAIL ============

export const auditTrail = mysqlTable("auditTrail", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: int("resourceId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  resourceIdx: index("resource_idx").on(table.resource),
}));

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = typeof auditTrail.$inferInsert;

// ============ PURCHASE ORDERS (for Vendors) ============

export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("poNumber", { length: 100 }).notNull().unique(),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  expectedDelivery: timestamp("expectedDelivery"),
  status: mysqlEnum("status", ["pending", "confirmed", "shipped", "received", "cancelled"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  poNumberIdx: index("po_number_idx").on(table.poNumber),
  vendorIdx: index("vendor_idx").on(table.vendorId),
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ============ DOCUSIGN SIGNATURE REQUESTS ============

export const signatureRequests = mysqlTable("sigRequests", {
  id: int("id").autoincrement().primaryKey(),
  envelopeId: varchar("envelopeId", { length: 255 }).notNull().unique(),
  documentId: varchar("documentId", { length: 255 }).notNull(),
  documentName: varchar("documentName", { length: 255 }).notNull(),
  documentType: mysqlEnum("documentType", ["batch_record", "coa", "compliance_report", "deviation"]).notNull(),
  status: mysqlEnum("status", ["created", "sent", "delivered", "signed", "completed", "declined", "voided"]).notNull(),
  signingUrl: text("signingUrl"),
  signedDocumentUrl: text("signedDocumentUrl"),
  requestedBy: int("requestedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  envelopeIdx: index("envelope_idx").on(table.envelopeId),
  statusIdx: index("sig_status_idx").on(table.status),
}));

export type SignatureRequest = typeof signatureRequests.$inferSelect;
export type InsertSignatureRequest = typeof signatureRequests.$inferInsert;

export const signatureRequestSigners = mysqlTable("sigSigners", {
  id: int("id").autoincrement().primaryKey(),
  signatureRequestId: int("signatureRequestId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  order: int("order"),
  status: varchar("status", { length: 50 }).notNull(),
  signedAt: timestamp("signedAt"),
}, (table) => ({
  requestIdx: index("sig_request_idx").on(table.signatureRequestId),
}));

export type SignatureRequestSigner = typeof signatureRequestSigners.$inferSelect;
export type InsertSignatureRequestSigner = typeof signatureRequestSigners.$inferInsert;

// ============ VENDOR PERFORMANCE SCORECARD ============

export const vendorPerformanceMetrics = mysqlTable("vendor_performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendor_id").notNull(),
  metricDate: date("metric_date").notNull(),
  
  // Delivery Metrics
  totalDeliveries: int("total_deliveries").notNull().default(0),
  onTimeDeliveries: int("on_time_deliveries").notNull().default(0),
  lateDeliveries: int("late_deliveries").notNull().default(0),
  averageDeliveryDays: decimal("average_delivery_days", { precision: 5, scale: 2 }),
  deliveryScore: decimal("delivery_score", { precision: 5, scale: 2 }), // 0-100
  
  // Quality Metrics
  totalInspections: int("total_inspections").notNull().default(0),
  passedInspections: int("passed_inspections").notNull().default(0),
  failedInspections: int("failed_inspections").notNull().default(0),
  defectRate: decimal("defect_rate", { precision: 5, scale: 2 }), // percentage
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }), // 0-100
  
  // Pricing Metrics
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }),
  marketAveragePrice: decimal("market_average_price", { precision: 10, scale: 2 }),
  priceCompetitiveness: decimal("price_competitiveness", { precision: 5, scale: 2 }), // percentage vs market
  priceStability: decimal("price_stability", { precision: 5, scale: 2 }), // lower is better
  pricingScore: decimal("pricing_score", { precision: 5, scale: 2 }), // 0-100
  
  // Overall Score
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }), // 0-100
  tier: mysqlEnum("tier", ["platinum", "gold", "silver", "bronze", "probation"]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const vendorPerformanceHistory = mysqlTable("vendor_performance_history", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendor_id").notNull(),
  eventType: mysqlEnum("event_type", ["delivery", "quality_inspection", "price_change", "issue"]).notNull(),
  eventDate: timestamp("event_date").notNull(),
  
  // Delivery Event
  deliveryStatus: mysqlEnum("delivery_status", ["on_time", "late", "early"]),
  daysLate: int("days_late"), // negative for early
  
  // Quality Event
  inspectionResult: mysqlEnum("inspection_result", ["pass", "fail", "conditional"]),
  defectsFound: int("defects_found"),
  
  // Pricing Event
  priceChange: decimal("price_change", { precision: 10, scale: 2 }),
  priceChangePercent: decimal("price_change_percent", { precision: 5, scale: 2 }),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VendorPerformanceMetric = typeof vendorPerformanceMetrics.$inferSelect;
export type InsertVendorPerformanceMetric = typeof vendorPerformanceMetrics.$inferInsert;
export type VendorPerformanceHistory = typeof vendorPerformanceHistory.$inferSelect;
export type InsertVendorPerformanceHistory = typeof vendorPerformanceHistory.$inferInsert;
