
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Package, DollarSign, Check, X, Phone, Satellite, MapPin, Building, PackageCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableRiderOrders, performRiderAction } from "@/lib/api";
import { RiderOrderBatch, PaginatedResponse } from "@/lib/types";
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
        <CardContent className="space-y-3">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2 rounded-md border p-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </CardContent>
    </Card>
);

const LocationErrorCard = () => (
    <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle />
                Location Access Required
            </CardTitle>
            <CardDescription>
                We can't fetch available orders without access to your location.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Please enable location services for this app in your browser or device settings to start receiving delivery opportunities.
            </p>
        </CardContent>
    </Card>
);

export default function RiderDashboardPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const locationStatus = useRiderLocation();

    // Only enable the query if location is connected
    const isLocationReady = locationStatus.status === 'connected';

    const { data: availableBatches, isLoading, isError, refetch } = useQuery<PaginatedResponse<RiderOrderBatch>, Error>({
        queryKey: ['availableRiderOrders'],
        queryFn: () => getAvailableRiderOrders(),
        enabled: isLocationReady, // This is the critical change
        refetchOnWindowFocus: false,
        onError: () => {
            toast({
                title: "Error fetching orders",
                description: "Could not retrieve available deliveries.",
                variant: "destructive"
            });
        }
    });
    
    const totalAvailableOrders = availableBatches?.result.reduce((acc, batch) => acc + batch.batch_count, 0) || 0;

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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">Rider Dashboard</h1>
                <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading || !isLocationReady}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Deliveries</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{totalAvailableOrders}</div>}
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

            {!isLocationReady ? (
                <LocationErrorCard />
            ) : isLoading ? (
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
                        <CardDescription>Accept a new delivery to get started. Batches are grouped by restaurant.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {availableBatches && availableBatches.result.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {availableBatches.result.map((batch) => (
                                    <AccordionItem value={batch.restaurant_id} key={batch.restaurant_id}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className='flex items-center gap-4'>
                                                <div className='p-3 bg-muted rounded-full'>
                                                    <Building className='h-5 w-5 text-primary' />
                                                </div>
                                                <div>
                                                    <h3 className='font-bold text-lg'>{batch.restaurant_name}</h3>
                                                    <p className='text-sm text-muted-foreground'>{batch.batch_count} {batch.batch_count > 1 ? "orders" : "order"} available</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className='space-y-4 p-4 bg-muted/50 rounded-lg'>
                                                {batch.orders.map(order => (
                                                    <Card key={order.id}>
                                                        <CardContent className='p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                                                            <div className='space-y-1'>
                                                                <p className='font-semibold'>To: {order.customer_name}</p>
                                                                <p className='text-sm text-muted-foreground flex items-center gap-1'><MapPin className='h-3 w-3'/> {order.distance_to_order.toFixed(1)} km away</p>
                                                                <p className='text-sm text-muted-foreground flex items-center gap-1'><Phone className='h-3 w-3'/> {order.customer_phone}</p>
                                                            </div>
                                                            <div className="flex-shrink-0 flex gap-2 self-end sm:self-center">
                                                                <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => handleAccept(order.id)} disabled={actionMutation.isPending}>
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleReject(order.id)} disabled={actionMutation.isPending}>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <PackageCheck className='mx-auto h-12 w-12 text-gray-400 mb-4' />
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
