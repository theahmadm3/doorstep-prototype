
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Package, DollarSign, Check, X, Phone, Satellite, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableRiderOrders, performRiderAction } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRiderLocation } from "@/app/rider/layout";
import { cn } from "@/lib/utils";

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
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Order Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
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
    const queryClient = useQueryClient();
    const locationStatus = useRiderLocation();

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

    const actionMutation = useMutation({
        mutationFn: ({ orderId, action }: { orderId: string, action: 'accept' | 'reject' }) => performRiderAction(orderId, action),
        onSuccess: (_, { action }) => {
            toast({
                title: `Order ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
                description: "Your order list has been updated."
            });
            queryClient.invalidateQueries({ queryKey: ['availableRiderOrders'] });
            queryClient.invalidateQueries({ queryKey: ['riderOrders'] });
        },
        onError: (error, { action }) => {
            toast({
                title: `Failed to ${action} order`,
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleAccept = (orderId: string) => {
        actionMutation.mutate({ orderId, action: 'accept' });
    }

    const handleReject = (orderId: string) => {
        actionMutation.mutate({ orderId, action: 'reject' });
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Rider Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Location Status</CardTitle>
                        <Satellite className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", locationStatus.color)}>{locationStatus.message}</div>
                        <p className="text-xs text-muted-foreground">Live location tracking</p>
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
                                            <TableHead>Restaurant</TableHead>
                                            <TableHead>Distance</TableHead>
                                            <TableHead>Order Type</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {availableOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell>
                                                    <div className="font-medium">{order.restaurant_name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3 text-muted-foreground"/> 
                                                        {order.distance_to_order.toFixed(2)} km
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {order.order_type}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="icon" className="mr-2 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleAccept(order.id)} disabled={actionMutation.isPending}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleReject(order.id)} disabled={actionMutation.isPending}>
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
