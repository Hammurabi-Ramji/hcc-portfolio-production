import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * PDF Report Generator for Radix Labs
 * Generates batch records, certificates of analysis, and compliance reports
 */

interface BatchRecordData {
  batchNumber: string;
  productName: string;
  productSKU: string;
  manufacturingDate: Date;
  expirationDate: Date;
  quantity: number;
  status: string;
  qualityTests: Array<{
    testName: string;
    result: string;
    performedBy: string;
    performedAt: Date;
  }>;
}

interface COAData {
  certificateNumber: string;
  productName: string;
  batchNumber: string;
  manufacturingDate: Date;
  expirationDate: Date;
  testResults: Array<{
    parameter: string;
    specification: string;
    result: string;
    status: string;
  }>;
  approvedBy: string;
  approvalDate: Date;
}

interface ComplianceReportData {
  reportTitle: string;
  reportDate: Date;
  reportingPeriod: string;
  deviations: Array<{
    id: number;
    severity: string;
    description: string;
    status: string;
    reportedDate: Date;
  }>;
  auditTrailCount: number;
  batchesProduced: number;
  qualityTestsPerformed: number;
}

/**
 * Generate Batch Production Record PDF
 */
export function generateBatchRecordPDF(data: BatchRecordData): Buffer {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(107, 70, 193); // Purple
  doc.text("Radix Labs", 105, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Batch Production Record", 105, 30, { align: "center" });
  
  // Batch Information
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Batch Information", 14, 45);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Batch Number: ${data.batchNumber}`, 14, 55);
  doc.text(`Product Name: ${data.productName}`, 14, 62);
  doc.text(`Product SKU: ${data.productSKU}`, 14, 69);
  doc.text(`Manufacturing Date: ${data.manufacturingDate.toLocaleDateString()}`, 14, 76);
  doc.text(`Expiration Date: ${data.expirationDate.toLocaleDateString()}`, 14, 83);
  doc.text(`Quantity Produced: ${data.quantity} units`, 14, 90);
  doc.text(`Status: ${data.status}`, 14, 97);
  
  // Quality Tests Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Quality Control Tests", 14, 110);
  
  autoTable(doc, {
    startY: 115,
    head: [["Test Name", "Result", "Performed By", "Date"]],
    body: data.qualityTests.map(test => [
      test.testName,
      test.result,
      test.performedBy,
      test.performedAt.toLocaleDateString(),
    ]),
    theme: "grid",
    headStyles: { fillColor: [107, 70, 193] }, // Purple
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleString()} | Radix Labs - Pharmaceutical Excellence`,
      105,
      285,
      { align: "center" }
    );
  }
  
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate Certificate of Analysis (COA) PDF
 */
export function generateCOAPDF(data: COAData): Buffer {
  const doc = new jsPDF();
  
  // Header with border
  doc.setDrawColor(107, 70, 193);
  doc.setLineWidth(1);
  doc.rect(10, 10, 190, 30);
  
  doc.setFontSize(22);
  doc.setTextColor(107, 70, 193);
  doc.text("CERTIFICATE OF ANALYSIS", 105, 22, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Radix Labs - Pharmaceutical Excellence", 105, 32, { align: "center" });
  
  // Certificate Information
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate Information", 14, 50);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Certificate Number: ${data.certificateNumber}`, 14, 58);
  doc.text(`Product Name: ${data.productName}`, 14, 65);
  doc.text(`Batch Number: ${data.batchNumber}`, 14, 72);
  doc.text(`Manufacturing Date: ${data.manufacturingDate.toLocaleDateString()}`, 14, 79);
  doc.text(`Expiration Date: ${data.expirationDate.toLocaleDateString()}`, 14, 86);
  
  // Test Results Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Analytical Test Results", 14, 98);
  
  autoTable(doc, {
    startY: 103,
    head: [["Parameter", "Specification", "Result", "Status"]],
    body: data.testResults.map(test => [
      test.parameter,
      test.specification,
      test.result,
      test.status,
    ]),
    theme: "grid",
    headStyles: { fillColor: [107, 70, 193] },
    columnStyles: {
      3: {
        cellWidth: 25,
        halign: "center",
        fontStyle: "bold",
      },
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.cell.section === "body") {
        const status = data.cell.raw as string;
        if (status === "Pass" || status === "Passed") {
          data.cell.styles.textColor = [34, 197, 94]; // Green
        } else if (status === "Fail" || status === "Failed") {
          data.cell.styles.textColor = [239, 68, 68]; // Red
        }
      }
    },
  });
  
  // Approval Section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Approval", 14, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Approved By: ${data.approvedBy}`, 14, finalY + 8);
  doc.text(`Approval Date: ${data.approvalDate.toLocaleDateString()}`, 14, finalY + 15);
  
  // Digital Signature Box
  doc.setDrawColor(107, 70, 193);
  doc.setLineWidth(0.5);
  doc.rect(14, finalY + 22, 60, 20);
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text("Digital Signature", 44, finalY + 33, { align: "center" });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `This certificate is issued electronically and is valid without signature | Generated: ${new Date().toLocaleString()}`,
    105,
    285,
    { align: "center" }
  );
  
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate Compliance Report PDF
 */
export function generateComplianceReportPDF(data: ComplianceReportData): Buffer {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(107, 70, 193);
  doc.text("Radix Labs", 105, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(data.reportTitle, 105, 30, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Report Date: ${data.reportDate.toLocaleDateString()}`, 105, 38, { align: "center" });
  doc.text(`Reporting Period: ${data.reportingPeriod}`, 105, 44, { align: "center" });
  
  // Summary Statistics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Summary Statistics", 14, 55);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Total Batches Produced: ${data.batchesProduced}`, 14, 63);
  doc.text(`Quality Tests Performed: ${data.qualityTestsPerformed}`, 14, 70);
  doc.text(`Audit Trail Entries: ${data.auditTrailCount}`, 14, 77);
  doc.text(`Total Deviations: ${data.deviations.length}`, 14, 84);
  
  // Deviations Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Quality Deviations", 14, 95);
  
  autoTable(doc, {
    startY: 100,
    head: [["ID", "Severity", "Description", "Status", "Date"]],
    body: data.deviations.map(dev => [
      `#${dev.id}`,
      dev.severity,
      dev.description.substring(0, 40) + (dev.description.length > 40 ? "..." : ""),
      dev.status,
      dev.reportedDate.toLocaleDateString(),
    ]),
    theme: "grid",
    headStyles: { fillColor: [107, 70, 193] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 80 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
  });
  
  // Compliance Statement
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Compliance Statement", 14, finalY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const statement = 
    "This report certifies that Radix Labs maintains compliance with 21 CFR Part 11, " +
    "cGMP regulations, and all applicable pharmaceutical manufacturing standards. " +
    "All deviations have been documented, investigated, and corrective actions implemented.";
  
  const splitStatement = doc.splitTextToSize(statement, 180);
  doc.text(splitStatement, 14, finalY + 8);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Confidential - For Regulatory Use Only | Generated: ${new Date().toLocaleString()}`,
    105,
    285,
    { align: "center" }
  );
  
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Helper function to save PDF to storage (if needed)
 */
export function savePDFToFile(pdfBuffer: Buffer, filename: string): string {
  // In production, you would upload to S3 using storagePut
  // For now, return a mock URL
  return `/reports/${filename}`;
}
