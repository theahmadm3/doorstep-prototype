
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bike, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orders as mockOrders, restaurants, users } from "@/lib/data";
import { format } from "date-fns";
import type { Order } from "@/lib/types";

// Helper to add mock customer/restaurant data to orders
const enrichedOrders = mockOrders.map(order => {
    const restaurant = restaurants.find(r => r.id === parseInt(order.restaurantId));
    const customer = users.find(u => u.id === parseInt(order.customerId || '0'));
    return {
        ...order,
        restaurant_name: restaurant?.name || "Unknown Restaurant",
        customer_name: customer?.name || "Unknown Customer",
        customer_phone: "08012345678", // Mock phone
        delivery_address_str: "123 Foodie Lane, Ikeja, Lagos", // Mock address
        total_amount: order.total.toFixed(2),
        created_at: format(new Date(order.date), "dd MMM yyyy, hh:mm a")
    }
});

const OrderTable = ({ orders, title, description, actionButton }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No orders in this category.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                {actionButton && <TableHead>Action</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id}</TableCell>
                                    <TableCell>{order.restaurant_name}</TableCell>
                                    <TableCell>
                                        <div>{order.customer_name}</div>
                                        <div className="text-xs text-muted-foreground">{order.customer_phone}</div>
                                    </TableCell>
                                    <TableCell>{order.delivery_address_str}</TableCell>
                                    <TableCell>₦{order.total_amount}</TableCell>
                                    <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                    {actionButton && (
                                        <TableCell>
                                            {actionButton(order)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};


export default function AdminOrdersPage() {
    const { toast } = useToast();
    const [orders, setOrders] = useState(enrichedOrders);

    const incomingOrders = orders.filter(o => ["Order Placed", "Vendor Accepted", "Preparing"].includes(o.status));
    const readyForPickupOrders = orders.filter(o => o.status === "Order Ready");
    const riderAssignedOrders = orders.filter(o => o.status === "Rider on the Way");
    const pastOrders = orders.filter(o => !["Order Placed", "Vendor Accepted", "Preparing", "Order Ready", "Rider on the Way"].includes(o.status));

    const handleAssignRider = (orderId: string) => {
        // This is a mock action. In a real app, this would call an API.
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Rider on the Way" } : o));
        toast({ title: "Rider Assigned", description: `A rider has been dispatched for order #${orderId}` });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Order Management</h1>
            <Tabs defaultValue="incoming">
                <TabsList>
                    <TabsTrigger value="incoming">Incoming</TabsTrigger>
                    <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
                    <TabsTrigger value="assigned">Rider Assigned</TabsTrigger>
                    <TabsTrigger value="past">Past Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="incoming">
                    <OrderTable
                        orders={incomingOrders}
                        title="Incoming Orders"
                        description="Orders being processed by vendors. This is a read-only view."
                        actionButton={null}
                    />
                </TabsContent>
                <TabsContent value="ready">
                    <OrderTable
                        orders={readyForPickupOrders}
                        title="Ready for Pickup"
                        description="Orders that are prepared and waiting for a rider."
                        actionButton={(order) => (
                            <Button variant="outline" size="sm" onClick={() => handleAssignRider(order.id)}>
                                <Bike className="mr-2 h-4 w-4" /> Assign Rider
                            </Button>
                        )}
                    />
                </TabsContent>
                <TabsContent value="assigned">
                     <OrderTable
                        orders={riderAssignedOrders}
                        title="Rider Assigned"
                        description="Orders currently out for delivery."
                        actionButton={null}
                    />
                </TabsContent>
                <TabsContent value="past">
                    <OrderTable
                        orders={pastOrders}
                        title="Past Orders"
                        description="Completed or cancelled orders."
                        actionButton={null}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
