
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import OrderStatusTracker from "@/components/dashboard/order-status";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { getCustomerOrders, getOrderDetails } from "@/lib/api";
import type { Order, CustomerOrder, OrderDetail } from "@/lib/types";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";


export default function CustomerOrdersPage() {
    const { orders: unsubmittedLocalOrders } = useOrder();
    const { toast } = useToast();
    const [fetchedOrders, setFetchedOrders] = useState<CustomerOrder[]>([]);
    const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

    const handleCheckout = (order: Order) => {
        setSelectedOrder(order);
        setCheckoutOpen(true);
    };

    const handleAccordionChange = async (orderId: string) => {
        if (orderDetails[orderId] || !orderId) {
            return;
        }
        setIsDetailsLoading(orderId);
        try {
            const details = await getOrderDetails(orderId);
            setOrderDetails(prev => ({...prev, [orderId]: details}));
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not load order details.",
                variant: "destructive"
            });
        } finally {
            setIsDetailsLoading(null);
        }
    }

    const unsubmittedOrders = unsubmittedLocalOrders.filter(o => o.status === 'unsubmitted');
    const activeOrders = fetchedOrders.filter(o => o.status !== 'unsubmitted' && o.status !== 'Delivered' && o.status !== 'Cancelled');
    const pastOrders = fetchedOrders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

    return (
        <div className="container py-12">
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setCheckoutOpen(false)}
                order={selectedOrder}
            />

            <h1 className="text-3xl font-bold font-headline mb-8">Your Orders</h1>

            {unsubmittedOrders.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Unsubmitted Orders</CardTitle>
                        <CardDescription>These orders are saved but not yet placed. Complete the checkout to submit them.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unsubmittedOrders.map(order => {
                             const total = order.items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
                             return (
                                <div key={order.id} className="flex justify-between items-center p-4 border rounded-md mb-4">
                                    <div>
                                        <p className="font-bold">Order for a restaurant</p>
                                        <p className="text-sm text-muted-foreground">{order.items.length} item(s) - ₦{total.toFixed(2)}</p>
                                    </div>
                                    <Button onClick={() => handleCheckout(order)}>Complete Checkout</Button>
                                </div>
                             )
                        })}
                    </CardContent>
                </Card>
            )}

            <h2 className="text-2xl font-bold font-headline mt-8 mb-4">Active Orders</h2>
            {isLoading ? <Skeleton className="h-24 w-full" /> : activeOrders.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionChange}>
                        {activeOrders.map((order) => {
                        return (
                            <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-muted-foreground">{order.restaurant_name} - {order.created_at}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-primary text-lg">₦{parseFloat(order.total_amount).toFixed(2)}</span>
                                        <Badge variant="secondary">{order.status}</Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {isDetailsLoading === order.id ? <Skeleton className="h-20 w-full" /> : (
                                    <>
                                        <div>
                                        <h4 className="font-semibold mb-4">Items</h4>
                                        {orderDetails[order.id]?.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p>{item.item_name}</p>
                                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p>₦{(parseFloat(item.item_price) * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ))}
                                        </div>
                                        <Separator className="my-6" />
                                        <div>
                                        <h4 className="font-semibold mb-6">Order Status</h4>
                                        <OrderStatusTracker currentStatus={order.status} />
                                        </div>
                                    </>
                                )}
                            </AccordionContent>
                            </AccordionItem>
                        );
                        })}
                    </Accordion>
                    </CardContent>
                </Card>
            ) : <p className="text-muted-foreground">You have no active orders.</p>}


             <h2 className="text-2xl font-bold font-headline mt-8 mb-4">Past Orders</h2>
             {isLoading ? <Skeleton className="h-24 w-full" /> : pastOrders.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full" onValueChange={handleAccordionChange}>
                        {pastOrders.map((order) => {
                        return (
                            <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-muted-foreground">{order.restaurant_name} - {order.created_at}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-lg">₦{parseFloat(order.total_amount).toFixed(2)}</span>
                                        <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className={order.status === 'Delivered' ? "bg-green-600 text-white" : ""}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {isDetailsLoading === order.id ? <Skeleton className="h-20 w-full" /> : (
                                    <div>
                                    <h4 className="font-semibold mb-4">Items</h4>
                                    {orderDetails[order.id]?.items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p>{item.item_name}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p>₦{(parseFloat(item.item_price) * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                    </div>
                                )}
                            </AccordionContent>
                            </AccordionItem>
                        );
                        })}
                    </Accordion>
                    </CardContent>
                </Card>
            ): <p className="text-muted-foreground">You have no past orders.</p>}
        </div>
    );
}
