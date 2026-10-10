import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { 
  employees, 
  timeEntries, 
  grievances, 
  knowledgeArticles,
  knowledgeSteps,
  employeeAnniversaries,
  rawMaterialAlerts,
  documents,
  documentChanges,
  salesMetrics,
  contactInquiries,
  type InsertEmployee,
  type InsertTimeEntry,
  type InsertGrievance,
  type InsertKnowledgeArticle,
  type InsertRawMaterialAlert,
  type InsertDocument,
  type InsertContactInquiry,
} from "../drizzle/schema";
import { getDb } from "./db";

// Employee Management
export async function getEmployees(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).limit(limit);
}

export async function getEmployeesInOffice() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).where(eq(employees.isInOffice, true));
}

export async function getEmployeesOutOfOffice() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).where(eq(employees.isInOffice, false));
}

export async function getEmployeesNeedingTimeOff(consecutiveDaysThreshold: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).where(gte(employees.consecutiveDaysWorked, consecutiveDaysThreshold));
}

export async function createEmployee(employee: Omit<InsertEmployee, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values(employee);
  return (result as any).insertId as number;
}

// Time Tracking
export async function clockIn(employeeId: number, verificationMethod: "facial_recognition" | "manual" | "badge", faceMatchConfidence?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const entry: Omit<InsertTimeEntry, "id" | "createdAt" | "updatedAt"> = {
    employeeId,
    clockIn: new Date(),
    clockOut: null,
    verificationMethod,
    faceMatchConfidence: faceMatchConfidence ? faceMatchConfidence.toString() : null,
    location: null,
    notes: null,
  };
  
  const result = await db.insert(timeEntries).values(entry);
  
  // Update employee status
  await db.update(employees)
    .set({ isInOffice: true })
    .where(eq(employees.id, employeeId));
  
  return (result as any).insertId as number;
}

export async function clockOut(employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find the most recent clock-in without a clock-out
  const openEntries = await db.select()
    .from(timeEntries)
    .where(and(
      eq(timeEntries.employeeId, employeeId),
      sql`${timeEntries.clockOut} IS NULL`
    ))
    .orderBy(desc(timeEntries.clockIn))
    .limit(1);
  
  if (openEntries.length > 0) {
    await db.update(timeEntries)
      .set({ clockOut: new Date() })
      .where(eq(timeEntries.id, openEntries[0].id));
    
    // Update employee status
    await db.update(employees)
      .set({ isInOffice: false })
      .where(eq(employees.id, employeeId));
    
    return true;
  }
  
  return false;
}

// Grievance System
export async function createGrievance(grievance: Omit<InsertGrievance, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(grievances).values(grievance);
  return (result as any).insertId as number;
}

export async function getGrievances(status?: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return await db.select().from(grievances).where(eq(grievances.status, status as any)).limit(limit);
  }
  
  return await db.select().from(grievances).limit(limit);
}

export async function updateGrievanceStatus(id: number, status: string, resolutionNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (resolutionNotes) {
    updateData.resolutionNotes = resolutionNotes;
    updateData.resolutionDate = new Date();
  }
  
  await db.update(grievances).set(updateData).where(eq(grievances.id, id));
}

// Knowledge Base
export async function createKnowledgeArticle(article: Omit<InsertKnowledgeArticle, "id" | "createdAt" | "updatedAt" | "views">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(knowledgeArticles).values(article);
  return (result as any).insertId as number;
}

export async function getKnowledgeArticlesByDepartment(department: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeArticles)
    .where(and(
      eq(knowledgeArticles.department, department),
      eq(knowledgeArticles.isPublished, true)
    ));
}

export async function incrementArticleViews(articleId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeArticles)
    .set({ views: sql`${knowledgeArticles.views} + 1` })
    .where(eq(knowledgeArticles.id, articleId));
}

// Raw Material Alerts
export async function createRawMaterialAlert(alert: Omit<InsertRawMaterialAlert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rawMaterialAlerts).values(alert);
  return (result as any).insertId as number;
}

