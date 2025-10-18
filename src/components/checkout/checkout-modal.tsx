
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { User, Order, Restaurant, OrderPayload, OrderItemPayload } from "@/lib/types";
import type { PaystackConfig, PaystackTransaction, InitializePaymentPayload } from "@/lib/types/paystack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { placeOrder, initializePayment } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Minus, Plus, Edit, Info } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import AddressSelectionModal from "../location/address-selection-modal";
import { haversineDistance } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: Order | null;
}

export default function CheckoutModal({ isOpen, onClose, order: initialOrder }: CheckoutModalProps) {
  const { 
    orders,
    updateOrderStatus, 
    increaseOrderItemQuantity, 
    decreaseOrderItemQuantity, 
    removeUnsubmittedOrder,
  } = useCartStore();
  
  const { selectedAddress, viewedRestaurant } = useUIStore();
  
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);

  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [showHighFeeModal, setShowHighFeeModal] = useState(false);


  const order = initialOrder ? orders.find(o => o.id === initialOrder.id) : null;

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    if (viewedRestaurant?.address && selectedAddress?.latitude && selectedAddress?.longitude) {
      const dist = haversineDistance(
        parseFloat(viewedRestaurant.address.latitude),
        parseFloat(viewedRestaurant.address.longitude),
        parseFloat(selectedAddress.latitude),
        parseFloat(selectedAddress.longitude)
      );
      setDistance(dist);
      
      let fee = 0;
      if (dist <= 2) {
        fee = 500;
      } else {
        const additionalDistance = dist - 2;
        fee = 500 + additionalDistance * 300;
      }
      setDeliveryFee(fee);

    } else {
      setDistance(null);
      setDeliveryFee(0);
    }
  }, [viewedRestaurant, selectedAddress]);
  
  const checkoutItems = useMemo(() => {
    return user && order ? order.items : [];
  }, [order, user]);

  const { subtotal, taxes, total, totalInKobo } = useMemo(() => {
    const sub = checkoutItems.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
    const tax = Math.min(sub * 0.05, 500);
    const grandTotal = sub + tax + deliveryFee;
    return {
        subtotal: sub,
        taxes: tax,
        total: grandTotal,
        totalInKobo: Math.round(grandTotal * 100),
    };
  }, [checkoutItems, deliveryFee]);

  const handlePlaceOrder = useCallback(async (transaction: PaystackTransaction) => {
    if (!order || !selectedAddress) return;

    try {
      setIsPlacingOrder(true);
      const orderItemsPayload: OrderItemPayload[] = order.items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
      }));

      const orderPayload: OrderPayload = {
        restaurant_id: order.restaurantId,
        delivery_address_id: selectedAddress.id,
        items: orderItemsPayload,
        payment_reference: transaction.reference,
        delivery_fee: String(deliveryFee),
      };

      await placeOrder(orderPayload);
      updateOrderStatus(order.id, 'Order Placed');
      
      toast({
        title: "Order Placed!",
        description: "Your order has been submitted. We're on it!",
      });

      onClose();
      router.push(`/customer/orders`);

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
  }, [order, selectedAddress, deliveryFee, updateOrderStatus, toast, onClose, router]);

  const onSuccess = useCallback((transaction: PaystackTransaction) => {
    if (transaction.status === 'success') {
      handlePlaceOrder(transaction);
    } else {
      toast({
        title: "Payment Failed",
        description: transaction.message || "Payment was not successful.",
        variant: "destructive",
      });
    }
  }, [handlePlaceOrder, toast]);

  const onClosePaymentModal = useCallback(() => {
    setPaymentReference('');
    toast({
        title: "Payment Cancelled",
        description: "You have cancelled the payment process.",
    });
  }, [toast]);

  const initializePaystackPayment = usePaystackPayment({
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    email: user?.email || '',
    amount: totalInKobo,
    reference: paymentReference,
  });

  const triggerPaymentInitialization = useCallback(async () => {
     if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        toast({ title: "Configuration Error", description: "Paystack public key is not configured.", variant: "destructive" });
        return;
    }

    setIsPlacingOrder(true);

    try {
        const paymentPayload: InitializePaymentPayload = { amount: totalInKobo };
        const paymentResponse = await initializePayment(paymentPayload);
        
        setPaymentReference(paymentResponse.reference);
        
        onClose();
        initializePaystackPayment({
            onSuccess,
            onClose: onClosePaymentModal
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({ title: "Payment Error", description: `Failed to initialize payment: ${message}`, variant: "destructive" });
        setIsPlacingOrder(false);
    }
  }, [totalInKobo, toast, onClose, initializePaystackPayment, onSuccess, onClosePaymentModal]);

  const handlePayment = async () => {
    if (!user || !order) {
        toast({ title: "Please Log In", description: "You need to be logged in to place an order.", variant: "destructive" });
        onClose();
        router.push(`/login?redirect=/customer/dashboard`);
        return;
    }

    if (!user.phone_number) {
        toast({ title: "Phone Number Required", description: "Please add a phone number to your profile before placing an order.", variant: "destructive" });
        onClose();
        router.push('/customer/profile');
        return;
    }

    if (!selectedAddress || distance === null) {
        toast({ title: "Address Required", description: "Please select a delivery address.", variant: "destructive" });
        return;
    }
    
    if (deliveryFee > 2500) {
        setShowHighFeeModal(true);
    } else {
        await triggerPaymentInitialization();
    }
  }

  const handleHighFeeProceed = async () => {
      setShowHighFeeModal(false);
      await triggerPaymentInitialization();
  };
  
  const handleFindCloserBranch = () => {
      if (order) {
          removeUnsubmittedOrder(order.id);
      }
      setShowHighFeeModal(false);
      onClose();
      router.push('/customer/dashboard');
  }

  const handleIncrease = (itemId: string) => {
    if (order) {
      increaseOrderItemQuantity(order.id, itemId);
    }
  };

  const handleDecrease = (itemId: string) => {
    if (order) {
      decreaseOrderItemQuantity(order.id, itemId);
    }
  };

  if (!isClient || !isOpen || !order || checkoutItems.length === 0) {
    if (isOpen && (!order || checkoutItems.length === 0)) {
        onClose();
    }
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AlertDialog open={showHighFeeModal} onOpenChange={setShowHighFeeModal}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>High Delivery Fee</AlertDialogTitle>
                <AlertDialogDescription>
                    This branch is far from you. Your delivery fee is ₦{deliveryFee.toLocaleString()}.
                    Would you like to order from a closer branch instead, or proceed anyway?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={handleFindCloserBranch}>Find Closer Branch</AlertDialogCancel>
                <AlertDialogAction onClick={handleHighFeeProceed}>Proceed Anyway</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddressSelectionModal
        isOpen={isAddressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />
        <DialogContent className="max-w-4xl max-h-[90svh] grid grid-cols-1 md:grid-cols-3 gap-0 p-0">
            <ScrollArea className="md:col-span-2 p-6">
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

                        <div className="space-y-2">
                            <Label>Delivery Address</Label>
                             <div className="text-sm p-3 bg-muted rounded-md border">
                                {selectedAddress ? (
                                    <div className="flex justify-between items-center">
                                      <div>
                                          <p className="font-semibold">{selectedAddress.address_nickname || 'Selected Address'}</p>
                                          <p>{selectedAddress.street_address ? `${selectedAddress.street_address}, ${selectedAddress.city}` : `GPS: ${Number(selectedAddress.latitude)?.toFixed(6)}, ${Number(selectedAddress.longitude)?.toFixed(6)}`}</p>
                                          {selectedAddress.nearest_landmark && <p className="text-xs text-muted-foreground">Landmark: {selectedAddress.nearest_landmark}</p>}
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => setAddressModalOpen(true)}>
                                          <Edit className="h-4 w-4"/>
                                      </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full" onClick={() => setAddressModalOpen(true)}>
                                      Select a delivery address
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </ScrollArea>
            <div className="bg-muted/50 p-6 flex flex-col">
                <Card className="bg-transparent border-0 shadow-none flex-grow">
                    <CardHeader className="px-1">
                      <CardTitle>Order Summary</CardTitle>
                      <CardDescription className="text-xs">
                        From: <span className="font-semibold">{viewedRestaurant?.name || '...'}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-1">
                    <ScrollArea className="max-h-60 pr-4">
                    <div className="space-y-4">
                    {checkoutItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Image src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : "https://placehold.co/48x48.png"} alt={item.name} width={48} height={48} className="rounded-md" />
                                <div>
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleDecrease(item.id)} disabled={item.quantity === 1}>
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
                    </ScrollArea>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₦{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 cursor-help">
                                  Service charge <Info className="h-3 w-3 text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This is what we charge for maintaining this system</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span>₦{taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <span>Delivery Fee</span>
                                {distance !== null && (
                                    <p className="text-xs text-muted-foreground">({distance.toFixed(1)} km)</p>
                                )}
                            </div>
                             <span>
                                {distance === null ? 'Select address' : deliveryFee > 2500 ? 'Distance too far' : `₦${deliveryFee.toFixed(2)}`}
                            </span>
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
                    <Button className="w-full" onClick={handlePayment} disabled={isPlacingOrder || !viewedRestaurant || !selectedAddress || deliveryFee > 2500}>
                        {isPlacingOrder ? "Initializing Payment..." : `Proceed to Pay ₦${total.toFixed(2)}`}
                    </Button>
                </CardFooter>
            </div>
        </DialogContent>
    </Dialog>
  );
}
