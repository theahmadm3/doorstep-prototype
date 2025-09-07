
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orders as mockOrders } from "@/lib/data";
import { CheckCircle, Clock, Utensils, ThumbsUp, Bike, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import type { Order } from "@/lib/types";

const ITEMS_PER_PAGE = 5;

const OrderTable = ({ title, description, orders, actions, currentPage, onPageChange, totalPages }) => {
    if (orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">No orders in this category.</p>
                </CardContent>
            </Card>
        );
    }

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
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>Customer #{order.customerId}</TableCell>
                                <TableCell>
                                    <Badge variant={order.status === 'Preparing' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                                </TableCell>
                                <TableCell>₦{order.total.toFixed(2)}</TableCell>
                                <TableCell className="space-x-2">
                                    {actions(order)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 px-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
             )}
        </Card>
    );
};


export default function VendorOrdersPage() {
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 60000);
        // In a real app, you would fetch data here:
        // fetchOrders().then(setOrders);
        return () => {
            clearInterval(interval);
        };
    }, [time]);

    const incomingOrders = orders.filter(o => o.status === "Order Placed");
    const ongoingOrders = orders.filter(o => o.status === "Vendor Accepted" || o.status === "Preparing");
    const readyForPickupOrders = orders.filter(o => o.status === "Order Ready");
    const pastOrders = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled" || o.status === "Rider Assigned" || o.status === "Rider on the Way");

    const [pages, setPages] = useState({
        incoming: 1,
        ongoing: 1,
        ready: 1,
        past: 1,
    });
    
    const handlePageChange = (category, page) => {
        setPages(prev => ({ ...prev, [category]: page }));
    };

    const paginate = (data, page) => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return data.slice(start, end);
    };

    const paginatedIncoming = paginate(incomingOrders, pages.incoming);
    const paginatedOngoing = paginate(ongoingOrders, pages.ongoing);
    const paginatedReady = paginate(readyForPickupOrders, pages.ready);
    const paginatedPast = paginate(pastOrders, pages.past);

    const totalPages = {
        incoming: Math.ceil(incomingOrders.length / ITEMS_PER_PAGE),
        ongoing: Math.ceil(ongoingOrders.length / ITEMS_PER_PAGE),
        ready: Math.ceil(readyForPickupOrders.length / ITEMS_PER_PAGE),
        past: Math.ceil(pastOrders.length / ITEMS_PER_PAGE),
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Manage Orders</h1>

            <Tabs defaultValue="incoming">
                <TabsList>
                    <TabsTrigger value="incoming">
                        Incoming <Badge className="ml-2">{incomingOrders.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                    <TabsTrigger value="ready">Ready for Pickup</TabsTrigger>
                    <TabsTrigger value="past">Past Orders</TabsTrigger>
                </TabsList>

                <TabsContent value="incoming">
                     <OrderTable
                        title="Incoming Orders"
                        description="New orders awaiting your confirmation."
                        orders={paginatedIncoming}
                        currentPage={pages.incoming}
                        totalPages={totalPages.incoming}
                        onPageChange={(p) => handlePageChange('incoming', p)}
                        actions={(order) => (
                            <>
                                <Button variant="outline" size="sm">
                                    <ThumbsUp className="mr-2 h-4 w-4" />
                                    Accept
                                </Button>
                                <Button variant="destructive" size="sm">
                                    <ThumbsDown className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}
                    />
                </TabsContent>
                <TabsContent value="ongoing">
                    <OrderTable
                        title="Ongoing Orders"
                        description="Orders you are currently preparing."
                        orders={paginatedOngoing}
                        currentPage={pages.ongoing}
                        totalPages={totalPages.ongoing}
                        onPageChange={(p) => handlePageChange('ongoing', p)}
                        actions={(order) => (
                            order.status === 'Vendor Accepted' ? (
                                <Button variant="outline" size="sm">
                                    <Utensils className="mr-2 h-4 w-4" />
                                    Mark as Preparing
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Ready
                                </Button>
                            )
                        )}
                    />
                </TabsContent>
                 <TabsContent value="ready">
                    <OrderTable
                        title="Ready for Pickup"
                        description="Orders waiting for the rider to pick up."
                        orders={paginatedReady}
                        currentPage={pages.ready}
                        totalPages={totalPages.ready}
                        onPageChange={(p) => handlePageChange('ready', p)}
                        actions={(order) => (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bike className="h-4 w-4" /> Waiting for rider...
                            </div>
                        )}
                    />
                </TabsContent>
                 <TabsContent value="past">
                    <OrderTable
                        title="Past Orders"
                        description="Completed or cancelled orders."
                        orders={paginatedPast}
                        currentPage={pages.past}
                        totalPages={totalPages.past}
                        onPageChange={(p) => handlePageChange('past', p)}
                        actions={(order) => (
                            <Badge variant={order.status === 'Delivered' ? 'default' : 'outline'} className={order.status === 'Delivered' ? 'bg-green-600' : ''}>{order.status}</Badge>
                        )}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
