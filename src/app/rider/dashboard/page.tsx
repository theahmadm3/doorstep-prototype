
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Package, DollarSign, Check, X, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAvailableRiderOrders } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const AvailableDeliveriesSkeleton = () => (
    <Card>
        <CardHeader>
            <CardTitle>Available Deliveries</CardTitle>
            <CardDescription>Accept a new delivery to get started.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Posted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right space-x-2">
                                <Skeleton className="h-8 w-8 inline-block" />
                                <Skeleton className="h-8 w-8 inline-block" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

export default function RiderDashboardPage() {
    const { toast } = useToast();

    const { data: availableOrders, isLoading, isError } = useQuery({
        queryKey: ['availableRiderOrders'],
        queryFn: getAvailableRiderOrders,
        refetchInterval: 30000, // Poll for new orders every 30 seconds
        onError: () => {
            toast({
                title: "Error fetching orders",
                description: "Could not retrieve available deliveries.",
                variant: "destructive"
            });
        }
    });

    const handleAccept = (orderId: string) => {
        // TODO: Implement API call to accept order
        toast({ title: "Order Accepted (Mock)", description: `Order #${orderId.slice(0, 6)} accepted.` });
    }

    const handleReject = (orderId: string) => {
        // TODO: Implement API call to reject order
        toast({ title: "Order Rejected (Mock)", description: `Order #${orderId.slice(0, 6)} rejected.` });
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Rider Dashboard</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Deliveries</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{availableOrders?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">New opportunities nearby</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">Keep up the great work!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Earnings Today</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦6,250</div>
                        <p className="text-xs text-muted-foreground">Your current payout</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <AvailableDeliveriesSkeleton />
            ) : isError ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Failed to load available orders. Please try again later.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Available Deliveries</CardTitle>
                        <CardDescription>Accept a new delivery to get started.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {availableOrders && availableOrders.length > 0 ? (
                             <div className="relative overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Payout</TableHead>
                                            <TableHead>Posted</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {availableOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">#{order.id.slice(0, 6)}...</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{order.customer.name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3"/> {order.customer.phone}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate">{order.delivery_address_str}</div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    <div>₦{parseFloat(order.total_amount).toFixed(2)}</div>
                                                    <div className="text-xs font-normal text-green-600">(+ ₦{parseFloat(order.delivery_fee).toFixed(2)} fee)</div>
                                                </TableCell>
                                                <TableCell>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="icon" className="mr-2 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleAccept(order.id)}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleReject(order.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>There are no available deliveries right now.</p>
                                <p className="text-xs">Check back soon for new opportunities.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
