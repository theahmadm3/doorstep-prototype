
"use client";

import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User, Order, GuestCart } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: Order | null;
    guestCart?: GuestCart | null;
}

export default function CheckoutModal({ isOpen, onClose, order, guestCart }: CheckoutModalProps) {
  const { clearGuestCart, updateOrderStatus } = useOrder();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!isClient) return null;

  const checkoutItems = order?.items || guestCart?.items || [];
  if (checkoutItems.length === 0) {
      return null;
  }

  const subtotal = checkoutItems.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
  const taxes = subtotal * 0.05;
  const deliveryFee = 2.99;
  const total = subtotal + taxes + deliveryFee;

  const handlePayment = () => {
    toast({
        title: "Payment Successful!",
        description: "Your order has been placed. We're on it!",
    });
    
    if (user && order) {
        updateOrderStatus(order.id, 'Order Placed');
    } else {
        // This was a guest cart
        clearGuestCart();
    }
    onClose();
    router.push(user ? '/customer/orders' : '/');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-3 gap-8 p-0">
            <div className="md:col-span-2 p-6">
                 <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl">Checkout</DialogTitle>
                </DialogHeader>
                <Card className="border-0 shadow-none">
                    <CardHeader className="px-1">
                        <CardTitle>Delivery Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-1">
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
            <div className="bg-muted/50 p-6 flex flex-col">
                <Card className="bg-transparent border-0 shadow-none flex-grow">
                    <CardHeader className="px-1">
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription className="text-xs">Review your items before finalizing.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-1">
                    <div className="max-h-60 overflow-y-auto space-y-4">
                    {checkoutItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Image src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : "https://placehold.co/48x48.png"} alt={item.name} width={48} height={48} className="rounded-md" />
                                <div>
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="text-sm">₦{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
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
                </Card>
                <CardFooter className="p-1 mt-auto">
                    <Button className="w-full" onClick={handlePayment}>
                        Proceed to Paystack
                    </Button>
                </CardFooter>
            </div>
        </DialogContent>
    </Dialog>
  );
}
