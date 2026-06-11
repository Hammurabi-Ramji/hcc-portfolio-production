import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Invoice = {
  id: number;
  invoiceNumber: string;
  orderId: number;
  amount: number;
  status: string;
  issuedDate: string;
  dueDate: string;
  pdfUrl?: string;
  createdAt: string;
};

export default function InvoicesPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  
  // Transform orders to invoice-like format
  const invoices = orders?.map((order: any) => ({
    id: order.id,
    invoiceNumber: `INV-${order.orderNumber}`,
    orderId: order.id,
    amount: parseFloat(order.totalAmount),
    status: order.status === 'delivered' ? 'paid' : order.status === 'shipped' ? 'pending' : 'unpaid',
    issuedDate: order.orderDate,
    dueDate: order.orderDate,
    pdfUrl: undefined,
    createdAt: order.createdAt,
  }));
  
  const filteredInvoices = invoices?.filter((inv: any) =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDownload = (invoice: Invoice) => {
    if (!invoice.pdfUrl) {
      toast({ title: "Error", description: "PDF not available for this invoice", variant: "destructive" });
      return;
    }
    window.open(invoice.pdfUrl, "_blank");
  };
  
  const handlePreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Invoices</h1>
        <p className="text-gray-600">View and download your invoices</p>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvoices?.map((invoice: any) => (
          <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={
                  invoice.status === "paid" 
                    ? "bg-green-100 text-green-800" 
                    : invoice.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }>
                  {invoice.status}
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1A5F7A]" />
                {invoice.invoiceNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  Amount: <span className="font-semibold text-[#1A5F7A]">${invoice.amount.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Issued: {new Date(invoice.issuedDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(invoice)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownload(invoice)}
                  className="flex-1 bg-[#1A5F7A] hover:bg-[#164d62]"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredInvoices?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No invoices found</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="bg-white p-8 border rounded">
              <div className="mb-8 pb-8 border-b">
                <h2 className="text-2xl font-bold text-[#1A5F7A] mb-2">INVOICE</h2>
                <p className="text-gray-600">{selectedInvoice.invoiceNumber}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-[#1A5F7A] mb-2">Bill To:</h3>
                  <p className="text-sm text-gray-600">Customer Information</p>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <span className="text-sm font-semibold text-gray-600">Invoice Date:</span>
                    <p className="text-sm">{new Date(selectedInvoice.issuedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-600">Due Date:</span>
                    <p className="text-sm">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#1A5F7A]">
                      <th className="text-left py-2 text-[#1A5F7A]">Description</th>
                      <th className="text-right py-2 text-[#1A5F7A]">Quantity</th>
                      <th className="text-right py-2 text-[#1A5F7A]">Unit Price</th>
                      <th className="text-right py-2 text-[#1A5F7A]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">Product/Service</td>
                      <td className="text-right">1</td>
                      <td className="text-right">${selectedInvoice.amount.toFixed(2)}</td>
                      <td className="text-right font-semibold">${selectedInvoice.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-t-2 border-[#1A5F7A]">
                    <span className="font-semibold text-[#1A5F7A]">Total:</span>
                    <span className="font-bold text-lg text-[#1A5F7A]">${selectedInvoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 pt-8 border-t">
                <p>Thank you for your business!</p>
                <p className="mt-2">Status: <Badge className={
                  selectedInvoice.status === "paid" 
                    ? "bg-green-100 text-green-800" 
                    : selectedInvoice.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }>{selectedInvoice.status}</Badge></p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
