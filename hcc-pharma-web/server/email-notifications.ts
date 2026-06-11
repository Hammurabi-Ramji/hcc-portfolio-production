import { notifyOwner } from "./_core/notification";

/**
 * Email notification service for Radix Labs platform
 * Sends alerts for critical events: low inventory, pending approvals, quality deviations
 */

export interface NotificationPayload {
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "inventory" | "quality" | "approval" | "compliance" | "general";
}

/**
 * Send a notification to the platform owner
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const { title, message, priority, category } = payload;
  
  const priorityEmoji = {
    low: "ℹ️",
    medium: "⚠️",
    high: "🔴",
    critical: "🚨",
  };

  const categoryEmoji = {
    inventory: "📦",
    quality: "🔬",
    approval: "✅",
    compliance: "📋",
    general: "📢",
  };

  const formattedTitle = `${priorityEmoji[priority]} ${categoryEmoji[category]} ${title}`;
  
  try {
    const success = await notifyOwner({
      title: formattedTitle,
      content: message,
    });
    
    return success;
  } catch (error) {
    console.error("[Email Notifications] Failed to send notification:", error);
    return false;
  }
}

/**
 * Send low inventory alert
 */
export async function sendLowInventoryAlert(productName: string, currentStock: number, minStock: number) {
  return await sendNotification({
    title: "Low Inventory Alert",
    message: `Product "${productName}" is running low.\n\nCurrent Stock: ${currentStock}\nMinimum Required: ${minStock}\n\nAction Required: Reorder immediately to prevent stockouts.`,
    priority: currentStock === 0 ? "critical" : "high",
    category: "inventory",
  });
}

/**
 * Send quality deviation alert
 */
export async function sendQualityDeviationAlert(
  deviationId: number,
  severity: string,
  description: string
) {
  const priorityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
    minor: "medium",
    major: "high",
    critical: "critical",
  };

  return await sendNotification({
    title: "Quality Deviation Reported",
    message: `A ${severity} quality deviation has been reported.\n\nDeviation ID: #${deviationId}\nSeverity: ${severity.toUpperCase()}\nDescription: ${description}\n\nAction Required: Review and investigate immediately.`,
    priority: priorityMap[severity] || "high",
    category: "quality",
  });
}

/**
 * Send pending approval alert
 */
export async function sendPendingApprovalAlert(
  itemType: string,
  itemId: number,
  itemName: string
) {
  return await sendNotification({
    title: "Pending Approval",
    message: `A ${itemType} requires your approval.\n\nID: #${itemId}\nName: ${itemName}\n\nAction Required: Review and approve/reject in the system.`,
    priority: "medium",
    category: "approval",
  });
}

/**
 * Send batch completion alert
 */
export async function sendBatchCompletionAlert(
  batchNumber: string,
  productName: string,
  quantity: number
) {
  return await sendNotification({
    title: "Batch Production Complete",
    message: `Manufacturing batch has been completed.\n\nBatch Number: ${batchNumber}\nProduct: ${productName}\nQuantity: ${quantity} units\n\nAction Required: Perform quality testing and release.`,
    priority: "medium",
    category: "general",
  });
}

/**
 * Send order shipment alert
 */
export async function sendOrderShipmentAlert(
  orderNumber: string,
  customerName: string,
  trackingNumber?: string
) {
  return await sendNotification({
    title: "Order Shipped",
    message: `Order has been shipped to customer.\n\nOrder Number: ${orderNumber}\nCustomer: ${customerName}${trackingNumber ? `\nTracking: ${trackingNumber}` : ""}\n\nCustomer has been notified.`,
    priority: "low",
    category: "general",
  });
}

/**
 * Send expiration warning
 */
export async function sendExpirationWarningAlert(
  productName: string,
  lotNumber: string,
  expirationDate: Date,
  daysUntilExpiry: number
) {
  return await sendNotification({
    title: "Product Expiration Warning",
    message: `Product lot is approaching expiration.\n\nProduct: ${productName}\nLot Number: ${lotNumber}\nExpiration Date: ${expirationDate.toLocaleDateString()}\nDays Until Expiry: ${daysUntilExpiry}\n\nAction Required: Use or dispose before expiration.`,
    priority: daysUntilExpiry <= 7 ? "high" : "medium",
    category: "inventory",
  });
}

/**
 * Send compliance audit reminder
 */
export async function sendComplianceAuditReminder(auditType: string, dueDate: Date) {
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return await sendNotification({
    title: "Compliance Audit Due",
    message: `Compliance audit is due soon.\n\nAudit Type: ${auditType}\nDue Date: ${dueDate.toLocaleDateString()}\nDays Remaining: ${daysUntilDue}\n\nAction Required: Complete audit documentation.`,
    priority: daysUntilDue <= 3 ? "high" : "medium",
    category: "compliance",
  });
}
