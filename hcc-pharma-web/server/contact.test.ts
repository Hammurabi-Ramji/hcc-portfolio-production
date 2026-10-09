import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Contact Form", () => {
  it("should submit a contact inquiry successfully", async () => {
    const caller = appRouter.createCaller({ user: null });
    
    const result = await caller.contact.submitInquiry({
      name: "John Doe",
      email: "john@example.com",
      phone: "555-1234",
      company: "Test Veterinary Clinic",
      subject: "Product Inquiry",
      message: "I would like to know more about your calcium products.",
      inquiryType: "general",
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBeGreaterThan(0);
  });
  
  it("should validate required fields", async () => {
    const caller = appRouter.createCaller({ user: null });
    
    await expect(
      caller.contact.submitInquiry({
        name: "",
        email: "invalid-email",
        subject: "",
        message: "Short",
        inquiryType: "general",
      })
    ).rejects.toThrow();
  });
});
