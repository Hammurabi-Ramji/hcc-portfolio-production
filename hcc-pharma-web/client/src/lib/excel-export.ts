import * as XLSX from "xlsx";

/**
 * Excel Export Utility for Radix Labs
 * Export data to Excel format for reports and analysis
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Export data to Excel file
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  // Transform data according to column definitions
  const exportData = data.map(row => {
    const transformedRow: Record<string, any> = {};
    columns.forEach(col => {
      const value = row[col.key];
      transformedRow[col.label] = col.format ? col.format(value) : value;
    });
    return transformedRow;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const columnWidths = columns.map(col => ({
    wch: Math.max(col.label.length + 2, 15),
  }));
  worksheet["!cols"] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Export orders to Excel
 */
export function exportOrders(orders: any[]) {
  const columns: ExportColumn[] = [
    { key: "orderNumber", label: "Order Number" },
    { key: "customerName", label: "Customer" },
    { key: "status", label: "Status" },
    { key: "totalAmount", label: "Total Amount", format: (v) => `$${v.toFixed(2)}` },
    { key: "orderDate", label: "Order Date", format: (v) => new Date(v).toLocaleDateString() },
    { key: "shippingAddress", label: "Shipping Address" },
  ];

  exportToExcel(orders, columns, "orders");
}

/**
 * Export inventory to Excel
 */
export function exportInventory(inventory: any[]) {
  const columns: ExportColumn[] = [
    { key: "productName", label: "Product" },
    { key: "lotNumber", label: "Lot Number" },
    { key: "quantity", label: "Quantity" },
    { key: "location", label: "Location" },
    { key: "expirationDate", label: "Expiration Date", format: (v) => new Date(v).toLocaleDateString() },
    { key: "status", label: "Status" },
  ];

  exportToExcel(inventory, columns, "inventory");
}

/**
 * Export products to Excel
 */
export function exportProducts(products: any[]) {
  const columns: ExportColumn[] = [
    { key: "name", label: "Product Name" },
    { key: "sku", label: "SKU" },
    { key: "ndcCode", label: "NDC Code" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price", format: (v) => `$${v.toFixed(2)}` },
    { key: "stockQuantity", label: "Stock" },
    { key: "status", label: "Status" },
  ];

  exportToExcel(products, columns, "products");
}

/**
 * Export customers to Excel
 */
export function exportCustomers(customers: any[]) {
  const columns: ExportColumn[] = [
    { key: "name", label: "Customer Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "licenseNumber", label: "License Number" },
    { key: "tier", label: "Tier" },
    { key: "status", label: "Status" },
  ];

  exportToExcel(customers, columns, "customers");
}

/**
 * Export vendors to Excel
 */
export function exportVendors(vendors: any[]) {
  const columns: ExportColumn[] = [
    { key: "name", label: "Vendor Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "tier", label: "Tier" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
  ];

  exportToExcel(vendors, columns, "vendors");
}

/**
 * Export deviations to Excel
 */
export function exportDeviations(deviations: any[]) {
  const columns: ExportColumn[] = [
    { key: "id", label: "ID", format: (v) => `#${v}` },
    { key: "severity", label: "Severity" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "status", label: "Status" },
    { key: "reportedDate", label: "Reported Date", format: (v) => new Date(v).toLocaleDateString() },
    { key: "resolvedDate", label: "Resolved Date", format: (v) => v ? new Date(v).toLocaleDateString() : "N/A" },
  ];

  exportToExcel(deviations, columns, "deviations");
}

/**
 * Export audit trail to Excel
 */
export function exportAuditTrail(auditEntries: any[]) {
  const columns: ExportColumn[] = [
    { key: "id", label: "ID" },
    { key: "action", label: "Action" },
    { key: "entityType", label: "Entity Type" },
    { key: "entityId", label: "Entity ID" },
    { key: "userId", label: "User ID" },
    { key: "userName", label: "User Name" },
    { key: "timestamp", label: "Timestamp", format: (v) => new Date(v).toLocaleString() },
    { key: "changes", label: "Changes" },
  ];

  exportToExcel(auditEntries, columns, "audit_trail");
}

/**
 * Export manufacturing batches to Excel
 */
export function exportBatches(batches: any[]) {
  const columns: ExportColumn[] = [
    { key: "batchNumber", label: "Batch Number" },
    { key: "productName", label: "Product" },
    { key: "quantity", label: "Quantity" },
    { key: "status", label: "Status" },
    { key: "startDate", label: "Start Date", format: (v) => new Date(v).toLocaleDateString() },
    { key: "completionDate", label: "Completion Date", format: (v) => v ? new Date(v).toLocaleDateString() : "In Progress" },
  ];

  exportToExcel(batches, columns, "manufacturing_batches");
}
