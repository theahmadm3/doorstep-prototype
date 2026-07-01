
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { User, Order, OrderPayload, OrderItemPayload, Discount } from "@/lib/types";
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
import { placeOrder, initializePayment, applyDiscountCode, getRestaurantDetails } from "@/lib/api";
import { usePushStore, usePushManager } from "@/hooks/use-push-manager";
import { Minus, Plus, Edit, Info, Truck, Package, Trash2, Tag, Bell } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import AddressSelectionModal from "../location/address-selection-modal";
import { haversineDistance } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface RestaurantInfo {
    name: string;
    latitude: string | null;
    longitude: string | null;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    order?: Order | null;
    restaurantInfo?: RestaurantInfo | null;
}

export default function CheckoutModal({ isOpen, onClose, order: initialOrder, restaurantInfo }: CheckoutModalProps) {
  const {
    orders,
    updateOrderStatus,
    increaseOrderItemQuantity,
    decreaseOrderItemQuantity,
    removeUnsubmittedOrder,
    removeOrderItem,
  } = useCartStore();

  const { selectedAddress } = useUIStore();

  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);

  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [showHighFeeModal, setShowHighFeeModal] = useState(false);

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const { isSubscribed, isSubscribing } = usePushStore();
  const { handleSubscribe } = usePushManager();

  // Discount State
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [isDiscountLoading, setIsDiscountLoading] = useState(false);

  const order = initialOrder ? orders.find(o => o.id === initialOrder.id) : null;

  // Fetch restaurant coordinates when restaurantInfo prop is missing (Search page, page refresh)
  const [fetchedRestaurantCoords, setFetchedRestaurantCoords] = useState<{ latitude: string; longitude: string } | null>(null);
  const [isFetchingRestaurantCoords, setIsFetchingRestaurantCoords] = useState(false);

  useEffect(() => {
    if (!restaurantInfo?.latitude && order?.restaurantId && !fetchedRestaurantCoords && !isFetchingRestaurantCoords) {
      setIsFetchingRestaurantCoords(true);
      getRestaurantDetails(order.restaurantId)
        .then(details => {
          if (details.address?.latitude && details.address?.longitude) {
            setFetchedRestaurantCoords({ latitude: details.address.latitude, longitude: details.address.longitude });
          }
        })
        .catch(() => {})
        .finally(() => setIsFetchingRestaurantCoords(false));
    }
  }, [restaurantInfo?.latitude, order?.restaurantId]);

  const effectiveRestaurantLat = restaurantInfo?.latitude ?? fetchedRestaurantCoords?.latitude ?? null;
  const effectiveRestaurantLng = restaurantInfo?.longitude ?? fetchedRestaurantCoords?.longitude ?? null;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const checkoutItems = useMemo(() => {
    return user && order ? order.items : [];
  }, [order, user]);

  useEffect(() => {
    if (isOpen && (!order || checkoutItems.length === 0)) {
      onClose();
    }
  }, [isOpen, order, checkoutItems, onClose]);

  useEffect(() => {
    if (orderType === 'delivery' && effectiveRestaurantLat && effectiveRestaurantLng && selectedAddress?.latitude && selectedAddress?.longitude) {
      const dist = haversineDistance(
        parseFloat(effectiveRestaurantLat),
        parseFloat(effectiveRestaurantLng),
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
  }, [effectiveRestaurantLat, effectiveRestaurantLng, selectedAddress, orderType]);

  const { subtotal, taxes, total, totalInKobo, discountDisplayAmount, itemDiscountTotal } = useMemo(() => {
    const sub = checkoutItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const tax = Math.min(sub * 0.05, 500);
    const fee = orderType === 'delivery' ? deliveryFee : 0;

    // Sum savings from item-level active_discounts (cart stores discounted price already)
    const itemDiscount = checkoutItems.reduce((acc, item) => {
      const optionsPrice = item.options.reduce((s, o) => s + parseFloat(o.price_adjustment), 0);
      const originalTotal = (parseFloat(item.menuItem.price) + optionsPrice) * item.quantity;
      return acc + Math.max(0, originalTotal - item.totalPrice);
    }, 0);

    let discountAmount = 0;
    if (appliedDiscount) {
      if (sub >= appliedDiscount.min_order_value) {
        switch (appliedDiscount.scope_type) {
          case 'order':
            if (appliedDiscount.discount_type === 'percentage') {
              discountAmount = sub * (appliedDiscount.value / 100);
              if (appliedDiscount.max_discount_amount) {
                discountAmount = Math.min(discountAmount, appliedDiscount.max_discount_amount);
              }
            } else {
              discountAmount = appliedDiscount.value;
            }
            break;
          case 'delivery':
            if (orderType === 'delivery') {
              discountAmount = fee;
            }
            break;
          case 'service_fee':
            discountAmount = tax;
            break;
        }
      }
    }

    const totalBeforeDiscount = sub + tax + fee;
    discountAmount = Math.min(discountAmount, totalBeforeDiscount);
    const grandTotal = Math.max(0, totalBeforeDiscount - discountAmount);

    return {
      subtotal: sub,
      taxes: tax,
      total: grandTotal,
      totalInKobo: Math.round(grandTotal * 100),
      discountDisplayAmount: discountAmount,
      itemDiscountTotal: itemDiscount,
    };
  }, [checkoutItems, deliveryFee, orderType, appliedDiscount]);

  const handleApplyDiscount = async () => {
    if (!discountCode || !order) return;
    setIsDiscountLoading(true);

    try {
      const result = await applyDiscountCode(discountCode, order.restaurantId);

      if (!result.is_active) {
        throw new Error("This discount code is no longer active.");
      }
      const now = new Date();
      if (new Date(result.end_date) < now) {
        throw new Error("This discount code has expired.");
      }
      const currentSubtotal = checkoutItems.reduce((acc, item) => acc + item.totalPrice, 0);
      if (currentSubtotal < result.min_order_value) {
        throw new Error(`Discount only applies to orders ₦${result.min_order_value}+`);
      }
      if (result.scope_type === 'delivery' && orderType !== 'delivery') {
        throw new Error("This code is only valid for delivery orders.");
      }

      setAppliedDiscount(result);
      toast({ title: "Discount Applied!", description: result.description || `Code ${result.code} applied.` });
    } catch (error) {
      setAppliedDiscount(null);
      const message = error instanceof Error ? error.message : "The discount code is not valid for this order.";
      toast({ title: "Invalid Code", description: message, variant: "destructive" });
    } finally {
      setIsDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

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
        payment_method: 'card',
        order_type: orderType,
        delivery_fee: orderType === 'delivery' ? deliveryFee : undefined,
        discount_code: appliedDiscount?.code ?? undefined,
      };

      await placeOrder(orderPayload);
      updateOrderStatus(order.id, 'Order Placed');

      toast({
        title: "Order Placed!",
        description: "Your order has been submitted. We're on it!",
      });

      if (!isSubscribed) {
        setShowPushPrompt(true);
      } else {
        onClose();
        navigate('/customer/orders');
      }
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
  }, [order, selectedAddress, updateOrderStatus, toast, onClose, navigate, orderType, deliveryFee, appliedDiscount]);

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
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    email: user?.email || '',
    amount: totalInKobo,
    reference: paymentReference,
  });

  const triggerPaymentInitialization = useCallback(async () => {
    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
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
      navigate(`/?redirect=/customer/dashboard`);
      return;
    }

    if (!user.phone_number) {
      toast({ title: "Phone Number Required", description: "Please add a phone number to your profile before placing an order.", variant: "destructive" });
      onClose();
      navigate('/customer/profile');
      return;
    }

    if (orderType === 'delivery' && !selectedAddress) {
      toast({ title: "Address Required", description: "Please select a delivery address.", variant: "destructive" });
      return;
    }

    if (orderType === 'delivery' && distance === null) {
      toast({ title: "Delivery Unavailable", description: "We couldn't calculate a delivery fee for this location. Please try pickup instead.", variant: "destructive" });
      return;
    }

    if (orderType === 'delivery' && deliveryFee > 2500) {
      setShowHighFeeModal(true);
    } else {
      await triggerPaymentInitialization();
    }
  };

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
    navigate('/customer/dashboard');
  };

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
    if (order) {
      removeOrderItem(order.id, cartItemId);
    }
  };

  const isPaymentDisabled = isPlacingOrder
    || isFetchingRestaurantCoords
    || (orderType === 'delivery' && (!selectedAddress || distance === null || deliveryFee > 2500));

  if (!isOpen || !order || checkoutItems.length === 0) {
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

      <DialogContent className="sm:max-w-md max-h-[90svh] flex flex-col p-0">
        {showPushPrompt ? (
          <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
            <div className="bg-primary/10 rounded-full p-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold">Stay in the loop</h2>
              <p className="text-sm text-muted-foreground">
                Enable push notifications so we can alert you the moment your order is picked up, on its way, or delivered.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                className="w-full"
                onClick={async () => {
                  await handleSubscribe();
                  setShowPushPrompt(false);
                  onClose();
                  navigate('/customer/orders');
                }}
                disabled={isSubscribing}
              >
                <Bell className="mr-2 h-4 w-4" />
                {isSubscribing ? "Enabling…" : "Enable Notifications"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setShowPushPrompt(false);
                  onClose();
                  navigate('/customer/orders');
                }}
              >
                Maybe later
              </Button>
            </div>
          </div>
        ) : (
        <>
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-bold">Checkout</DialogTitle>
          {restaurantInfo?.name && (
            <p className="text-sm text-muted-foreground mt-0.5">From: <span className="font-semibold text-foreground">{restaurantInfo.name}</span></p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">

            {/* Order type selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Order Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors",
                    orderType === 'delivery'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Truck className="h-4 w-4" />
                  Delivery
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors",
                    orderType === 'pickup'
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Package className="h-4 w-4" />
                  Pickup
                </button>
              </div>
            </div>

            {/* Delivery address */}
            {orderType === 'delivery' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Delivery Address</Label>
                <div className="p-3 bg-muted rounded-xl border text-sm">
                  {selectedAddress ? (
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-semibold">{selectedAddress.address_nickname || 'Selected Address'}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {selectedAddress.street_address
                            ? `${selectedAddress.street_address}, ${selectedAddress.city}`
                            : `GPS: ${Number(selectedAddress.latitude)?.toFixed(6)}, ${Number(selectedAddress.longitude)?.toFixed(6)}`}
                        </p>
                        {selectedAddress.nearest_landmark && (
                          <p className="text-xs text-muted-foreground">Landmark: {selectedAddress.nearest_landmark}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setAddressModalOpen(true)}>
                        <Edit className="h-4 w-4" />
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

            <Separator />

            {/* Your Order */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Your Order</Label>
              <div className="space-y-4">
                {checkoutItems.map(item => {
                  const optionsPrice = item.options.reduce((s, o) => s + parseFloat(o.price_adjustment), 0);
                  const originalTotal = (parseFloat(item.menuItem.price) + optionsPrice) * item.quantity;
                  const hasItemDiscount = (item.menuItem.active_discounts?.length ?? 0) > 0 && item.totalPrice < originalTotal - 0.01;
                  return (
                    <div key={item.cartItemId} className="flex gap-3">
                      <img
                        src={(item.menuItem.image_url && item.menuItem.image_url.startsWith('http')) ? item.menuItem.image_url : "https://placehold.co/48x48.png"}
                        alt={item.menuItem.name}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">{item.menuItem.name}</p>
                        {item.options.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.options.map(opt => opt.name).join(', ')}
                          </p>
                        )}
                        {hasItemDiscount && (
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            {item.menuItem.active_discounts![0].description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleDecrease(item.cartItemId)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleIncrease(item.cartItemId)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-sm font-semibold">₦{item.totalPrice.toFixed(2)}</p>
                        {hasItemDiscount && (
                          <p className="text-xs text-muted-foreground line-through">₦{originalTotal.toFixed(2)}</p>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(item.cartItemId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Promo code */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                Promo Code
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={!!appliedDiscount || isDiscountLoading}
                  className="h-10"
                />
                {appliedDiscount ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveDiscount} className="flex-shrink-0">
                    Remove
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyDiscount}
                    disabled={isDiscountLoading || !discountCode}
                    className="flex-shrink-0"
                  >
                    {isDiscountLoading ? "Applying..." : "Apply"}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Price breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₦{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1 text-muted-foreground cursor-help">
                        Service charge <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This fee helps us operate the platform.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="font-medium">₦{taxes.toFixed(2)}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-muted-foreground">Delivery fee</span>
                    {distance !== null && (
                      <p className="text-xs text-muted-foreground">({distance.toFixed(1)} km)</p>
                    )}
                  </div>
                  <span className="font-medium">
                    {isFetchingRestaurantCoords
                      ? 'Calculating...'
                      : distance === null
                        ? (selectedAddress ? 'Unavailable' : 'Select address')
                        : deliveryFee > 2500
                          ? 'Distance too far'
                          : `₦${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
              )}
              {itemDiscountTotal > 0.01 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Item discounts
                  </span>
                  <span>-₦{itemDiscountTotal.toFixed(2)}</span>
                </div>
              )}
              {appliedDiscount && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Promo ({appliedDiscount.code})</span>
                  <span>-₦{discountDisplayAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₦{total.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t flex-shrink-0">
          <Button
            className="w-full h-12 rounded-full font-semibold text-base"
            onClick={handlePayment}
            disabled={isPaymentDisabled}
          >
            {isPlacingOrder ? "Initializing Payment..." : isFetchingRestaurantCoords ? "Calculating fee..." : `Pay ₦${total.toFixed(2)}`}
          </Button>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
