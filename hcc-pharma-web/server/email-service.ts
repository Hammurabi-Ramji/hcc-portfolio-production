/**
 * Email Service for Radix Labs
 * Handles all automated email notifications
 */

import { notifyOwner } from "./_core/notification";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email notification
 * Currently uses owner notification system as fallback
 * In production, integrate with SendGrid, AWS SES, or similar service
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Log email for debugging
    console.log(`[Email] Sending to ${options.to.email}: ${options.subject}`);
    
    // In production, integrate with email service provider
    // For now, notify owner about the email that would be sent
    const success = await notifyOwner({
      title: `Email Notification: ${options.subject}`,
      content: `To: ${options.to.name || options.to.email}\n\n${options.text || "See HTML content"}`,
    });
    
    return success;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send quote request confirmation email
 */
export async function sendQuoteRequestEmail(data: {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  items: Array<{ productName: string; quantity: number }>;
  totalEstimate?: number;
}) {
  const itemsList = data.items
    .map((item) => `- ${item.productName} (Qty: ${item.quantity})`)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1A5F7A 0%, #086D38 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Radix Labs</h1>
        <p style="color: #FFD700; margin: 5px 0;">State-of-the-Art Veterinary Pharmaceuticals</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1A5F7A;">Quote Request Received</h2>
        <p>Dear ${data.customerName},</p>
        <p>Thank you for your quote request. We have received your inquiry and our team will review it shortly.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #086D38; margin-top: 0;">Quote Details</h3>
          <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
          <p><strong>Requested Items:</strong></p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${itemsList}</pre>
          ${data.totalEstimate ? `<p><strong>Estimated Total:</strong> $${data.totalEstimate.toFixed(2)}</p>` : ""}
        </div>
        
        <p>Our pharmaceutical specialists will review your request and provide a detailed quote within 24-48 hours.</p>
        <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:info@radixlabs.com">info@radixlabs.com</a> or call 1-800-927-2349.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p style="color: #666; font-size: 12px; margin: 0;">Radix Labs - FDA-registered, cGMP-compliant facility</p>
          <p style="color: #666; font-size: 12px; margin: 5px 0;">Leading the veterinary pharmaceutical industry since 1979</p>
        </div>
      </div>
    </div>
  `;

  const text = `
Quote Request Received - ${data.quoteNumber}

Dear ${data.customerName},

Thank you for your quote request. We have received your inquiry and our team will review it shortly.

Requested Items:
${itemsList}

${data.totalEstimate ? `Estimated Total: $${data.totalEstimate.toFixed(2)}` : ""}

Our pharmaceutical specialists will review your request and provide a detailed quote within 24-48 hours.

For questions, contact us at info@radixlabs.com or 1-800-927-2349.

Best regards,
Radix Labs Team
  `;

  return await sendEmail({
    to: { email: data.customerEmail, name: data.customerName },
    subject: `Quote Request Received - ${data.quoteNumber}`,
    html,
    text,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  total: number;
  estimatedDelivery?: string;
}) {
  const itemsList = data.items
    .map(
      (item) =>
        `- ${item.productName} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
    )
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1A5F7A 0%, #086D38 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Radix Labs</h1>
        <p style="color: #FFD700; margin: 5px 0;">Order Confirmation</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1A5F7A;">Thank You for Your Order!</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your order has been confirmed and is being processed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #086D38; margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ""}
          <p><strong>Items:</strong></p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">${itemsList}</pre>
          <p style="font-size: 18px; font-weight: bold; color: #1A5F7A;"><strong>Total:</strong> $${data.total.toFixed(2)}</p>
        </div>
        
        <p>You will receive a shipping notification with tracking information once your order ships.</p>
        <p>For order inquiries, please reference your order number when contacting us.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p style="color: #666; font-size: 12px; margin: 0;">Questions? Contact us at info@radixlabs.com or 1-800-927-2349</p>
        </div>
      </div>
    </div>
  `;

  const text = `
Order Confirmation - ${data.orderNumber}

Dear ${data.customerName},

