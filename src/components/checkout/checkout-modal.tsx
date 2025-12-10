
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { User, Order, OrderPayload, OrderItemPayload } from "@/lib/types";
import type { PaystackTransaction, InitializePaymentPayload } from "@/lib/types/paystack";
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
import { Minus, Plus, Edit, Info, Truck, Package, Trash2 } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import AddressSelectionModal from "../location/address-selection-modal";
import { haversineDistance } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

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
    removeOrderItem,
  } = useCartStore();
  
  const { selectedAddress, viewedRestaurant } = useUIStore();
  
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);

  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [showHighFeeModal, setShowHighFeeModal] = useState(false);
  
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');


  const order = initialOrder ? orders.find(o => o.id === initialOrder.id) : null;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (orderType === 'delivery' && viewedRestaurant?.address && selectedAddress?.latitude && selectedAddress?.longitude) {
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
  }, [viewedRestaurant, selectedAddress, orderType]);
  
  const checkoutItems = useMemo(() => {
    return user && order ? order.items : [];
  }, [order, user]);

  const { subtotal, taxes, total, totalInKobo } = useMemo(() => {
    const sub = checkoutItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const tax = Math.min(sub * 0.05, 500);
    const fee = orderType === 'delivery' ? deliveryFee : 0;
    const grandTotal = sub + tax + fee;
    return {
        subtotal: sub,
        taxes: tax,
        total: grandTotal,
        totalInKobo: Math.round(grandTotal * 100),
    };
  }, [checkoutItems, deliveryFee, orderType]);

  const handlePlaceOrder = useCallback(async (transaction: PaystackTransaction) => {
    if (!order) return;
    if (orderType === 'delivery' && !selectedAddress) return;

    setIsPlacingOrder(true);
    try {
      const orderItemsPayload: OrderItemPayload[] = order.items.map(item => ({
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        selected_options: item.options.map(opt => opt.id),
      }));

      const orderPayload: OrderPayload = {
        restaurant_id: order.restaurantId,
        delivery_address_id: orderType === 'delivery' ? selectedAddress?.id : undefined,
        items: orderItemsPayload,
        payment_method: 'card', // Assuming card payment via Paystack
        order_type: orderType,
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
  }, [order, selectedAddress, updateOrderStatus, toast, onClose, router, orderType]);

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

    if (orderType === 'delivery' && (!selectedAddress || distance === null)) {
        toast({ title: "Address Required", description: "Please select a delivery address.", variant: "destructive" });
        return;
    }
    
    if (orderType === 'delivery' && deliveryFee > 2500) {
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

  const handleIncrease = (cartItemId: string) => {
    if (order) {
      increaseOrderItemQuantity(order.id, cartItemId);
    }
  };

  const handleDecrease = (cartItemId: string) => {
    if (order) {
      decreaseOrderItemQuantity(order.id, cartItemId);
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    if(order) {
      removeOrderItem(order.id, cartItemId);
    }
  }

  const isPaymentDisabled = isPlacingOrder || !viewedRestaurant || (orderType === 'delivery' && (!selectedAddress || deliveryFee > 2500));

  if (!isOpen || !order || checkoutItems.length === 0) {
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
                        
                         <div className="space-y-2">
                            <Label>Order Type</Label>
                            <RadioGroup defaultValue="delivery" value={orderType} onValueChange={(value: 'delivery' | 'pickup') => setOrderType(value)} className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="delivery" id="delivery-modal" className="peer sr-only" />
                                    <Label htmlFor="delivery-modal" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        <Truck className="mb-3 h-6 w-6" />
                                        Delivery
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="pickup" id="pickup-modal" className="peer sr-only" />
                                    <Label htmlFor="pickup-modal" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        <Package className="mb-3 h-6 w-6" />
                                        Pickup
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        {orderType === 'delivery' && (
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
                        )}
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
                        <div key={item.cartItemId} className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <Image src={(item.menuItem.image_url && item.menuItem.image_url.startsWith('http')) ? item.menuItem.image_url : "https://placehold.co/48x48.png"} alt={item.menuItem.name} width={48} height={48} className="rounded-md" />
                                <div>
                                    <p className="font-medium text-sm">{item.menuItem.name}</p>
                                     {item.options.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            {item.options.map(opt => opt.name).join(', ')}
                                        </div>
                                     )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleDecrease(item.cartItemId)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleIncrease(item.cartItemId)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                             <div className="text-right">
                                <p className="text-sm font-semibold">₦{item.totalPrice.toFixed(2)}</p>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(item.cartItemId)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
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
                                <p>This fee helps us operate the platform.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span>₦{taxes.toFixed(2)}</span>
                        </div>
                        {orderType === 'delivery' && (
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
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₦{total.toFixed(2)}</span>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                <CardFooter className="p-1 mt-auto">
                    <Button className="w-full" onClick={handlePayment} disabled={isPaymentDisabled}>
                        {isPlacingOrder ? "Initializing Payment..." : `Proceed to Pay ₦${total.toFixed(2)}`}
                    </Button>
                </CardFooter>
            </div>
        </DialogContent>
    </Dialog>
  );
}
