
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import OrderStatusTracker from "@/components/dashboard/order-status";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/hooks/use-order";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getRestaurants } from "@/lib/api";
import type { Restaurant, Order } from "@/lib/types";
import CheckoutModal from "@/components/checkout/checkout-modal";


export default function CustomerOrdersPage() {
    const { orders } = useOrder();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isCheckoutOpen, setCheckoutOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const fetchRestaurants = async () => {
            const data = await getRestaurants();
            setRestaurants(data);
        }
        fetchRestaurants();
    }, []);

    const handleCheckout = (order: Order) => {
        setSelectedOrder(order);
        setCheckoutOpen(true);
    };

    const unsubmittedOrders = orders.filter(o => o.status === 'unsubmitted');
    const activeOrders = orders.filter(o => o.status !== 'unsubmitted' && o.status !== 'Delivered' && o.status !== 'Cancelled');
    const pastOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled');
    
    if (restaurants.length === 0 && orders.length > 0) {
        return <div>Loading restaurant info...</div>;
    }

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
                             const restaurant = restaurants.find(r => r.id === order.restaurantId);
                             const total = order.items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
                             return (
                                <div key={order.id} className="flex justify-between items-center p-4 border rounded-md mb-4">
                                    <div>
                                        <p className="font-bold">Order for {restaurant?.name || 'Unknown Restaurant'}</p>
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
            {activeOrders.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                        {activeOrders.map((order) => {
                        const restaurant = restaurants.find(r => r.id === order.restaurantId);
                        return (
                            <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-primary text-lg">₦{order.total.toFixed(2)}</span>
                                        <Badge variant="secondary">{order.status}</Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <div>
                                <h4 className="font-semibold mb-4">Items</h4>
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <Image src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : "https://placehold.co/50x50.png"} alt={item.name} width={50} height={50} className="rounded-md" />
                                            <div>
                                                <p>{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p>₦{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                                </div>
                                <Separator className="my-6" />
                                <div>
                                <h4 className="font-semibold mb-6">Order Status</h4>
                                <OrderStatusTracker currentStatus={order.status} />
                                </div>
                            </AccordionContent>
                            </AccordionItem>
                        );
                        })}
                    </Accordion>
                    </CardContent>
                </Card>
            ) : <p className="text-muted-foreground">You have no active orders.</p>}


             <h2 className="text-2xl font-bold font-headline mt-8 mb-4">Past Orders</h2>
             {pastOrders.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                        {pastOrders.map((order) => {
                        const restaurant = restaurants.find(r => r.id === order.restaurantId);
                        return (
                            <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-left">
                                        <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-lg">₦{order.total.toFixed(2)}</span>
                                        <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className={order.status === 'Delivered' ? "bg-green-600 text-white" : ""}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <div>
                                <h4 className="font-semibold mb-4">Items</h4>
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <Image src={(item.image_url && item.image_url.startsWith('http')) ? item.image_url : "https://placehold.co/50x50.png"} alt={item.name} width={50} height={50} className="rounded-md" />
                                            <div>
                                                <p>{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p>₦{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                                </div>
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
