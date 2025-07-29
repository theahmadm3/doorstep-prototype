
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Image from "next/image";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { SidebarTrigger } from "../ui/sidebar";

export default function ClientHeader() {
  const { cart } = useCart();

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="p-4 flex items-center gap-4 bg-background border-b sticky top-0 z-10">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">Customer Dashboard</h1>
      <div className="flex flex-1 items-center justify-end space-x-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute top-2 right-2 h-4 w-4 justify-center p-0">{itemCount}</Badge>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Your Cart</DialogTitle>
            </DialogHeader>
            {cart.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <div>
                <div className="max-h-[400px] overflow-y-auto pr-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 mb-4">
                      <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md" />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>

                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
             <DialogFooter>
                {cart.length > 0 && (
                     <DialogClose asChild>
                        <Button className="w-full" asChild>
                            <Link href="/checkout">Go to Checkout</Link>
                        </Button>
                    </DialogClose>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
