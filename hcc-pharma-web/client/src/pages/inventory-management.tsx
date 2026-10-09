import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, AlertTriangle, Calendar, MapPin, Box } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  quarantine: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  recalled: "bg-red-100 text-red-800",
  available: "bg-green-100 text-green-800",
};

export default function InventoryManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { toast } = useToast();
  
  const { data: lots, isLoading } = trpc.inventory.lots.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: expiring } = trpc.inventory.expiring.useQuery();
  
  const getProductName = (productId: number) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Product #${productId}`;
  };
  
  const filteredLots = lots?.filter((lot: any) =>
    lot.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProductName(lot.productId).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A5F7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A5F7A] mb-2">Inventory Management</h1>
          <p className="text-gray-600">View inventory lots and stock levels</p>
        </div>
      </div>
      
      {/* Alerts Section */}
      {((lowStock && lowStock.length > 0) || (expiring && expiring.length > 0)) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStock && lowStock.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert ({lowStock.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {lowStock.slice(0, 5).map((item: any) => (
                    <li key={item.id}>• {item.name}: {item.totalQuantity || 0} units</li>
                  ))}
                  {lowStock.length > 5 && (
                    <li className="text-yellow-600">...and {lowStock.length - 5} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
          
          {expiring && expiring.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon ({expiring.length} lots)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-red-700 space-y-1">
                  {expiring.slice(0, 5).map((lot: any) => (
                    <li key={lot.id}>• {lot.lotNumber}: Expires {new Date(lot.expiryDate).toLocaleDateString()}</li>
                  ))}
                  {expiring.length > 5 && (
                    <li className="text-red-600">...and {expiring.length - 5} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-800">
              {lots?.filter((l: any) => l.status === 'active' || l.status === 'available').length || 0}
            </div>
            <div className="text-sm text-green-600">Active Lots</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-800">
              {lots?.filter((l: any) => l.status === 'quarantine').length || 0}
            </div>
            <div className="text-sm text-yellow-600">In Quarantine</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-800">
              {lots?.reduce((sum: number, l: any) => sum + (l.quantity || 0), 0) || 0}
            </div>
            <div className="text-sm text-blue-600">Total Units</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-800">
              {lots?.filter((l: any) => l.status === 'expired' || l.status === 'recalled').length || 0}
            </div>
            <div className="text-sm text-red-600">Expired/Recalled</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by lot number, status, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLots?.map((lot: any) => (
          <Card key={lot.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={statusColors[lot.status] || "bg-gray-100 text-gray-800"}>
                  {lot.status}
                </Badge>
                {lot.quantity < 10 && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-[#1A5F7A]" />
                {lot.lotNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Product:</strong> {getProductName(lot.productId)}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1A5F7A]">
                  <Box className="h-4 w-4" />
                  {lot.quantity} units
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Mfg: {new Date(lot.manufacturingDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Exp: {new Date(lot.expiryDate).toLocaleDateString()}
                </div>
                {lot.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {lot.location}
                  </div>
                )}
                {lot.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {lot.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredLots?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No inventory lots found</p>
        </div>
      )}
    </div>
  );
}
