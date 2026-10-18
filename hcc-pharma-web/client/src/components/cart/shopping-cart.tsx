import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getPricingBreakdown } from "@/lib/pricing";
import { ShoppingCart, Trash2, Plus, Minus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function ShoppingCartButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  
  const utils = trpc.useUtils();
  const { data: cartItems, isLoading } = trpc.cart.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const updateMutation = trpc.cart.update.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
    },
  });
  
  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
      toast({ title: "Item removed from cart" });
    },
  });
  
  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
      toast({ title: "Cart cleared" });
    },
  });
  
  const createQuoteMutation = trpc.quotes.create.useMutation({
    onSuccess: (data) => {
      utils.cart.list.invalidate();
      clearMutation.mutate();
      setShowQuoteDialog(false);
      setQuoteNotes("");
      setDeliveryAddress("");
      setRequestedDate("");
      setIsOpen(false);
      toast({
        title: "Quote request submitted!",
        description: `Quote number: ${data.quoteNumber}. We'll get back to you soon.`,
      });
    },
  });
  
  const cartCount = cartItems?.length || 0;

  const cartSummary = (() => {
    if (!cartItems) {
      return { subtotal: 0, savings: 0, total: 0 };
    }

    return cartItems.reduce(
      (summary, item) => {
        const pricing = getPricingBreakdown(item.product?.unitPrice, item.quantity, item.pricingTiers);

        summary.subtotal += pricing.lineSubtotal;
        summary.savings += pricing.savingsAmount;
        summary.total += pricing.lineTotal;

        return summary;
      },
      { subtotal: 0, savings: 0, total: 0 },
    );
  })();
  
  const handleQuantityChange = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateMutation.mutate({ cartItemId, quantity: newQuantity });
  };
  
  const handleRemove = (cartItemId: number) => {
    removeMutation.mutate({ cartItemId });
  };
  
  const handleRequestQuote = () => {
    if (!cartItems || cartItems.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    setShowQuoteDialog(true);
  };
  
  const submitQuoteRequest = () => {
    if (!cartItems) return;
    
    const items = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes || undefined,
    }));
    
    createQuoteMutation.mutate({
      items,
      notes: quoteNotes || undefined,
      deliveryAddress: deliveryAddress || undefined,
      requestedDeliveryDate: requestedDate || undefined,
    });
  };
  
  if (!user) return null;
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                {cartCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>
              {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {isLoading && <p className="text-center text-muted-foreground">Loading...</p>}
            
            {!isLoading && cartItems && cartItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
            )}
            
            {cartItems && cartItems.map((item) => {
              const pricing = getPricingBreakdown(item.product?.unitPrice, item.quantity, item.pricingTiers);

              return (
                <div key={item.id} className="flex gap-4 border-b pb-4">
                  <img 
                    src={item.product?.imageUrl || "/placeholder-product.png"} 
                    alt={item.product?.name || "Product"}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pricing.discountPercentage > 0 ? (
                        <>
                          <span className="mr-2 line-through">{formatCurrency(pricing.baseUnitPrice)}</span>
                          <span className="font-medium text-green-700">{formatCurrency(pricing.effectiveUnitPrice)}</span>
                        </>
                      ) : (
                        formatCurrency(pricing.baseUnitPrice)
                      )}
                      {" / "}
                      {item.product?.unitOfMeasure}
                    </p>
                    {pricing.discountPercentage > 0 && (
                      <p className="mt-1 text-xs font-medium text-green-700">
                        {pricing.discountPercentage}% volume discount applied
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">Note: {item.notes}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-7 w-7 text-destructive"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Line total</span>
                      <span className="font-medium">{formatCurrency(pricing.lineTotal)}</span>
                    </div>
                    {pricing.savingsAmount > 0 && (
                      <div className="mt-1 flex items-center justify-between text-xs text-green-700">
                        <span>Volume savings</span>
                        <span>-{formatCurrency(pricing.savingsAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {cartItems && cartItems.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(cartSummary.subtotal)}</span>
                </div>
                {cartSummary.savings > 0 && (
                  <div className="flex justify-between font-medium text-green-700">
                    <span>Volume savings</span>
                    <span>-{formatCurrency(cartSummary.savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Estimated Total:</span>
                  <span>{formatCurrency(cartSummary.total)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleRequestQuote}
                disabled={createQuoteMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Request Quote
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
              >
                Clear Cart
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Quote</DialogTitle>
            <DialogDescription>
              Provide additional details for your quote request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-address">Delivery Address</Label>
              <Textarea
                id="delivery-address"
                placeholder="Enter delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requested-date">Requested Delivery Date</Label>
              <Input
                id="requested-date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or notes..."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitQuoteRequest}
              disabled={createQuoteMutation.isPending}
            >
              {createQuoteMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
