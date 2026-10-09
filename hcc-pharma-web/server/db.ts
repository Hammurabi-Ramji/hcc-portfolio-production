import { eq, desc, and, sql, lt, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  customers,
  vendors,
  products,
  orders,
  orderItems,
  inventoryLots,
  manufacturingBatches,
  qualityTests,
  deviations,
  auditTrail,
  purchaseOrders,
  type Customer,
  type Vendor,
  type Product,
  type Order,
  type InventoryLot,
  type Deviation,
  type AuditTrail,
  type PurchaseOrder,
  type ManufacturingBatch,
  type QualityTest,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER MANAGEMENT ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

// ============ CUSTOMER MANAGEMENT ============

export async function getCustomers(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customers).where(eq(customers.isActive, true)).limit(limit).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0] || null;
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(data) as any;
  return Number(result.insertId);
}

export async function updateCustomer(id: number, data: Partial<Customer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customers).set({ isActive: false }).where(eq(customers.id, id));
}

// ============ VENDOR MANAGEMENT ============

export async function getVendors(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vendors).where(eq(vendors.isActive, true)).limit(limit).orderBy(desc(vendors.createdAt));
}

export async function getVendorById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  return result[0] || null;
}

export async function createVendor(data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vendors).values(data) as any;
  return Number(result.insertId);
}

// ============ PRODUCT MANAGEMENT ============

export async function getProducts(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.isActive, true)).limit(limit).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data) as any;
  return Number(result.insertId);
}

export async function searchProducts(searchTerm: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products)
    .where(
      and(
        eq(products.isActive, true),
        sql`(${products.name} LIKE ${`%${searchTerm}%`} OR ${products.sku} LIKE ${`%${searchTerm}%`} OR ${products.category} LIKE ${`%${searchTerm}%`})`
      )
    )
    .limit(limit);
}

// ============ ORDER MANAGEMENT ============

export async function getOrders(customerId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (customerId) {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).limit(limit).orderBy(desc(orders.orderDate));
  }
  
  return await db.select().from(orders).limit(limit).orderBy(desc(orders.orderDate));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: orderItems.id,
    orderId: orderItems.orderId,
    productId: orderItems.productId,
    productName: products.name,
    sku: products.sku,
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    totalPrice: orderItems.totalPrice,
  })
  .from(orderItems)
  .leftJoin(products, eq(orderItems.productId, products.id))
  .where(eq(orderItems.orderId, orderId));
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, items: Array<{ productId: number; quantity: number; unitPrice: string; totalPrice: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const orderResult = await db.insert(orders).values(orderData) as any;
  const orderId = orderResult.insertId;
  
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(item => ({
      ...item,
      orderId: Number(orderId),
    })));
  }
  
  return orderId;
}

export async function updateOrderStatus(id: number, status: Order['status']) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ============ INVENTORY MANAGEMENT ============

export async function getInventoryLots(productId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (productId) {
    return await db.select().from(inventoryLots).where(eq(inventoryLots.productId, productId)).limit(limit).orderBy(inventoryLots.expirationDate);
  }
  
  return await db.select().from(inventoryLots).limit(limit).orderBy(inventoryLots.expirationDate);
}

export async function getLowStockProducts(threshold: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    productId: inventoryLots.productId,
    productName: products.name,
    sku: products.sku,
    totalAvailable: sql<number>`SUM(${inventoryLots.quantityAvailable})`,
  })
  .from(inventoryLots)
  .leftJoin(products, eq(inventoryLots.productId, products.id))
  .where(eq(inventoryLots.status, 'available'))
  .groupBy(inventoryLots.productId, products.name, products.sku)
  .having(sql`SUM(${inventoryLots.quantityAvailable}) < ${threshold}`);
}

export async function getExpiringLots(daysAhead: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return await db.select({
    id: inventoryLots.id,
    lotNumber: inventoryLots.lotNumber,
    productName: products.name,
    quantityAvailable: inventoryLots.quantityAvailable,
    expirationDate: inventoryLots.expirationDate,
  })
  .from(inventoryLots)
  .leftJoin(products, eq(inventoryLots.productId, products.id))
  .where(
    and(
      eq(inventoryLots.status, 'available'),
      lt(inventoryLots.expirationDate, futureDate)
    )
  )
  .orderBy(inventoryLots.expirationDate);
}

// ============ DEVIATION MANAGEMENT ============

export async function getDeviations(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deviations).limit(limit).orderBy(desc(deviations.reportedDate));
}

export async function getDeviationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deviations).where(eq(deviations.id, id)).limit(1);
  return result[0] || null;
}

export async function createDeviation(data: Omit<Deviation, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deviations).values(data) as any;
  return Number(result.insertId);
}

export async function updateDeviation(id: number, data: Partial<Deviation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deviations).set(data).where(eq(deviations.id, id));
}

// ============ AUDIT TRAIL ============

export async function logAudit(data: Omit<AuditTrail, 'id' | 'timestamp'>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditTrail).values(data);
}

export async function getAuditTrail(limit: number = 100, userId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return await db.select().from(auditTrail).where(eq(auditTrail.userId, userId)).limit(limit).orderBy(desc(auditTrail.timestamp));
  }
  
  return await db.select().from(auditTrail).limit(limit).orderBy(desc(auditTrail.timestamp));
}

// ============ PURCHASE ORDERS (Vendor Portal) ============

export async function getPurchaseOrders(vendorId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (vendorId) {
    return await db.select().from(purchaseOrders).where(eq(purchaseOrders.vendorId, vendorId)).limit(limit).orderBy(desc(purchaseOrders.orderDate));
  }
  
  return await db.select().from(purchaseOrders).limit(limit).orderBy(desc(purchaseOrders.orderDate));
}

export async function createPurchaseOrder(data: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseOrders).values(data) as any;
  return Number(result.insertId);
}

// ============ MANUFACTURING & QUALITY ============

export async function getManufacturingBatches(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(manufacturingBatches).limit(limit).orderBy(desc(manufacturingBatches.startDate));
}

export async function createManufacturingBatch(data: Omit<ManufacturingBatch, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(manufacturingBatches).values(data) as any;
  return Number(result.insertId);
}

export async function getQualityTests(batchId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(qualityTests).where(eq(qualityTests.batchId, batchId)).orderBy(desc(qualityTests.testDate));
}

export async function createQualityTest(data: Omit<QualityTest, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(qualityTests).values(data) as any;
  return Number(result.insertId);
}

// ============ DASHBOARD METRICS ============

export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return null;
  
  const [totalOrders] = await db.select({ count: sql<number>`COUNT(*)` }).from(orders);
  const [totalRevenue] = await db.select({ sum: sql<string>`SUM(${orders.totalAmount})` }).from(orders).where(eq(orders.status, 'delivered'));
  const [activeCustomers] = await db.select({ count: sql<number>`COUNT(*)` }).from(customers).where(eq(customers.isActive, true));
  const [pendingOrders] = await db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(eq(orders.status, 'pending'));
  const [openDeviations] = await db.select({ count: sql<number>`COUNT(*)` }).from(deviations).where(eq(deviations.status, 'open'));
  
  return {
    totalOrders: totalOrders?.count || 0,
    totalRevenue: parseFloat(totalRevenue?.sum || '0'),
    activeCustomers: activeCustomers?.count || 0,
    pendingOrders: pendingOrders?.count || 0,
    openDeviations: openDeviations?.count || 0,
  };
}