export async function getActiveRawMaterialAlerts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rawMaterialAlerts)
    .where(eq(rawMaterialAlerts.status, "active"))
    .orderBy(desc(rawMaterialAlerts.severity));
}

// Document Management
export async function createDocument(document: Omit<InsertDocument, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(document);
  
  // Log the creation in change history
  const documentId = (result as any).insertId as number;
  await db.insert(documentChanges).values({
    documentId,
    changeType: "created",
    changeDescription: "Document created",
    newVersion: document.version,
    changedBy: document.uploadedBy,
    previousVersion: null,
    changeOrderNumber: null,
    justification: null,
  });
  
  return documentId;
}

export async function updateDocument(id: number, updates: any, changedBy: number, changeDescription: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current document
  const current = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (current.length === 0) throw new Error("Document not found");
  
  // Check if it's Hall of Records (cannot be deleted, only amended)
  if (current[0].isHallOfRecords && updates.deleted) {
    throw new Error("Hall of Records documents cannot be deleted");
  }
  
  // Update document
  await db.update(documents).set(updates).where(eq(documents.id, id));
  
  // Log the change
  await db.insert(documentChanges).values({
    documentId: id,
    changeType: "modified",
    changeDescription,
    previousVersion: current[0].version,
    newVersion: updates.version || current[0].version,
    changedBy,
    changeOrderNumber: null,
    justification: null,
  });
}

export async function getPublicDocuments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents).where(eq(documents.isPublic, true));
}

// Sales Metrics
export async function getTodaysSalesMetrics() {
  const db = await getDb();
  if (!db) return { quotesGenerated: 0, ordersReceived: 0, shipmentsCompleted: 0, expectedSales: "0" };
  
  const today = new Date().toISOString().split('T')[0];
  const metrics = await db.select().from(salesMetrics)
    .where(eq(salesMetrics.metricDate, today as any))
    .limit(1);
  
  return metrics.length > 0 ? metrics[0] : { quotesGenerated: 0, ordersReceived: 0, shipmentsCompleted: 0, expectedSales: "0" };
}

export async function updateSalesMetrics(date: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if metrics exist for this date
  const existing = await db.select().from(salesMetrics)
    .where(eq(salesMetrics.metricDate, date as any))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(salesMetrics).set(updates).where(eq(salesMetrics.metricDate, date as any));
  } else {
    await db.insert(salesMetrics).values({ metricDate: date as any, ...updates });
  }
}

// Employee Anniversaries
export async function getUpcomingAnniversaries(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return await db.select()
    .from(employeeAnniversaries)
    .where(and(
      gte(employeeAnniversaries.anniversaryDate, today.toISOString().split('T')[0] as any),
      lte(employeeAnniversaries.anniversaryDate, futureDate.toISOString().split('T')[0] as any),
      eq(employeeAnniversaries.isPublic, true)
    ));
}

// Contact Inquiries
export async function createContactInquiry(inquiry: Omit<InsertContactInquiry, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactInquiries).values(inquiry);
  return result[0].insertId;
}

export async function getContactInquiries(status?: "new" | "in_progress" | "resolved" | "closed") {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return await db.select().from(contactInquiries)
      .where(eq(contactInquiries.status, status))
      .orderBy(desc(contactInquiries.createdAt))
      .limit(100);
  }
  
  return await db.select().from(contactInquiries)
    .orderBy(desc(contactInquiries.createdAt))
    .limit(100);
}

export async function getContactInquiryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(contactInquiries).where(eq(contactInquiries.id, id)).limit(1);
  return results.length > 0 ? results[0] : null;
}

export async function updateContactInquiryStatus(id: number, status: "new" | "in_progress" | "resolved" | "closed", responseNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactInquiries)
    .set({ status, responseNotes: responseNotes || undefined })
    .where(eq(contactInquiries.id, id));
}

// Shopping Cart Functions
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { cartItems } = await import("../drizzle/schema-extensions");
  return await db.select().from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.createdAt));
}