Your order has been confirmed and is being processed.

Order Details:
${itemsList}

Total: $${data.total.toFixed(2)}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ""}

You will receive a shipping notification with tracking information once your order ships.

Best regards,
Radix Labs Team
  `;

  return await sendEmail({
    to: { email: data.customerEmail, name: data.customerName },
    subject: `Order Confirmation - ${data.orderNumber}`,
    html,
    text,
  });
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotificationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
}) {
  const trackingInfo = data.trackingNumber
    ? `
    <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      ${data.carrier ? `<p style="margin: 5px 0 0 0;"><strong>Carrier:</strong> ${data.carrier}</p>` : ""}
    </div>
  `
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1A5F7A 0%, #086D38 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Radix Labs</h1>
        <p style="color: #FFD700; margin: 5px 0;">Your Order Has Shipped!</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1A5F7A;">Order Shipped</h2>
        <p>Dear ${data.customerName},</p>
        <p>Great news! Your order has been shipped and is on its way.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #086D38; margin-top: 0;">Shipping Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          ${trackingInfo}
          ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ""}
        </div>
        
        <p>You can track your shipment using the tracking number provided above.</p>
        <p>If you have any questions about your shipment, please contact us at <a href="mailto:info@radixlabs.com">info@radixlabs.com</a> or call 1-800-927-2349.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p style="color: #666; font-size: 12px; margin: 0;">Thank you for choosing Radix Labs</p>
        </div>
      </div>
    </div>
  `;

  const text = `
Order Shipped - ${data.orderNumber}

Dear ${data.customerName},

Great news! Your order has been shipped and is on its way.

${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ""}
${data.carrier ? `Carrier: ${data.carrier}` : ""}
${data.estimatedDelivery ? `Estimated Delivery: ${data.estimatedDelivery}` : ""}

You can track your shipment using the tracking number provided above.

Best regards,
Radix Labs Team
  `;

  return await sendEmail({
    to: { email: data.customerEmail, name: data.customerName },
    subject: `Your Order Has Shipped - ${data.orderNumber}`,
    html,
    text,
  });
}

/**
 * Send quote update email (when admin provides pricing)
 */
export async function sendQuoteUpdateEmail(data: {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  status: string;
  totalAmount?: number;
  expiresAt?: Date;
  notes?: string;
}) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1A5F7A 0%, #086D38 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Radix Labs</h1>
        <p style="color: #FFD700; margin: 5px 0;">Quote Update</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #1A5F7A;">Quote Update - ${data.quoteNumber}</h2>
        <p>Dear ${data.customerName},</p>
        <p>We have an update regarding your quote request.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
          <p><strong>Status:</strong> <span style="color: #086D38; font-weight: bold;">${data.status.toUpperCase()}</span></p>
          ${data.totalAmount ? `<p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>` : ""}
          ${data.expiresAt ? `<p><strong>Valid Until:</strong> ${data.expiresAt.toLocaleDateString()}</p>` : ""}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
        </div>
        
        <p>Please log in to your account to view the full quote details and proceed with your order.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="https://radixlabs.com/customer-dashboard" style="background: #086D38; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">View Quote</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p style="color: #666; font-size: 12px; margin: 0;">Questions? Contact us at info@radixlabs.com or 1-800-927-2349</p>
        </div>
      </div>
    </div>
  `;

  const text = `
Quote Update - ${data.quoteNumber}

Dear ${data.customerName},

We have an update regarding your quote request.

Status: ${data.status.toUpperCase()}
${data.totalAmount ? `Total Amount: $${data.totalAmount.toFixed(2)}` : ""}
${data.expiresAt ? `Valid Until: ${data.expiresAt.toLocaleDateString()}` : ""}
${data.notes ? `Notes: ${data.notes}` : ""}

Please log in to your account to view the full quote details and proceed with your order.

Best regards,
Radix Labs Team
  `;

  return await sendEmail({
    to: { email: data.customerEmail, name: data.customerName },
    subject: `Quote Update - ${data.quoteNumber}`,
    html,
    text,
  });
}
