
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { SidebarTrigger } from "../ui/sidebar";
import CartModal from "../cart/CartModal";

export default function ClientHeader() {
  const { cart } = useCart();
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">Customer Dashboard</h1>
      <div className="flex flex-1 items-center justify-end space-x-2">
        <CartModal>
          <Button variant="ghost" size="icon">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute top-2 right-2 h-4 w-4 justify-center p-0">{itemCount}</Badge>
            )}
            <span className="sr-only">Shopping Cart</span>
          </Button>
        </CartModal>
      </div>
    </div>
  );
}
