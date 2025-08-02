
"use client";

import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User, Order } from "@/lib/types";

export default function CheckoutPage() {
  const { orders, guestCart, clearGuestCart, updateOrderStatus } = useOrder();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
        // For guest users, the cart is the order
        if (guestCart.items.length === 0) {
            router.push('/menu');
        } else {
            setCurrentOrder({
                id: 'guest-checkout',
                restaurantId: guestCart.restaurantId || '',
                items: guestCart.items,
                status: 'unsubmitted',
                total: guestCart.items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0)
            });
        }
        router.push('/login?redirect=/checkout');
    } else {
        setUser(JSON.parse(storedUser));
        if (orderId) {
            const foundOrder = orders.find(o => o.id === orderId);
            if (foundOrder) {
                setCurrentOrder(foundOrder);
            } else {
                toast({ title: "Order not found", variant: "destructive" });
                router.push('/customer/orders');
            }
        } else {
             // Handle guest checkout continuation after login
            if (guestCart.items.length > 0) {
                 setCurrentOrder({
                    id: 'guest-checkout-final',
                    restaurantId: guestCart.restaurantId || '',
                    items: guestCart.items,
                    status: 'unsubmitted',
                    total: guestCart.items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0)
                });
            } else {
                toast({ title: "No order selected for checkout", variant: "destructive" });
                router.push('/customer/dashboard');
            }
        }
    }
  }, [router, orderId, orders, guestCart, toast]);

  if (!isClient || !currentOrder) {
    return null; // Or a loading spinner
  }

  const subtotal = currentOrder.items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
  const taxes = subtotal * 0.05;
  const deliveryFee = 2.99;
  const total = subtotal + taxes + deliveryFee;

  const handlePayment = () => {
    toast({
        title: "Payment Successful!",
        description: "Your order has been placed. We're on it!",
    });
    
    if (user && orderId) {
        updateOrderStatus(orderId, 'Order Placed');
    } else {
        // This was a guest cart, now cleared after login and payment
        clearGuestCart();
    }
    router.push('/customer/orders');
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold font-headline mb-8 text-center">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" defaultValue={user?.full_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="0801 234 5678" defaultValue={user?.phone_number || ''}/>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" placeholder="123 Allen Avenue" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Ikeja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="Lagos" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your items before finalizing.</CardDescription>
            </CardHeader>
            <CardContent>
              {currentOrder.items.map(item => (
                <div key={item.id} className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <Image src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : "https://placehold.co/48x48.png"} alt={item.name} width={48} height={48} className="rounded-md" />
                    <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p>₦{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5%)</span>
                  <span>₦{taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₦{deliveryFee.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₦{total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handlePayment}>
                Proceed to Paystack
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
