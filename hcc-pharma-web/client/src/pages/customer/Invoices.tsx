import { useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { trpc } from "@/lib/trpc";
import { customerPortalNavigation } from "@/lib/portal-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CustomerInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: orders, isLoading } = trpc.orders.list.useQuery();

  const getStatusVariant = (status: string) => {
    if (status === "delivered") {
      return "default" as const;
    }

    if (status === "pending") {
      return "secondary" as const;
    }

    return "outline" as const;
  };

  const filteredOrders = orders?.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadInvoice = (orderId: number, orderNumber: string) => {
    // Generate PDF invoice
    const invoiceData = orders?.find(o => o.id === orderId);
    if (!invoiceData) return;

    // Create a simple invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Radix Laboratories Incorporated</h1>
          <p>1334 International Drive, Eau Claire, WI 54701</p>
          <p>Phone: (715) 833-0644 | Email: radix@radix-labs.com</p>
        </div>
        <div class="invoice-details">
          <h2>Invoice</h2>
          <p><strong>Invoice Number:</strong> INV-${orderNumber}</p>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(invoiceData.orderDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${invoiceData.status}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Order ${orderNumber}</td>
              <td>-</td>
              <td>-</td>
              <td class="total">$${Number(invoiceData.totalAmount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 30px; text-align: right;">
          <p class="total">Total Amount: $${Number(invoiceData.totalAmount).toFixed(2)}</p>
        </div>
      </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <PortalLayout title="Customer Portal" navigation={customerPortalNavigation}>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Loading your invoices...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Customer Portal" navigation={customerPortalNavigation}>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Invoices
            </CardTitle>
            <CardDescription>
              View and download invoices for your orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          INV-{order.orderNumber}
                        </TableCell>
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          ${Number(order.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
