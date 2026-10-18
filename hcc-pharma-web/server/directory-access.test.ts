import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function contextFor(role: AuthenticatedUser["role"]): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: `${role}-user`,
    email: `${role}@example.test`,
    name: `${role} user`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// Customer and vendor directories contain contact details and tax IDs.
// Only admins may read them; the access check runs before any database call.
describe("customer and vendor directory access", () => {
  const nonAdminRoles: AuthenticatedUser["role"][] = ["customer", "vendor", "employee", "regulatory"];

  for (const role of nonAdminRoles) {
    it(`rejects ${role} reads with FORBIDDEN`, async () => {
      const caller = appRouter.createCaller(contextFor(role));
      await expect(caller.customers.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.customers.get({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.vendors.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.vendors.get({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  }

  it("rejects anonymous reads with UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller({ ...contextFor("admin"), user: null });
    await expect(caller.customers.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.vendors.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
