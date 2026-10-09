import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("customers router", () => {
  it("should list customers", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.list({ limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("customerType");
    }
  });

  it("should have customers with required fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const customers = await caller.customers.list({ limit: 1 });
    if (customers.length > 0) {
      const customer = customers[0];
      expect(customer).toHaveProperty("id");
      expect(customer).toHaveProperty("name");
      expect(customer).toHaveProperty("email");
      expect(customer).toHaveProperty("customerType");
    }
  });
});
