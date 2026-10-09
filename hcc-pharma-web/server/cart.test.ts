import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { User } from "../drizzle/schema";

describe("Shopping Cart", () => {
  const testUser: User = {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "email",
    role: "customer",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const caller = appRouter.createCaller({ user: testUser });

  it("should add item to cart", async () => {
    const result = await caller.cart.add({
      productId: 1,
      quantity: 2,
      notes: "Test note",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should list cart items", async () => {
    const items = await caller.cart.list();
    expect(Array.isArray(items)).toBe(true);
  });

  it("should create quote request", async () => {
    const result = await caller.quotes.create({
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
      notes: "Test quote request",
      deliveryAddress: "123 Test St",
    });

    expect(result.quoteNumber).toBeDefined();
    expect(result.quoteNumber).toMatch(/^QR-/);
  });

  it("should list quote requests", async () => {
    const quotes = await caller.quotes.list();
    expect(Array.isArray(quotes)).toBe(true);
  });
});
