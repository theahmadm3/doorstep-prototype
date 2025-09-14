
"use client";

import { useEffect, useState, useCallback } from "react";
import { getCustomerOrders, confirmOrderDelivery } from "@/lib/api";
import type { CustomerOrder } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CustomerOrderTimeline from "@/components/dashboard/customer-order-timeline";
import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export default function CustomerOrdersPage() {
    const { toast } = useToast();
    const [fetchedOrders, setFetchedOrders] = useState<CustomerOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

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

    const activeOrders = fetchedOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    const pastOrders = fetchedOrders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold font-headline mb-8">Your Orders</h1>

            <h2 className="text-2xl font-bold font-headline mt-8 mb-4">Active Orders</h2>
            {isLoading ? (
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ) : activeOrders.length > 0 ? (
                 <div className="space-y-6">
                    {activeOrders.map((order) => (
                        <CustomerOrderTimeline
                            key={order.id}
                            order={order}
                            onConfirmDelivery={handleConfirmDelivery}
                            isConfirming={confirmingOrderId === order.id}
                        />
                    ))}
                </div>
            ) : <p className="text-muted-foreground">You have no active orders.</p>}


             <h2 className="text-2xl font-bold font-headline mt-12 mb-4">Past Orders</h2>
             {isLoading ? (
                <Skeleton className="h-24 w-full" />
             ) : pastOrders.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                       {pastOrders.map((order) => (
                           <CustomerOrderTimeline
                                key={order.id}
                                order={order}
                                isPastOrder
                           />
                        ))}
                    </Accordion>
                    </CardContent>
                </Card>
            ): <p className="text-muted-foreground">You have no past orders.</p>}
        </div>
    );
}
