
"use client";

import { useState } from "react";
import { getCustomerOrders, confirmOrderDelivery, getOrderDetails } from "@/lib/api";
import type { CustomerOrder, OrderDetail, Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CustomerOrderTimeline from "@/components/dashboard/customer-order-timeline";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useCartStore } from "@/stores/useCartStore";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface OrderListProps {
    title: string;
    orders: CustomerOrder[];
    onConfirmDelivery: (orderId: string) => void;
    isConfirming: boolean;
    isPastOrder: boolean;
    isLoading: boolean;
    onToggle: (value: string) => void;
    orderDetails: Record<string, OrderDetail | null>;
    loadingDetailsId: string | null;
}

const OrderList = ({ title, orders, onConfirmDelivery, isConfirming, isPastOrder, isLoading, onToggle, orderDetails, loadingDetailsId }: OrderListProps) => {
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
                                        details={orderDetails[order.id] ?? undefined}
                                        isLoadingDetails={loadingDetailsId === order.id}
                                        onConfirmDelivery={onConfirmDelivery}
                                        isConfirming={isConfirming}
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
    const { orders: unplacedOrders, removeUnsubmittedOrder } = useCartStore();
    const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail>>({});
    const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [orderForCheckout, setOrderForCheckout] = useState<Order | null>(null);

    const { data: fetchedOrders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['customerOrders'],
        queryFn: getCustomerOrders,
        refetchInterval: 30000, // Poll every 30 seconds
    });

    const { mutate: confirmDeliveryMutation, isPending: isConfirming } = useMutation({
        mutationFn: confirmOrderDelivery,
        onSuccess: (data, orderId) => {
            queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
            toast({
                title: "Delivery Confirmed",
                description: "Thank you for confirming your delivery!",
            });
        },
        onError: (error) => {
             toast({
                title: "Confirmation Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const handleToggleAccordion = async (orderId: string | undefined) => {
        if (!orderId || orderDetails[orderId]) {
            return;
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
        confirmDeliveryMutation(orderId);
    };

    const handleCompleteOrder = (order: Order) => {
        setOrderForCheckout(order);
        setCheckoutOpen(true);
    }
    
    const handleDeleteOrder = (orderId: string) => {
        removeUnsubmittedOrder(orderId);
        toast({
            title: "Order Removed",
            description: "The unplaced order has been removed.",
        });
    }

    const pastOrderStatuses = ['Delivered', 'Cancelled', 'Picked Up by Customer', 'Rejected'];
    const activeOrders = fetchedOrders.filter(o => !pastOrderStatuses.includes(o.status));
    const pastOrders = fetchedOrders.filter(o => pastOrderStatuses.includes(o.status));
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
                                    <CardTitle>In-Progress Order</CardTitle>
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
                                <CardFooter className="flex flex-col sm:flex-row gap-2">
                                    <Button className="w-full" onClick={() => handleCompleteOrder(order)}>
                                        Complete Order
                                    </Button>
                                    <Button variant="destructive" className="w-full" onClick={() => handleDeleteOrder(order.id)}>
                                        Cancel Order
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
                isConfirming={!!isConfirming}
                isPastOrder={false}
                isLoading={isLoadingOrders}
                onToggle={handleToggleAccordion}
                orderDetails={orderDetails}
                loadingDetailsId={loadingDetailsId}
            />

            <OrderList
                title="Past Orders"
                orders={pastOrders}
                onConfirmDelivery={handleConfirmDelivery}
                isConfirming={false}
                isPastOrder={true}
                isLoading={isLoadingOrders}
                onToggle={handleToggleAccordion}
                orderDetails={orderDetails}
                loadingDetailsId={loadingDetailsId}
            />
        </div>
    );
}
