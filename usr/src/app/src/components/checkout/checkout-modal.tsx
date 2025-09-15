
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
import { useEffect, useState, useMemo } from "react";
import type { User, Order, GuestCart, Address, OrderPayload, OrderItemPayload, InitializePaymentPayload } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAddresses, placeOrder, initializePayment } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Minus, Plus } from "lucide-react";
import type { PaystackPop } from "@paystack/inline-js/dist/types";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: Order | null;
    guestCart?: GuestCart | null;
}

export default function CheckoutModal({ isOpen, onClose, order, guestCart }: CheckoutModalProps) {
  const { clearGuestCart, updateOrderStatus, increaseGuestItemQuantity, decreaseGuestItemQuantity, increaseOrderItemQuantity, decreaseOrderItemQuantity } = useOrder();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paystack, setPaystack] = useState<PaystackPop | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
    }

    import('@paystack/inline-js').then(({ default: PaystackPop }) => {
        setPaystack(new PaystackPop());
    });
  }, []);

  useEffect(() => {
    if (isOpen && user) {
        const fetchUserAddresses = async () => {
            try {
                const fetchedAddresses = await getAddresses();
                setAddresses(fetchedAddresses);
                const defaultAddress = fetchedAddresses.find(a => a.is_default) || fetchedAddresses[0];
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                }
            } catch (error) {
                console.error("Failed to fetch addresses:", error);
                toast({
                    title: "Could not load addresses",
                    description: "Please try again or enter your address manually.",
                    variant: "destructive"
                });
            }
        };
        fetchUserAddresses();
    }
  }, [isOpen, user, toast]);

  const checkoutItems = useMemo(() => order?.items || guestCart?.items || [], [order, guestCart]);

  const { subtotal, taxes, deliveryFee, total, totalInKobo } = useMemo(() => {
    const sub = checkoutItems.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
    const tax = sub * 0.05;
    const delivery = 1000;
    const grandTotal = sub + tax + delivery;
    return {
        subtotal: sub,
        taxes: tax,
        deliveryFee: delivery,
        total: grandTotal,
        totalInKobo: Math.round(grandTotal * 100),
    };
  }, [checkoutItems]);

  const handlePayment = async () => {
    if (!user) {
        toast({
            title: "Please Log In",
            description: "You need to be logged in to place an order.",
            variant: "destructive"
        });
        clearGuestCart();
        onClose();
        router.push(`/login?redirect=/customer/dashboard`);
        return;
    }
    
    if (!order) return;

    if (!user.phone_number) {
        toast({
            title: "Phone Number Required",
            description: "Please add a phone number to your profile before placing an order.",
            variant: "destructive",
        });
        onClose();
        router.push('/customer/profile');
        return;
    }

    if (!selectedAddressId) {
        toast({
            title: "Address Required",
            description: "Please select a delivery address.",
            variant: "destructive",
        });
        return;
    }

    setIsPlacingOrder(true);

    try {
        const paymentPayload: InitializePaymentPayload = { amount: totalInKobo };
        const paymentResponse = await initializePayment(paymentPayload);
        
        if (!paystack) {
            throw new Error("Paystack library not loaded.");
        }

        paystack.newTransaction({
            key: paymentResponse.public_key,
            email: user.email,
            amount: totalInKobo,
            ref: paymentResponse.reference,
            onSuccess: async (transaction) => {
                try {
                    const orderItemsPayload: OrderItemPayload[] = order.items.map(item => ({
                        menu_item_id: item.id,
                        quantity: item.quantity,
                    }));

                    const orderPayload: OrderPayload = {
                        restaurant_id: order.restaurantId,
                        delivery_address_id: selectedAddressId,
                        items: orderItemsPayload,
                    };

                    const newOrder = await placeOrder(orderPayload);
                    updateOrderStatus(order.id, 'Order Placed');
                    
                    toast({
                        title: "Order Placed!",
                        description: "Your order has been submitted. We're on it!",
                    });

                    onClose();
                    router.push(`/customer/orders/success/${newOrder.id}`);

                } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to place order after payment.";
                    toast({
                        title: "Order Creation Failed",
                        description: message,
                        variant: "destructive",
                    });
                } finally {
                     setIsPlacingOrder(false);
                }
            },
            onCancel: () => {
                toast({
                    title: "Payment Cancelled",
                    description: "You have cancelled the payment process.",
                    variant: "destructive",
                });
                setIsPlacingOrder(false);
            },
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({
            title: "Payment Error",
            description: `Failed to initialize payment: ${message}`,
            variant: "destructive",
        });
        setIsPlacingOrder(false);
    }
  }
  
  const handleIncrease = (itemId: string) => {
    if (order) {
      increaseOrderItemQuantity(order.id, itemId);
    } else {
      increaseGuestItemQuantity(itemId);
    }
  };

  const handleDecrease = (itemId: string) => {
    if (order) {
      decreaseOrderItemQuantity(order.id, itemId);
    } else {
      decreaseGuestItemQuantity(itemId);
    }
  };

  if (!isClient || checkoutItems.length === 0) {
      return null;
  }
  
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

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
                            <Input id="name" placeholder="John Doe" defaultValue={user?.full_name || ''} readOnly/>
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" placeholder="0801 234 5678" defaultValue={user?.phone_number || ''} readOnly/>
                            </div>
                        </div>

                        {user && addresses.length > 0 ? (
                            <div className="space-y-2">
                                <Label>Select Address</Label>
                                <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a delivery address" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {addresses.map(addr => (
                                            <SelectItem key={addr.id} value={addr.id}>
                                                {addr.address_nickname ? `${addr.address_nickname} - ${addr.street_address}` : addr.street_address}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <Label htmlFor="address">Street Address</Label>
                            <Input id="address" placeholder="123 Allen Avenue" value={selectedAddress?.street_address || ''} readOnly />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <Label htmlFor="city">District/Town</Label>
                            <Input id="city" placeholder="Ikeja" value={selectedAddress?.city || ''} readOnly />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="landmark">Nearest Landmark</Label>
                                <Input id="landmark" placeholder="Near the market" value={selectedAddress?.nearest_landmark || ''} readOnly />
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
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleDecrease(item.id)} disabled={item.quantity <= 1}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleIncrease(item.id)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm font-semibold">₦{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
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
                    <Button className="w-full" onClick={handlePayment} disabled={isPlacingOrder}>
                        {isPlacingOrder ? "Initializing Payment..." : `Proceed to Pay ₦${total.toFixed(2)}`}
                    </Button>
                </CardFooter>
            </div>
        </DialogContent>
    </Dialog>
  );
}
