import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  FileText, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Eye,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  
  // Redirect if not logged in
  if (!user) {
    setLocation("/");
    return null;
  }
  
  // Fetch quote requests
  const { data: quotes, isLoading: quotesLoading } = trpc.quotes.list.useQuery();
  
  // Fetch orders (using existing orders query)
  const { data: orders, isLoading: ordersLoading } = trpc.orders.list.useQuery();
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      reviewed: { variant: "default", icon: Eye },
      quoted: { variant: "default", icon: FileText },
      accepted: { variant: "default", icon: CheckCircle },
      declined: { variant: "destructive", icon: XCircle },
      expired: { variant: "outline", icon: XCircle },
      processing: { variant: "default", icon: Package },
      shipped: { variant: "default", icon: CheckCircle },
      delivered: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: XCircle },
    };
    
    const config = statusConfig[status] || { variant: "default" as const, icon: Package };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
      </Badge>
    );
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  return (
    <>
      <Helmet>
        <title>My Dashboard - Radix Laboratories</title>
        <meta name="description" content="Manage your orders, quotes, and account information" />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Welcome back, {user.name}!</h1>
              <p className="text-gray-600">Manage your orders, quotes, and account information</p>
            </div>
            
            <Tabs defaultValue="quotes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                <TabsTrigger value="quotes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quote Requests
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="account" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
              </TabsList>
              
              {/* Quote Requests Tab */}
              <TabsContent value="quotes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Quote Requests</CardTitle>
                    <CardDescription>
                      Track the status of your quote requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quotesLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1A5F7A]" />
                      </div>
                    )}
                    
                    {!quotesLoading && (!quotes || quotes.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No quote requests yet</p>
                        <Button 
                          className="mt-4"
                          onClick={() => setLocation("/products")}
                        >
                          Browse Products
                        </Button>
                      </div>
                    )}
                    
                    {quotes && quotes.length > 0 && (
                      <div className="space-y-4">
                        {quotes.map((quote) => {
                          const items = JSON.parse(quote.items as string);
                          return (
                            <div 
                              key={quote.id} 
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg text-[#1A5F7A]">
                                    {quote.quoteNumber}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Requested on {formatDate(quote.createdAt)}
                                  </p>
                                </div>
                                {getStatusBadge(quote.status)}
                              </div>
                              
                              <div className="space-y-2 mb-3">
                                <p className="text-sm text-gray-700">
                                  <strong>Items:</strong> {items.length} product{items.length !== 1 ? "s" : ""}
                                </p>
                                {quote.totalEstimate && (
                                  <p className="text-sm text-gray-700">
                                    <strong>Estimated Total:</strong> ${quote.totalEstimate}
                                  </p>
                                )}
                                {quote.requestedDeliveryDate && (
                                  <p className="text-sm text-gray-700">
                                    <strong>Requested Delivery:</strong> {formatDate(quote.requestedDeliveryDate)}
                                  </p>
                                )}
                              </div>
                              
                              {quote.notes && (
                                <p className="text-sm text-gray-600 mb-3 italic">
                                  Note: {quote.notes}
                                </p>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedQuote(quote)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Orders</CardTitle>
                    <CardDescription>
                      Track your order history and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1A5F7A]" />
                      </div>
                    )}
                    
                    {!ordersLoading && (!orders || orders.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No orders yet</p>
                        <Button 
                          className="mt-4"
                          onClick={() => setLocation("/products")}
                        >
                          Start Shopping
                        </Button>
                      </div>
                    )}
                    
                    {orders && orders.length > 0 && (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div 
                            key={order.id} 
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-lg text-[#1A5F7A]">
                                  Order #{order.id}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Placed on {formatDate(order.orderDate || order.createdAt)}
                                </p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              {order.totalAmount && (
                                <p className="text-sm text-gray-700">
                                  <strong>Total:</strong> ${order.totalAmount}
                                </p>
                              )}
                              {order.status === 'shipped' && order.trackingNumber && (
                                <p className="text-sm text-gray-700">
                                  <strong>Tracking:</strong> {order.trackingNumber}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Account Tab */}
              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Type</label>
                      <p className="text-gray-900 capitalize">{user.role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Member Since</label>
                      <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
