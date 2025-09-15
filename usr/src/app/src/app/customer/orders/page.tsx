
"use client";

import { useEffect, useState, useCallback } from "react";
import { getCustomerOrders, confirmOrderDelivery, getOrderDetails } from "@/lib/api";
import type { CustomerOrder, OrderDetail, Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CustomerOrderTimeline from "@/components/dashboard/customer-order-timeline";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-order";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CheckoutModal from "@/components/checkout/checkout-modal";

const OrderList = ({ title, orders, onConfirmDelivery, isConfirming, isPastOrder, isLoading, onToggle, orderDetails, loadingDetailsId }) => {
    if (isLoading) {
        return (
            <div>
                <h2 className="text-2xl font-bold font-headline mt-8 mb-4">{title}</h2>
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold font-headline mt-8 mb-4">{title}</h2>
                <p className="text-muted-foreground">You have no {isPastOrder ? 'past' : 'active'} orders.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mt-8 mb-4">{title}</h2>
            <Card>
                <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full" onValueChange={onToggle}>
                        {orders.map((order) => (
                            <AccordionItem value={order.id} key={order.id}>
                                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="text-left">
                                            <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-sm text-muted-foreground">{order.restaurant_name} - {order.created_at}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-lg hidden sm:inline-block">₦{parseFloat(order.total_amount).toFixed(2)}</span>
                                            <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className={order.status === 'Delivered' ? "bg-green-600 text-white" : ""}>
                                                {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                     <CustomerOrderTimeline
                                        order={order}
                                        details={orderDetails[order.id]}
                                        isLoadingDetails={loadingDetailsId === order.id}
                                        onConfirmDelivery={onConfirmDelivery}
                                        isConfirming={isConfirming === order.id}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
};


export default function CustomerOrdersPage() {
    const { toast } = useToast();
    const { orders: unplacedOrders } = useOrder();
    const [fetchedOrders, setFetchedOrders] = useState<CustomerOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail>>({});
    const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
    
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [orderForCheckout, setOrderForCheckout] = useState<Order | null>(null);

     const fetchOrders = useCallback(async () => {
        if (isFetching) return;
        setIsFetching(true);
        try {
            const data = await getCustomerOrders();
            setFetchedOrders(data);
        } catch (error) {
             toast({
                title: "Error fetching orders",
                description: "Could not retrieve your order history. Please try again later.",
                variant: "destructive"
             });
        } finally {
            setIsFetching(false);
            if (isLoading) setIsLoading(false);
        }
    }, [isFetching, toast, isLoading]);

    useEffect(() => {
        fetchOrders(); // Initial fetch
        const interval = setInterval(fetchOrders, 60000); // Poll every 60 seconds
        return () => clearInterval(interval); // Cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleAccordion = async (orderId: string | undefined) => {
        if (!orderId || orderDetails[orderId]) {
            return; // Don't fetch if it's already loaded or if closing
        }
        setLoadingDetailsId(orderId);
        try {
            const details = await getOrderDetails(orderId);
            setOrderDetails(prev => ({ ...prev, [orderId]: details }));
        } catch (error) {
             toast({
                title: "Error",
                description: "Could not load order details.",
                variant: "destructive",
            });
        } finally {
            setLoadingDetailsId(null);
        }
    };

    const handleConfirmDelivery = async (orderId: string) => {
        setConfirmingOrderId(orderId);
        try {
            await confirmOrderDelivery(orderId);
            
            setFetchedOrders(prevOrders =>
                prevOrders.map(o =>
                    o.id === orderId ? { ...o, status: 'Delivered' } : o
                )
            );

            toast({
                title: "Delivery Confirmed",
                description: "Thank you for confirming your delivery!",
            });
        } catch (error) {
            toast({
                title: "Confirmation Failed",
                description: "Could not confirm delivery. Please try again.",
                variant: "destructive",
            });
        } finally {
            setConfirmingOrderId(null);
        }
    };

    const handleCompleteOrder = (order: Order) => {
        setOrderForCheckout(order);
        setCheckoutOpen(true);
    }

    const activeOrders = fetchedOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const pastOrders = fetchedOrders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');
    const unsubmittedOrders = unplacedOrders.filter(o => o.status === 'unsubmitted');

    return (
        <div className="container py-12">
            <CheckoutModal
				isOpen={isCheckoutOpen}
				onClose={() => setCheckoutOpen(false)}
				order={orderForCheckout}
			/>
            <h1 className="text-3xl font-bold font-headline mb-8">Your Orders</h1>

            {unsubmittedOrders.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-2xl font-bold font-headline mb-4">Unplaced Orders</h2>
                    <div className="space-y-4">
                        {unsubmittedOrders.map(order => (
                            <Card key={order.id} className="shadow-md">
                                <CardHeader>
                                    <CardTitle>Order for Restaurant</CardTitle>
                                    <CardDescription>You have unplaced items in your cart.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <Image src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : "https://placehold.co/48x48.png"} alt={item.name} width={40} height={40} className="rounded-md" />
                                                    <span>{item.quantity} x {item.name}</span>
                                                </div>
                                                <span className="font-medium">₦{(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="flex justify-between font-bold">
                                       <span>Total</span>
                                       <span>₦{order.total.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => handleCompleteOrder(order)}>
                                        Complete Order
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            <OrderList
                title="Active Orders"
                orders={activeOrders}
                onConfirmDelivery={handleConfirmDelivery}
                isConfirming={confirmingOrderId}
                isPastOrder={false}
                isLoading={isLoading}
                onToggle={handleToggleAccordion}
                orderDetails={orderDetails}
                loadingDetailsId={loadingDetailsId}
            />

            <OrderList
                title="Past Orders"
                orders={pastOrders}
                isPastOrder={true}
                isLoading={isLoading}
                onToggle={handleToggleAccordion}
                orderDetails={orderDetails}
                loadingDetailsId={loadingDetailsId}
            />
        </div>
    );
}
