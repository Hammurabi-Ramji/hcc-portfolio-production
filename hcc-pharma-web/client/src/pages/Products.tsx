import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Products() {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: products, isLoading } = trpc.products.list.useQuery({ limit: 50 });
  const { data: searchResults } = trpc.products.search.useQuery(
    { term: searchTerm, limit: 50 },
    { enabled: searchTerm.length > 2 }
  );

  const displayProducts = searchTerm.length > 2 ? searchResults : products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Radix Labs</h1>
                <p className="text-xs text-muted-foreground">Pharmaceutical Excellence</p>
              </div>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name || user?.email}</span>
                <Button onClick={logout} variant="outline">Logout</Button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Product Catalog</h1>
          <p className="text-muted-foreground mb-6">
            Browse our comprehensive range of large animal pharmaceutical products
          </p>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts?.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        SKU: {product.sku}
                      </CardDescription>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {product.category}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        ${parseFloat(product.unitPrice).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">per {product.unitOfMeasure}</p>
                    </div>
                    {product.ndc && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">NDC</p>
                        <p className="text-sm font-mono">{product.ndc}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {displayProducts?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