export async function addToCart(userId: number, productId: number, quantity: number = 1, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { cartItems } = await import("../drizzle/schema-extensions");
  
  // Check if item already exists in cart
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    // Update quantity
    await db.update(cartItems)
      .set({ quantity: existing[0].quantity + quantity, notes: notes || existing[0].notes })
      .where(eq(cartItems.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new item
    const result = await db.insert(cartItems).values({ userId, productId, quantity, notes });
    return result[0].insertId;
  }
}

export async function updateCartItem(cartItemId: number, quantity: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { cartItems } = await import("../drizzle/schema-extensions");
  await db.update(cartItems)
    .set({ quantity, notes: notes || undefined })
    .where(eq(cartItems.id, cartItemId));
}

export async function removeFromCart(cartItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { cartItems } = await import("../drizzle/schema-extensions");
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { cartItems } = await import("../drizzle/schema-extensions");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// Quote Request Functions
export async function createQuoteRequest(data: {
  userId: number;
  customerId?: number;
  items: Array<{ productId: number; quantity: number; notes?: string }>;
  notes?: string;
  deliveryAddress?: string;
  requestedDeliveryDate?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { quoteRequests } = await import("../drizzle/schema-extensions");
  
  // Generate quote number
  const quoteNumber = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const result = await db.insert(quoteRequests).values({
    quoteNumber,
    userId: data.userId,
    customerId: data.customerId,
    items: JSON.stringify(data.items),
    notes: data.notes,
    deliveryAddress: data.deliveryAddress,
    requestedDeliveryDate: data.requestedDeliveryDate as any,
  });
  
  return { id: result[0].insertId, quoteNumber };
}

export async function getQuoteRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { quoteRequests } = await import("../drizzle/schema-extensions");
  return await db.select().from(quoteRequests)
    .where(eq(quoteRequests.userId, userId))
    .orderBy(desc(quoteRequests.createdAt))
    .limit(50);
}

export async function getQuoteRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { quoteRequests } = await import("../drizzle/schema-extensions");
  const results = await db.select().from(quoteRequests)
    .where(eq(quoteRequests.id, id))
    .limit(1);
  return results.length > 0 ? results[0] : null;
}

// ============ PRODUCT SEARCH WITH FILTERS ============

export async function searchProductsWithFilters(filters: {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  ndc?: string;
  limit?: number;
}) {
  const { products } = await import("../drizzle/schema");
  const { like, and, gte, lte, or, eq, sql } = await import("drizzle-orm");
  const { getDb } = await import("./db");
  const db = await getDb();
  
  if (!db) {
    return [];
  }
  
  const conditions = [];
  
  // Keyword search (name, description, SKU)
  if (filters.keyword) {
    conditions.push(
      or(
        like(products.name, `%${filters.keyword}%`),
        like(products.description, `%${filters.keyword}%`),
        like(products.sku, `%${filters.keyword}%`)
      )
    );
  }
  
  // Category filter
  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }
  
  // Price range filter
  if (filters.minPrice !== undefined) {
    conditions.push(gte(sql`CAST(${products.unitPrice} AS DECIMAL)`, filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(sql`CAST(${products.unitPrice} AS DECIMAL)`, filters.maxPrice));
  }
  
  // NDC code filter
  if (filters.ndc) {
    conditions.push(like(products.ndc, `%${filters.ndc}%`));
  }
  
  let query = db.select().from(products);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  return await query;
}

// Pricing Tiers Functions
export async function getPricingTiersByProductId(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const { pricingTiers } = await import("../drizzle/schema-extensions");
  return await db.select().from(pricingTiers)
    .where(eq(pricingTiers.productId, productId))
    .orderBy(pricingTiers.minQuantity);
}

// ============ PRODUCTS CRUD ============

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { products } = await import("../drizzle/schema");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { products } = await import("../drizzle/schema");
  await db.delete(products).where(eq(products.id, id));
}
