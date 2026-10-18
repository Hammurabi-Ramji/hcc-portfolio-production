import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { generateBatchRecordPDF, generateCOAPDF, generateComplianceReportPDF } from "./pdf-generator";
import { sendLowInventoryAlert, sendQualityDeviationAlert, sendBatchCompletionAlert } from "./email-notifications";
import { generateOSINTReport, getMaterialForecast, checkMaterialShortage, getMonitoredMaterials } from "./osint-monitoring";

// ============ ROLE-BASED PROCEDURES ============

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'customer' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

const vendorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'vendor' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Vendor access required' });
  }
  return next({ ctx });
});

const employeeProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'employee' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Employee access required' });
  }
  return next({ ctx });
});

const regulatoryProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'regulatory' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Regulatory access required' });
  }
  return next({ ctx });
});

// ============ MAIN APP ROUTER ============

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ DASHBOARD ============
  
  dashboard: router({
    metrics: protectedProcedure.query(async () => {
      return await db.getDashboardMetrics();
    }),
    
    lowStock: employeeProcedure.query(async () => {
      return await db.getLowStockProducts(10);
    }),
    
    expiringLots: employeeProcedure.query(async () => {
      return await db.getExpiringLots(30);
    }),
  }),

  // ============ CUSTOMERS ============
  
  // The directory holds contact details and tax IDs, so reads are admin-only,
  // matching the mutations below.
  customers: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getCustomers(input?.limit);
      }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCustomerById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        userId: z.number().optional(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().default('USA'),
        customerType: z.enum(['veterinarian', 'distributor', 'clinic', 'farm', 'other']),
        taxId: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createCustomer({
          ...input,
          userId: input.userId ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          zipCode: input.zipCode ?? null,
          taxId: input.taxId ?? null,
        });
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateCustomer(input.id, input.data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCustomer(input.id);
        return { success: true };
      }),
  }),

  // ============ VENDORS ============
  
  // Vendor records include contact details and tax IDs; reads are admin-only.
  vendors: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getVendors(input?.limit);
      }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVendorById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        userId: z.number().optional(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        vendorType: z.string(),
        tier: z.enum(['platinum', 'gold', 'silver', 'bronze']).default('bronze'),
        performanceScore: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createVendor({
          ...input,
          userId: input.userId ?? null,
          phone: input.phone ?? null,
          address: input.address ?? null,
          performanceScore: input.performanceScore ?? null,
        });
        return { id };
      }),
    
    // Vendor Performance Scorecards
    getPerformanceScorecards: adminProcedure
      .query(async () => {
        const { generateSampleVendorPerformance } = await import('./vendor-scoring');
        const vendors = await db.getVendors();
        return vendors.map(v => ({
          vendorId: v.id,
          vendorName: v.name,
          ...generateSampleVendorPerformance(v.id, v.name)
        }));
      }),
    
    getTopPerformers: adminProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const { generateSampleVendorPerformance } = await import('./vendor-scoring');
        const vendors = await db.getVendors();
        const scorecards = vendors.map(v => ({
          vendorId: v.id,
          vendorName: v.name,
          ...generateSampleVendorPerformance(v.id, v.name)
        }));
        return scorecards
          .filter(s => s.overallScore >= 80)
          .sort((a, b) => b.overallScore - a.overallScore)
          .slice(0, input.limit);
      }),
    
    getUnderperformers: adminProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const { generateSampleVendorPerformance } = await import('./vendor-scoring');
        const vendors = await db.getVendors();
        const scorecards = vendors.map(v => ({
          vendorId: v.id,
          vendorName: v.name,
          ...generateSampleVendorPerformance(v.id, v.name)
        }));
        return scorecards
          .filter(s => s.overallScore < 70)
          .sort((a, b) => a.overallScore - b.overallScore)
          .slice(0, input.limit);
      }),
  }),

  // ============ PRODUCTS ============
  
  products: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getProducts(input?.limit);
      }),
    
    search: publicProcedure
      .input(z.object({ term: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.searchProducts(input.term, input.limit);
      }),
    
    searchWithFilters: publicProcedure
      .input(z.object({
        keyword: z.string().optional(),
        category: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        ndc: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const dbExt = await import("./db-extended");
        return await dbExt.searchProductsWithFilters(input);
      }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),
    
    getPricingTiers: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        const dbExt = await import("./db-extended");
        return await dbExt.getPricingTiersByProductId(input.productId);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        sku: z.string(),
        description: z.string().optional(),
        category: z.string(),
        subcategory: z.string().optional(),
        ndc: z.string().optional(),
        productNumber: z.string().optional(),
        size: z.string().optional(),
        specifications: z.string().optional(),
        activeIngredients: z.string().optional(),
        dosageForm: z.string().optional(),
        strength: z.string().optional(),
        imageUrl: z.string().optional(),
        unitPrice: z.string(),
        unitOfMeasure: z.string().default('unit'),
        storageConditions: z.string().optional(),
        shelfLifeDays: z.number().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProduct({
          ...input,
          description: input.description ?? null,
          subcategory: input.subcategory ?? null,
          ndc: input.ndc ?? null,
          productNumber: input.productNumber ?? null,
          size: input.size ?? null,
          specifications: input.specifications ?? null,
          activeIngredients: input.activeIngredients ?? null,
          dosageForm: input.dosageForm ?? null,
          strength: input.strength ?? null,
          imageUrl: input.imageUrl ?? null,
          storageConditions: input.storageConditions ?? null,
          shelfLifeDays: input.shelfLifeDays ?? null,
        });
        return { id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          sku: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          ndc: z.string().optional(),
          unitPrice: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { updateProduct } = await import("./db-extended");
        await updateProduct(input.id, input.data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteProduct } = await import("./db-extended");
        await deleteProduct(input.id);
        return { success: true };
      }),
  }),

  // ============ ORDERS ============
  
  orders: router({
    list: protectedProcedure
      .input(z.object({ customerId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        // Customers can only see their own orders
        if (ctx.user.role === 'customer') {
          // TODO: Get customer ID from user
          return await db.getOrders(undefined, input?.limit);
        }
        return await db.getOrders(input?.customerId, input?.limit);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        const items = await db.getOrderItems(input.id);
        return { ...order, items };
      }),
    
    create: customerProcedure
      .input(z.object({
        orderNumber: z.string(),
        customerId: z.number(),
        totalAmount: z.string(),
        shippingAddress: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          unitPrice: z.string(),
          totalPrice: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, ...orderData } = input;
        const id = await db.createOrder({
          ...orderData,
          shippingAddress: orderData.shippingAddress ?? null,
          notes: orderData.notes ?? null,
          trackingNumber: null,
          orderDate: new Date(),
          status: 'pending' as const,
        }, items);
        
        // Log audit trail
        await db.logAudit({
          userId: orderData.customerId,
          action: 'CREATE',
          resource: 'order',
          resourceId: Number(id),
          details: `Created order ${orderData.orderNumber}`,
          ipAddress: null,
          userAgent: null,
        });
        
        // Send order confirmation email
        try {
          const { sendOrderConfirmationEmail } = await import("./email-service");
          const customer = await db.getCustomerById(orderData.customerId);
          const products = await db.getProducts();
          const itemsWithDetails = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              productName: product?.name || `Product #${item.productId}`,
              quantity: item.quantity,
              price: parseFloat(item.unitPrice),
            };
          });
          
          if (customer?.email) {
            await sendOrderConfirmationEmail({
              customerEmail: customer.email,
              customerName: customer.name,
              orderNumber: orderData.orderNumber,
              items: itemsWithDetails,
              total: parseFloat(orderData.totalAmount),
            });
          }
        } catch (error) {
          console.error("Failed to send order confirmation email:", error);
        }
        
        return { id };
      }),
    
    updateStatus: employeeProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
        trackingNumber: z.string().optional(),
        carrier: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateOrderStatus(input.id, input.status);
        
        // Log audit trail
        await db.logAudit({
          userId: ctx.user.id,
          action: 'UPDATE_STATUS',
          resource: 'order',
          resourceId: input.id,
          details: `Updated order status to ${input.status}`,
          ipAddress: null,
          userAgent: null,
        });
        
        // Send shipping notification email if status is shipped
        if (input.status === 'shipped') {
          try {
            const { sendShippingNotificationEmail } = await import("./email-service");
            const order = await db.getOrderById(input.id);
            if (order) {
              const customer = await db.getCustomerById(order.customerId);
              if (customer?.email) {
                await sendShippingNotificationEmail({
                  customerEmail: customer.email,
                  customerName: customer.name,
                  orderNumber: order.orderNumber,
                  trackingNumber: input.trackingNumber,
                  carrier: input.carrier,
                });
              }
            }
          } catch (error) {
            console.error("Failed to send shipping notification:", error);
          }
        }
        
        return { success: true };
      }),
  }),

  // ============ INVENTORY ============
  
  inventory: router({
    lots: employeeProcedure
      .input(z.object({ productId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getInventoryLots(input?.productId, input?.limit);
      }),
    
    lowStock: employeeProcedure.query(async () => {
      return await db.getLowStockProducts(10);
    }),
    
    expiring: employeeProcedure.query(async () => {
      return await db.getExpiringLots(30);
    }),
  }),

  // ============ DEVIATIONS ============
  
  deviations: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getDeviations(input?.limit);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeviationById(input.id);
      }),
    
    create: employeeProcedure
      .input(z.object({
        deviationNumber: z.string(),
        title: z.string(),
        description: z.string(),
        severity: z.enum(['critical', 'major', 'minor']),
        affectedBatch: z.string().optional(),
        reportedBy: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createDeviation({
          ...input,
          affectedBatch: input.affectedBatch ?? null,
          rootCause: null,
          correctiveAction: null,
          closedDate: null,
          reportedDate: new Date(),
          status: 'open' as const,
        });
        
        // Log audit trail
        await db.logAudit({
          userId: ctx.user.id,
          action: 'CREATE',
          resource: 'deviation',
          resourceId: Number(id),
          details: `Created deviation ${input.deviationNumber}`,
          ipAddress: null,
          userAgent: null,
        });
        
        return { id };
      }),
    
    update: employeeProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(['open', 'investigating', 'resolved', 'closed']).optional(),
          rootCause: z.string().optional(),
          correctiveAction: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateDeviation(input.id, input.data);
        
        // Log audit trail
        await db.logAudit({
          userId: ctx.user.id,
          action: 'UPDATE',
          resource: 'deviation',
          resourceId: input.id,
          details: `Updated deviation`,
          ipAddress: null,
          userAgent: null,
        });
        
        return { success: true };
      }),
  }),

  // ============ AUDIT TRAIL ============
  
  audit: router({
    list: regulatoryProcedure
      .input(z.object({ userId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAuditTrail(input?.limit, input?.userId);
      }),
  }),

  // ============ PURCHASE ORDERS (Vendor Portal) ============
  
  purchaseOrders: router({
    list: vendorProcedure
      .input(z.object({ vendorId: z.number().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getPurchaseOrders(input?.vendorId, input?.limit);
      }),
    
    create: adminProcedure
      .input(z.object({
        poNumber: z.string(),
        vendorId: z.number(),
        expectedDelivery: z.date().optional(),
        totalAmount: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createPurchaseOrder({
          ...input,
          notes: input.notes ?? null,
          expectedDelivery: input.expectedDelivery ?? null,
          orderDate: new Date(),
          status: 'pending' as const,
        });
        return { id };
      }),
  }),

  // ============ MANUFACTURING (Employee Portal) ============
  
  manufacturing: router({
    batches: employeeProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getManufacturingBatches(input?.limit);
      }),
    
    createBatch: employeeProcedure
      .input(z.object({
        batchNumber: z.string(),
        productId: z.number(),
        quantityProduced: z.number(),
        startDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createManufacturingBatch({
          ...input,
          notes: input.notes ?? null,
          completionDate: null,
          status: 'planned' as const,
        });
        
        // Log audit trail
        await db.logAudit({
          userId: ctx.user.id,
          action: 'CREATE',
          resource: 'manufacturing_batch',
          resourceId: Number(id),
          details: `Created manufacturing batch ${input.batchNumber}`,
          ipAddress: null,
          userAgent: null,
        });
        
        return { id };
      }),
    
    qualityTests: employeeProcedure
      .input(z.object({ batchId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQualityTests(input.batchId);
      }),
    
    createQualityTest: employeeProcedure
      .input(z.object({
        batchId: z.number(),
        testType: z.string(),
        result: z.enum(['pass', 'fail', 'pending']),
        testedBy: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createQualityTest({
          ...input,
          notes: input.notes ?? null,
          testDate: new Date(),
        });
        
        // Log audit trail
        await db.logAudit({
          userId: ctx.user.id,
          action: 'CREATE',
          resource: 'quality_test',
          resourceId: Number(id),
          details: `Created quality test for batch ${input.batchId}`,
          ipAddress: null,
          userAgent: null,
        });
        
        return { id };
      }),
  }),

  // ============ GRIEVANCES ============
  
  grievances: router({
    list: protectedProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getGrievances(undefined, 50);
    }),
    
    create: protectedProcedure
      .input(z.object({
        category: z.enum(["workplace_safety", "harassment", "discrimination", "policy_violation", "other"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        description: z.string(),
        desiredOutcome: z.string().nullable(),
        isAnonymous: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbExt = await import("./db-extended");
        const grievanceNumber = `GRV-${Date.now()}`;
        const id = await dbExt.createGrievance({
          grievanceNumber,
          category: input.category,
          severity: input.severity,
          description: input.description,
          desiredOutcome: input.desiredOutcome,
          status: "submitted",
          isAnonymous: input.isAnonymous,
          submittedBy: input.isAnonymous ? null : ctx.user.id,
          assignedTo: null,
          resolutionNotes: null,
          resolutionDate: null,
        });
        return { id };
      }),
  }),

  // ============ KNOWLEDGE BASE ============
  
  knowledge: router({
    list: protectedProcedure
      .input(z.object({ department: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const dbExt = await import("./db-extended");
        if (input?.department) {
          return await dbExt.getKnowledgeArticlesByDepartment(input.department);
        }
        // Return all published articles
        const db = await import("./db");
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];
        const { knowledgeArticles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return await dbInstance.select().from(knowledgeArticles).where(eq(knowledgeArticles.isPublished, true));
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await import("./db");
        const dbInstance = await db.getDb();
        if (!dbInstance) return null;
        const { knowledgeArticles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const articles = await dbInstance.select().from(knowledgeArticles).where(eq(knowledgeArticles.id, input.id)).limit(1);
        
        // Increment views
        const dbExt = await import("./db-extended");
        await dbExt.incrementArticleViews(input.id);
        
        return articles.length > 0 ? articles[0] : null;
      }),
  }),

  // ============ DOCUMENTS ============
  
  documents: router({
    listPublic: publicProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getPublicDocuments();
    }),
    
    list: protectedProcedure.query(async () => {
      const db = await import("./db");
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];
      const { documents } = await import("../drizzle/schema");
      return await dbInstance.select().from(documents).limit(100);
    }),
  }),

  // ============ ADMIN / SUPER DASHBOARD ============
  
  admin: router({
    getSalesMetrics: adminProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getTodaysSalesMetrics();
    }),
    
    getEmployeesInOffice: adminProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getEmployeesInOffice();
    }),
    
    getEmployeesOutOfOffice: adminProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getEmployeesOutOfOffice();
    }),
    
    getLowInventoryAlerts: adminProcedure.query(async () => {
      // Mock data for now - will be replaced with actual inventory logic
      return [];
    }),
    
    getBatchStatus: adminProcedure.query(async () => {
      const batches = await db.getManufacturingBatches(100);
      return {
        planned: batches.filter((b: any) => b.status === 'planned').length,
        inProgress: batches.filter((b: any) => b.status === 'in_progress').length,
        completed: batches.filter((b: any) => b.status === 'completed').length,
        failed: batches.filter((b: any) => b.status === 'failed').length,
      };
    }),
    
    getUpcomingAnniversaries: adminProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getUpcomingAnniversaries(30);
    }),
    
    getEmployeesNeedingTimeOff: adminProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getEmployeesNeedingTimeOff(10);
    }),
    
    getRawMaterialAlerts: adminProcedure.query(async () => {
      const dbExt = await import("./db-extended");
      return await dbExt.getActiveRawMaterialAlerts();
    }),
  }),

  // ============ CONTACT FORM ============
  
  contact: router({    submitInquiry: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        phone: z.string().optional(),
        company: z.string().optional(),
        subject: z.string().min(1, "Subject is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
        inquiryType: z.enum(["general", "quote", "support", "partnership", "regulatory"]).default("general"),
      }))
      .mutation(async ({ input }) => {
        const dbExt = await import("./db-extended");
        const id = await dbExt.createContactInquiry(input);
        
        // Send notification to owner
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `New Contact Inquiry: ${input.subject}`,
            content: `From: ${input.name} (${input.email})\nCompany: ${input.company || 'N/A'}\nType: ${input.inquiryType}\n\nMessage:\n${input.message}`,
          });
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
        
        return { id, success: true };
      }),
    
    list: adminProcedure
      .input(z.object({ status: z.enum(["new", "in_progress", "resolved", "closed"]).optional() }).optional())
      .query(async ({ input }) => {
        const dbExt = await import("./db-extended");
        return await dbExt.getContactInquiries(input?.status);
      }),
  }),

  // ============ SHOPPING CART ============
  
  cart: router({    list: protectedProcedure.query(async ({ ctx }) => {
      const dbExt = await import("./db-extended");
      const cartItems = await dbExt.getCartItems(ctx.user.id);
      
      // Fetch product details for each cart item
      const itemsWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await db.getProductById(item.productId);
          const pricingTiers = product
            ? await dbExt.getPricingTiersByProductId(item.productId)
            : [];

          return { ...item, product, pricingTiers };
        })
      );
      
      return itemsWithProducts;
    }),
    
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbExt = await import("./db-extended");
        const id = await dbExt.addToCart(ctx.user.id, input.productId, input.quantity, input.notes);
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        cartItemId: z.number(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbExt = await import("./db-extended");
        await dbExt.updateCartItem(input.cartItemId, input.quantity, input.notes);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ input }) => {
        const dbExt = await import("./db-extended");
        await dbExt.removeFromCart(input.cartItemId);
        return { success: true };
      }),
    
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      const dbExt = await import("./db-extended");
      await dbExt.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),
  
  // ============ QUOTE REQUESTS ============
  
  quotes: router({    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1),
          notes: z.string().optional(),
        })),
        notes: z.string().optional(),
        deliveryAddress: z.string().optional(),
        requestedDeliveryDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbExt = await import("./db-extended");
        const result = await dbExt.createQuoteRequest({
          userId: ctx.user.id,
          items: input.items,
          notes: input.notes,
          deliveryAddress: input.deliveryAddress,
          requestedDeliveryDate: input.requestedDeliveryDate,
        });
        
        // Send notification to owner
        try {
          const { notifyOwner } = await import("./_core/notification");
          await notifyOwner({
            title: `New Quote Request: ${result.quoteNumber}`,
            content: `From: ${ctx.user.name} (${ctx.user.email})\nItems: ${input.items.length}\n\nNotes: ${input.notes || 'N/A'}`,
          });
        } catch (error) {
          console.error("Failed to send quote notification:", error);
        }
        
        // Send email confirmation to customer
        try {
          const { sendQuoteRequestEmail } = await import("./email-service");
          const products = await db.getProducts();
          const itemsWithNames = input.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              productName: product?.name || `Product #${item.productId}`,
              quantity: item.quantity,
            };
          });
          
          await sendQuoteRequestEmail({
            customerEmail: ctx.user.email || '',
            customerName: ctx.user.name || 'Customer',
            quoteNumber: result.quoteNumber,
            items: itemsWithNames,
          });
        } catch (error) {
          console.error("Failed to send quote email:", error);
        }
        
        return result;
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      const dbExt = await import("./db-extended");
      return await dbExt.getQuoteRequests(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const dbExt = await import("./db-extended");
        return await dbExt.getQuoteRequestById(input.id);
      }),
  }),

  // ============ OSINT MONITORING ============
  
  osint: router({
    generateReport: adminProcedure.query(async () => {
      return await generateOSINTReport();
    }),
    
    getMaterialForecast: adminProcedure
      .input(z.object({ materialName: z.string() }))
      .query(async ({ input }) => {
        return await getMaterialForecast(input.materialName);
      }),
    
    checkShortage: adminProcedure
      .input(z.object({ materialName: z.string() }))
      .query(async ({ input }) => {
        return await checkMaterialShortage(input.materialName);
      }),
    
    getMonitoredMaterials: adminProcedure.query(() => {
      return getMonitoredMaterials();
    }),
  }),
});

export type AppRouter = typeof appRouter;
