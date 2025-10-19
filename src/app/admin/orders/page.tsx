
"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bike } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminOrders } from "@/lib/api";
import type { AdminOrder } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderTableProps {
    orders: AdminOrder[];
    title: string;
    description: string;
    actionButton?: (order: AdminOrder) => React.ReactNode;
    isLoading: boolean;
}

const OrderTable = ({ orders, title, description, actionButton, isLoading }: OrderTableProps) => {
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }

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
                                <TableHead>Total</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                                    <TableCell>{order.restaurant_name}</TableCell>
                                    <TableCell>{order.customer_name}</TableCell>
                                    <TableCell>₦{parseFloat(order.total_amount).toFixed(2)}</TableCell>
                                    <TableCell>{order.payment_method || 'N/A'}</TableCell>
                                    <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                    <TableCell>{order.created_at}</TableCell>
                                    <TableCell>
                                        {actionButton && actionButton(order)}
                                    </TableCell>
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
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (isFetching) return;
        setIsFetching(true);
        try {
            const data = await getAdminOrders();
            setOrders(data);
        } catch (error) {
            toast({
                title: "Error fetching orders",
                description: "Could not retrieve the order list. Please try again later.",
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

    const statusOrder = { 'Pending': 1, 'Accepted': 2, 'Preparing': 3, 'Ready for Pickup': 4 };

    const pendingOrders = orders
        .filter(o => ["Pending", "Accepted", "Preparing", "Ready for Pickup"].includes(o.status))
        .sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99));

    const riderAssignedOrders = orders.filter(o => o.status === "Rider on the Way");
    
    const pastOrders = orders.filter(o => !["Pending", "Accepted", "Preparing", "Ready for Pickup", "Rider on the Way"].includes(o.status));

    const handleAssignRider = (orderId: string) => {
        // This is a mock action for now.
        // TODO: Replace with API call
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Rider on the Way" } : o));
        toast({ title: "Rider Assigned", description: `A rider has been dispatched for order #${orderId.slice(0,8)}` });
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Order Management</h1>
            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending Orders</TabsTrigger>
                    <TabsTrigger value="assigned">Rider Assigned</TabsTrigger>
                    <TabsTrigger value="past">Past Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    <OrderTable
                        orders={pendingOrders}
                        title="Pending Orders"
                        description="Orders being processed by vendors and awaiting rider assignment."
                        actionButton={(order) => 
                            order.status === 'Ready for Pickup' ? (
                                <Button variant="outline" size="sm" onClick={() => handleAssignRider(order.id)}>
                                    <Bike className="mr-2 h-4 w-4" /> Assign Rider
                                </Button>
                            ) : null
                        }
                        isLoading={isLoading}
                    />
                </TabsContent>
                <TabsContent value="assigned">
                     <OrderTable
                        orders={riderAssignedOrders}
                        title="Rider Assigned"
                        description="Orders currently out for delivery."
                        isLoading={isLoading}
                    />
                </TabsContent>
                <TabsContent value="past">
                    <OrderTable
                        orders={pastOrders}
                        title="Past Orders"
                        description="Completed or cancelled orders."
                        isLoading={isLoading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
