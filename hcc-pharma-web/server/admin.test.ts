import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@radixlabs.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Admin Dashboard Features", () => {
  it("should fetch sales metrics for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.admin.getSalesMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics).toHaveProperty("quotesGenerated");
    expect(metrics).toHaveProperty("ordersReceived");
    expect(metrics).toHaveProperty("shipmentsCompleted");
    expect(metrics).toHaveProperty("expectedSales");
  });

  it("should fetch batch status for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.admin.getBatchStatus();
    
    expect(status).toBeDefined();
    expect(status).toHaveProperty("planned");
    expect(status).toHaveProperty("inProgress");
    expect(status).toHaveProperty("completed");
    expect(status).toHaveProperty("failed");
  });

  it("should fetch low inventory alerts", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.admin.getLowInventoryAlerts();
    
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should fetch employees in office", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const employees = await caller.admin.getEmployeesInOffice();
    
    expect(Array.isArray(employees)).toBe(true);
  });

  it("should fetch raw material alerts", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.admin.getRawMaterialAlerts();
    
    expect(Array.isArray(alerts)).toBe(true);
  });
});

describe("Customer CRUD Operations", () => {
  it("should list customers", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const customers = await caller.customers.list();
    
    expect(Array.isArray(customers)).toBe(true);
  });
});

describe("Vendor CRUD Operations", () => {
  it("should list vendors", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const vendors = await caller.vendors.list();
    
    expect(Array.isArray(vendors)).toBe(true);
  });
});

describe("Product CRUD Operations", () => {
  it("should list products", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    
    expect(Array.isArray(products)).toBe(true);
  });

  it("should search products", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.products.search({ term: "test", limit: 10 });
    
    expect(Array.isArray(results)).toBe(true);
  });
});

describe("Grievance System", () => {
  it("should list grievances for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const grievances = await caller.grievances.list();
    
    expect(Array.isArray(grievances)).toBe(true);
  });
});

describe("Knowledge Base", () => {
  it("should list knowledge articles", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.knowledge.list();
    
    expect(Array.isArray(articles)).toBe(true);
  });
});

describe("Documents", () => {
  it("should list public documents", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.documents.listPublic();
    
    expect(Array.isArray(docs)).toBe(true);
  });
});
