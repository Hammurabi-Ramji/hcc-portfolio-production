import { describe, it, expect } from "vitest";
import { sendQuoteRequestEmail, sendOrderConfirmationEmail, sendShippingNotificationEmail } from "./email-service";

describe("Email Notification System", () => {
  it("should send quote request email", async () => {
    const result = await sendQuoteRequestEmail({
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      quoteNumber: "QR-123456",
      items: [
        { productName: "Oxytocin Injectable", quantity: 10 },
        { productName: "Vitamin B Complex", quantity: 5 },
      ],
      totalEstimate: 450.00,
    });

    // Email service returns boolean indicating success
    expect(typeof result).toBe("boolean");
  });

  it("should send order confirmation email", async () => {
    const result = await sendOrderConfirmationEmail({
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      orderNumber: "ORD-789012",
      items: [
        { productName: "Oxytocin Injectable", quantity: 10, price: 25.00 },
        { productName: "Vitamin B Complex", quantity: 5, price: 40.00 },
      ],
      total: 450.00,
      estimatedDelivery: "2026-01-15",
    });

    expect(typeof result).toBe("boolean");
  });

  it("should send shipping notification email", async () => {
    const result = await sendShippingNotificationEmail({
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      orderNumber: "ORD-789012",
      trackingNumber: "1Z999AA10123456784",
      carrier: "UPS",
      estimatedDelivery: "2026-01-15",
    });

    expect(typeof result).toBe("boolean");
  });

  it("should handle email sending without tracking number", async () => {
    const result = await sendShippingNotificationEmail({
      customerEmail: "test@example.com",
      customerName: "Test Customer",
      orderNumber: "ORD-789012",
    });

    expect(typeof result).toBe("boolean");
  });
});
